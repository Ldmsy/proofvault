// Upload analysis backend: Claude reviews a newly uploaded record paragraph by paragraph.
// The client splits the file into numbered paragraphs, so the model returns findings by index
// and never has to reproduce (or alter) the record text.
import * as z from 'zod';
import { askStructured } from './claude.js';

const MAX_PARAGRAPHS = 40;
const MAX_CHARS = 20_000;

const Analysis = z.object({
  title: z.string().describe('Short descriptive title for the record'),
  category: z.enum(['Clinical', 'Policy', 'Corporate', 'Service']).describe('Closest record family'),
  org: z.string().describe('Issuing organisation and unit if stated in the record, otherwise "Not stated in record"'),
  risk: z.enum(['High', 'Medium', 'Low']).describe('Overall risk if archived as-is'),
  sections: z.array(z.string()).describe('One short section label (1-3 words) per paragraph, in paragraph order'),
  findings: z
    .array(
      z.object({
        index: z.number().describe('Paragraph number as given'),
        type: z.enum(['misinfo', 'bias']).describe('misinfo = false, unsupported or fabricated facts/citations; bias = group bias or emotive/misleading framing'),
        severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
        title: z.string().describe('Finding headline, max 8 words'),
        principle: z.string().describe('Information-management principle at risk, one sentence'),
        standards: z.array(z.string()).describe('1-3 relevant standards or laws, e.g. "ISO 15489-1:2016 §5.2.2 Reliability"'),
        rationale: z.string().describe('Why this paragraph was flagged, 1-3 sentences'),
        evidence: z.string().describe('What in the record supports the finding, or which source record is missing'),
        confidence: z.number().describe('0-100'),
        revised: z.string().describe('Suggested replacement for the whole paragraph that removes the problem without inventing facts'),
      })
    )
    .describe('Only paragraphs with a genuine problem; at most one finding per paragraph'),
  citations: z
    .array(
      z.object({
        index: z.number().describe('Paragraph number containing the claim'),
        claim: z.string().describe('The key factual claim, max 8 words'),
        source: z.string().describe('Source the record itself cites for it, or empty string if none'),
        status: z.enum(['partial', 'conflict', 'missing']).describe('partial = source cited but not independently verifiable here; conflict = contradicted elsewhere in the record; missing = no source given'),
        note: z.string().describe('One sentence'),
      })
    )
    .describe('Up to 6 key factual claims in the record'),
});

const SYSTEM = `You are ProofVault's records-integrity reviewer. An information manager has uploaded an AI-generated (or AI-assisted) record before it is archived.
Review it against information-management practice (ISO 15489-1 authenticity, reliability, integrity and usability; AS ISO 23081 metadata; the NAA Information Management Standard; Australian privacy, consumer and anti-discrimination law where relevant).

Flag paragraphs that contain:
- misinformation / disinformation: unsupported statistics, hallucinated results, fabricated quotes or citations, statements contradicted elsewhere in the record;
- bias: group stereotyping, emotive, deflective or falsely reassuring framing.

Rules:
- Judge only what is in the record. You cannot query registers or source systems, so never claim you verified or failed to find a record; say what is unsourced or needs checking.
- Do not invent problems. If the record is sound, return no findings and risk "Low".
- Suggested revisions must not introduce new facts; when a fact is unknown, say it needs confirmation.
- Use the paragraph numbers exactly as given.`;

export async function handleRecordAnalyze(payload) {
  const paragraphs = Array.isArray(payload?.paragraphs) ? payload.paragraphs.filter((p) => typeof p === 'string' && p.trim()) : [];
  if (!paragraphs.length) return { status: 400, body: { error: 'The file has no readable text' } };
  if (paragraphs.length > MAX_PARAGRAPHS || paragraphs.join('').length > MAX_CHARS) {
    return { status: 413, body: { error: `Record too long (max ${MAX_PARAGRAPHS} paragraphs / ${MAX_CHARS.toLocaleString()} characters)` } };
  }
  const numbered = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join('\n\n');
  const r = await askStructured({
    schema: Analysis,
    system: SYSTEM,
    content: `File name: ${payload.fileName || 'unnamed'}\n\nRecord paragraphs:\n\n${numbered}`,
    effort: 'medium',
    timeout: 150_000,
    tag: 'record-analyze',
  });
  if (r.error) return r.error;

  // Keep only findings and citations that point at real paragraphs; one finding per paragraph.
  const a = r.value.result;
  const inRange = (i) => Number.isInteger(i) && i >= 1 && i <= paragraphs.length;
  const seen = new Set();
  const findings = a.findings.filter((f) => inRange(f.index) && !seen.has(f.index) && seen.add(f.index));
  const citations = a.citations.filter((c) => inRange(c.index)).slice(0, 6);
  return { status: 200, body: { analysis: { ...a, findings, citations }, model: r.value.model } };
}
