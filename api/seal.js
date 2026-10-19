// Vercel Function: seal an approved record into the signed hash chain (same logic as the local Vite middleware).
import { handleSeal } from '../server/ledger.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handleSeal(payload);
  return Response.json(body, { status });
}
