// Vercel Function for Live Scan (same logic as the local Vite middleware).
import { handlePoolScan } from '../server/poolScan.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handlePoolScan(payload);
  return Response.json(body, { status });
}
