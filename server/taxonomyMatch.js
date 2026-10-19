// Provenance Map backend: asks Claude to walk the pattern-database taxonomy layer by layer.
// Shared by the local Vite middleware and the Vercel function.
import * as z from 'zod';
import { askStructured } from './claude.js';
import { taxonomyOutline, childrenOf, isChildOf, getNode, LAYER_NAMES } from '../src/taxonomy.js';

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

export async function handleTaxonomyMatch(payload) {
  const claim = payload?.claim?.trim();
  if (!claim) return { status: 400, body: { error: 'Provide a claim to trace' } };
  const r = await askStructured({ schema: PathResult, system: SYSTEM, content: `Claim to trace:\n${claim}`, effort: 'low', tag: 'taxonomy-match' });
  if (r.error) return r.error;
  return { status: 200, body: { path: validPrefix(r.value.result.path), summary: r.value.result.summary, model: r.value.model } };
}
