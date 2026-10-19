import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import apiPlugin from './server/apiPlugin.js';

export default defineConfig(({ mode }) => {
  // Server-only secrets (e.g. ANTHROPIC_API_KEY in .env.local) go to process.env for the SDK;
  // they have no VITE_ prefix, so they are never bundled into the browser code.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  return { plugins: [react(), apiPlugin()] };
});
