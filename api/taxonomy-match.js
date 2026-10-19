// Vercel Function for the Provenance Map (same logic as the local Vite middleware).
import { handleTaxonomyMatch } from '../server/taxonomyMatch.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handleTaxonomyMatch(payload);
  return Response.json(body, { status });
}
