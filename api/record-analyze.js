// Vercel Function for upload analysis (same logic as the local Vite middleware).
import { handleRecordAnalyze } from '../server/recordAnalyze.js';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { status, body } = await handleRecordAnalyze(payload);
  return Response.json(body, { status });
}
