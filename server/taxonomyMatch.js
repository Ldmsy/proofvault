// Provenance Map backend: asks Claude to walk the pattern-database taxonomy layer by layer.
// Shared by the local Vite middleware and the Vercel function.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod';
import { taxonomyOutline, childrenOf, isChildOf, getNode, LAYER_NAMES } from '../src/taxonomy.js';

// CLAUDE_MODEL lets a gateway use its own model name (e.g. OpenRouter: anthropic/claude-opus-5.5).
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
// When ANTHROPIC_BASE_URL points at a gateway, Anthropic-only request features may not be passed through,
// so the request asks for JSON in the prompt and validates it here instead.
const VIA_GATEWAY = !!process.env.ANTHROPIC_BASE_URL;

const PathResult = z.object({
  path: z
    .array(
      z.object({
        id: z.string().describe('Node id copied exactly from the database outline'),
        confidence: z.number().describe('0-100: how well the claim fits this node rather than its siblings'),
        reason: z.string().describe('One short sentence on why this node fits'),
      })
    )
    .describe('One node per layer from the top, each a child of the previous. Stop early when no node at the next layer genuinely fits.'),
  summary: z.string().describe('One or two sentences: which known pattern the claim matches (or that none fits) and what a records officer should check'),
});

const SYSTEM = `You classify a claim against ProofVault's misinformation / disinformation / bias pattern database.
The database is a tree with ${LAYER_NAMES.length} layers: ${LAYER_NAMES.join(' → ')}.

Walk down the tree: pick the best domain, then the best child of that domain, and so on. Only choose ids that appear in the outline, each a direct child of the previous choice.
Stop early (return a shorter path) when no node at the next layer genuinely fits — a claim that matches no known pattern is a valid and useful result. Do not force a match.

Database outline (id | label | pattern):
${taxonomyOutline()}`;

let client;

// Keeps the longest prefix of the model's path that is valid in the tree.
function validPrefix(path) {
  const out = [];
  let parent = null;
  for (const step of path) {
    const ok = parent === null ? childrenOf(null).some((n) => n.id === step.id) : isChildOf(step.id, parent);
    if (!ok || !getNode(step.id)) break;
    out.push({ id: step.id, confidence: Math.max(0, Math.min(100, Math.round(step.confidence))), reason: step.reason });
    parent = step.id;
  }
  return out;
}

async function askDirect(claim) {
  const response = await client.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(PathResult) },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Claim to trace:\n${claim}` }],
    },
    { timeout: 90_000 }
  );
  if (response.stop_reason === 'refusal') return { error: { status: 422, body: { error: 'Request declined by the model' } } };
  if (!response.parsed_output) return { error: { status: 502, body: { error: `No structured output (stop_reason: ${response.stop_reason})` } } };
  return { value: { result: response.parsed_output, model: response.model } };
}

const JSON_INSTRUCTION = `\n\nRespond with a single JSON object only (no prose, no code fences) matching this JSON Schema:\n${JSON.stringify(z.toJSONSchema(PathResult))}`;

async function askViaGateway(claim) {
  const response = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM + JSON_INSTRUCTION,
      messages: [{ role: 'user', content: `Claim to trace:\n${claim}` }],
    },
    { timeout: 90_000 }
  );
  if (response.stop_reason === 'refusal') return { error: { status: 422, body: { error: 'Request declined by the model' } } };
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return { error: { status: 502, body: { error: `Model did not return JSON (stop_reason: ${response.stop_reason})` } } };
  }
  const checked = PathResult.safeParse(data);
  if (!checked.success) return { error: { status: 502, body: { error: 'Model JSON did not match the expected shape' } } };
  return { value: { result: checked.data, model: response.model } };
}

export async function handleTaxonomyMatch(payload) {
  const claim = payload?.claim?.trim();
  if (!claim) return { status: 400, body: { error: 'Provide a claim to trace' } };
  try {
    client ??= new Anthropic();
    const parsed = VIA_GATEWAY ? await askViaGateway(claim) : await askDirect(claim);
    if (parsed.error) return parsed.error;
    const out = parsed.value;
    return { status: 200, body: { path: validPrefix(out.result.path), summary: out.result.summary, model: out.model } };
  } catch (err) {
    // Errors that never reached the API (no HTTP status) with no key in the environment mean missing credentials.
    if (!(err instanceof Anthropic.APIError) && !err.status && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      return { status: 503, body: { error: 'No Anthropic API key configured on the server (ANTHROPIC_API_KEY)' } };
    }
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : err.status ?? 500;
    console.error('[taxonomy-match]', status, err.message);
    return { status, body: { error: err.message } };
  }
}
