// Shared Claude call for the ProofVault backends (local Vite middleware and Vercel functions).
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod';

// CLAUDE_MODEL lets a gateway use its own model name (e.g. OpenRouter: anthropic/claude-opus-5.5).
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
// When ANTHROPIC_BASE_URL points at a gateway, Anthropic-only request features may not be passed through,
// so the request asks for JSON in the prompt and validates it here instead.
const VIA_GATEWAY = !!process.env.ANTHROPIC_BASE_URL;

let client;

async function askDirect({ schema, system, content, effort, timeout }) {
  const response = await client.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: 'user', content }],
    },
    { timeout }
  );
  if (response.stop_reason === 'refusal') return { error: { status: 422, body: { error: 'Request declined by the model' } } };
  if (!response.parsed_output) return { error: { status: 502, body: { error: `No structured output (stop_reason: ${response.stop_reason})` } } };
  return { value: { result: response.parsed_output, model: response.model } };
}

async function askViaGateway({ schema, system, content, timeout }) {
  const response = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 16000,
      system: `${system}\n\nRespond with a single JSON object only (no prose, no code fences) matching this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`,
      messages: [{ role: 'user', content }],
    },
    { timeout }
  );
  if (response.stop_reason === 'refusal') return { error: { status: 422, body: { error: 'Request declined by the model' } } };
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  let data;
  try {
    data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    return { error: { status: 502, body: { error: `Model did not return JSON (stop_reason: ${response.stop_reason})` } } };
  }
  const checked = schema.safeParse(data);
  if (!checked.success) return { error: { status: 502, body: { error: 'Model JSON did not match the expected shape' } } };
  return { value: { result: checked.data, model: response.model } };
}

// Returns { value: { result, model } } or { error: { status, body } }; never throws.
export async function askStructured({ schema, system, content, effort = 'medium', timeout = 90_000, tag }) {
  try {
    client ??= new Anthropic();
    return await (VIA_GATEWAY ? askViaGateway : askDirect)({ schema, system, content, effort, timeout });
  } catch (err) {
    // Errors that never reached the API (no HTTP status) with no key in the environment mean missing credentials.
    if (!(err instanceof Anthropic.APIError) && !err.status && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
      return { error: { status: 503, body: { error: 'No Anthropic API key configured on the server (ANTHROPIC_API_KEY)' } } };
    }
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : err.status ?? 500;
    console.error(`[${tag}]`, status, err.message);
    return { error: { status, body: { error: err.message } } };
  }
}
