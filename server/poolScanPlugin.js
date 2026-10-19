// Local backend for Live Scan: a Vite middleware that keeps the Anthropic API key server-side
// and asks Claude to decompose user content into the Contamination Pool format.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod';

const MODEL = 'claude-opus-5-5';
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const PoolAnalysis = z.object({
  surfaceTintScore: z.number().describe('0-100: how strongly the surface reading is skewed by the roots below'),
  storyContext: z.string().describe('2-3 sentences: what this content is, why it persuades, and what you could NOT verify'),
  imageCaption: z.string().describe('One line describing the attached media, or stating that no media was attached'),
  visionBoxes: z
    .array(
      z.object({
        x: z.number().describe('Left edge, percent of image width (0-100)'),
        y: z.number().describe('Top edge, percent of image height (0-100)'),
        w: z.number().describe('Width, percent of image width'),
        h: z.number().describe('Height, percent of image height'),
        tone: z.enum(['red', 'orange']).describe('red = mis/disinformation risk, orange = bias or framing'),
        tag: z.string().describe('Short label, max 6 words'),
        finding: z.string().describe('One sentence explaining what in this region is a concern'),
      })
    )
    .describe('0-3 regions of concern in the attached image. Empty array when no image is attached or nothing is wrong.'),
  docExcerpt: z.object({
    title: z.string(),
    stat: z.string().describe('The single most consequential claim, quoted or paraphrased'),
    warning: z.string().describe('Why that claim cannot be relied on as-is, citing an IM principle (e.g. ISO 15489-1 reliability)'),
  }),
  surface: z.object({
    title: z.string().describe('What an everyday reader takes away, phrased as their takeaway'),
    summary: z.string(),
    purifiedTitle: z.string().describe('The takeaway once unsupported claims and framing are removed'),
    purifiedSummary: z.string(),
  }),
  middle: z
    .array(
      z.object({
        label: z.string().describe('2-3 words'),
        title: z.string(),
        modality: z.string().describe('e.g. Language Framing, Visual Selection, Multimodal Fusion'),
        desc: z.string().describe('How this mechanism amplifies the roots into the surface impression'),
      })
    )
    .describe('Exactly 2 propagation mechanisms'),
  roots: z
    .array(
      z.object({
        type: z.string().describe('Misinformation Source | Disinformation Risk | Bias Source | No material contamination found'),
        modality: z.string().describe('Which part of the content: Textual Claim, Image, Document, Framing'),
        title: z.string(),
        confidence: z.number().describe('0-100, your own confidence that this is a real problem'),
        evidence: z.string().describe('What in the submitted content supports this finding, or which source record is missing'),
        detail: z.string(),
        imTip: z.string().describe('Concrete information-management check a records officer should run, starting with "IM Know-How:"'),
      })
    )
    .describe('1-3 root causes, most serious first'),
});

const SYSTEM = `You are ProofVault's provenance analyst, combining information-management practice (ISO 15489-1, AS ISO 23081, NAA Information Management Standard, C2PA content credentials) with careful fact-checking.

You receive a piece of everyday content (headline, text, and optionally an image or PDF) and decompose it into a "contamination pool":
- surface: what an ordinary reader comes away believing,
- middle: two mechanisms that carry problems upward (framing, selective visuals, tone smoothing, cross-modal reinforcement),
- roots: the underlying sources of misinformation, disinformation or bias.

Rules:
- Judge only what is actually in the submitted content. You cannot query registers, EDRMS or C2PA manifests, so never claim you verified or failed to find a record; say a claim is "unsourced in the submitted content" or "needs checking against <record type>" instead.
- If the content is ordinary and well-grounded, say so: give a low surfaceTintScore, a single root of type "No material contamination found" with low confidence, and do not invent problems.
- Bounding boxes must refer to visible regions of the attached image only. Return an empty visionBoxes array when there is no image.
- Write in clear English suitable for a records manager. Keep each field short.`;

function buildContent({ title, text, modalityType, media }) {
  const content = [];
  if (media?.data && IMAGE_TYPES.includes(media.type)) {
    content.push({ type: 'image', source: { type: 'base64', media_type: media.type, data: media.data } });
  } else if (media?.data && media.type === 'application/pdf') {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: media.data } });
  }
  const mediaNote = media?.name
    ? media.data
      ? `Attached file: ${media.name}`
      : `The user named an attachment (${media.name}) in a format that could not be sent for analysis; treat it as unseen.`
    : 'No media attached.';
  content.push({
    type: 'text',
    text: `Modality combination: ${modalityType || 'unspecified'}\n${mediaNote}\n\nHeadline: ${title || '(none)'}\n\nText:\n${text || '(none)'}`,
  });
  return content;
}

async function analyse(client, payload) {
  const response = await client.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(PoolAnalysis) },
      system: SYSTEM,
      messages: [{ role: 'user', content: buildContent(payload) }],
    },
    { timeout: 120_000 }
  );
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error(response.stop_details?.explanation || 'Request declined by the model'), { status: 422 });
  }
  if (!response.parsed_output) {
    throw Object.assign(new Error(`No structured output (stop_reason: ${response.stop_reason})`), { status: 502 });
  }
  return { analysis: response.parsed_output, model: response.model };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Upload too large (max 20 MB)'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function middleware() {
  let client;
  return async (req, res, next) => {
    if (req.url !== '/api/pool-scan') return next();
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return send(405, { error: 'Use POST' });
    try {
      const payload = await readJson(req);
      if (!payload.text?.trim() && !payload.title?.trim() && !payload.media?.data) {
        return send(400, { error: 'Provide a headline, text or a supported attachment' });
      }
      client ??= new Anthropic();
      send(200, await analyse(client, payload));
    } catch (err) {
      // Errors that never reached the API (no HTTP status) with no key in the environment mean missing credentials.
      if (!(err instanceof Anthropic.APIError) && !err.status && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
        console.error('[pool-scan]', err.message);
        return send(503, { error: 'No Anthropic API key configured (set ANTHROPIC_API_KEY in .env.local)' });
      }
      const status = err instanceof Anthropic.APIError ? err.status ?? 502 : err.status ?? 500;
      console.error('[pool-scan]', status, err.message);
      send(status, { error: err.message });
    }
  };
}

export default function poolScanPlugin() {
  return {
    name: 'proofvault-pool-scan',
    configureServer(server) {
      server.middlewares.use(middleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware());
    },
  };
}
