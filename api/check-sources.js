// Vercel Function: check AI text against the Authoritative Records Register (same logic as the local Vite middleware).
import { handleCheckSources } from '../server/sourceCheck.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handleCheckSources(payload);
  return Response.json(body, { status });
}
