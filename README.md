# ProofVault v0.3 — AI Record Integrity & Provenance Platform

**RIMPA Global Hackathon 2026 MVP** · Aligned to **NAA Information Management Standard**, **ISO 15489-1:2016**, **AS ISO 23081**, and **C2PA 2.1 Content Credentials** · Pattern matching by **Claude Opus 5.5**.

---

## The idea

AI-generated content rarely looks blatantly fake. A post, a policy draft or a clinical note reads calmly — but underneath it may rest on a known misinformation, disinformation or bias pattern. ProofVault does two things:

1. **Provenance Map** — traces any claim through a layered pattern database: **Domain → Sub-domain → Topic → Known pattern**. At each layer the best-fitting node lights up and links to the one above; unrelated branches fade. The final node shows the known pattern, how often it has appeared, and the information-management control to apply. Claims that match nothing are reported as novel and routed to a human verifier. Lenses: **Personal · Enterprise · Government · Healthcare**.
2. **Enterprise IM Gate** — lets Information Managers intercept hallucinations and bias in AI-generated records **before** they enter the official archive (TRIM / EDRMS): inline annotations, version diff, citation graph with C2PA metadata, a compliance checklist and SHA-256 WORM sealing.

The two are joined: the mini Provenance Map in the left column traces the selected finding, its **Fullscreen** button opens the full-screen map, and every audit card has **Trace in Provenance Map**.

---

## 🚀 Quick Start / 运行方式

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Claude Opus 5.5 matching (optional)

Model calls go through a small backend (`server/claude.js`, mounted into the Vite dev server locally via `server/apiPlugin.js` and deployed as Vercel Functions under `api/`). Set either `ANTHROPIC_API_KEY`, or `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN` + `CLAUDE_MODEL` for an Anthropic-compatible gateway such as OpenRouter (see `.env.example`).

```bash
cp .env.example .env.local   # then put your key after ANTHROPIC_API_KEY=
npm run dev
```

- The API key is read only by the server and is never bundled into the browser code; `.env.local` is git-ignored.
- On Vercel, set `ANTHROPIC_API_KEY` in the project's Environment Variables and redeploy.
- Preset claims and records are traced by the built-in matcher. If a model call fails, a typed claim falls back to that matcher, and an upload shows the error instead of creating a record.
- The pattern database (`src/taxonomy.js`), enterprise records and case counts are fictional demo data.

---

## 📄 Upload a new record

**Upload / Ingest AI Record → File Upload** accepts `.txt`, `.md`, `.html`, `.pdf` and `.docx`. The file is read in the browser, split into paragraphs, and reviewed by Claude Opus 5.5 (`server/recordAnalyze.js`, `api/record-analyze.js`), which returns findings by paragraph number, suggested revisions and the key claims to source-check. The result becomes a new record in the queue with the usual audit, diff, provenance and sign-off tools. Long files are capped at 40 paragraphs / 20,000 characters.

Only newly uploaded files and claims typed into the map's "Trace with Claude Opus 5.5" box call the model; preset records and examples never do.
