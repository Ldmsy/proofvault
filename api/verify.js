// Vercel Function: re-verify the whole seal chain (same logic as the local Vite middleware).
import { handleVerify } from '../server/ledger.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handleVerify(payload);
  return Response.json(body, { status });
}
