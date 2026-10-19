# ProofVault v0.3 — AI Record Integrity & Provenance Platform

**RIMPA Global Hackathon 2026 MVP** · Aligned to **NAA Information Management Standard**, **ISO 15489-1:2016**, **AS ISO 23081**, and **C2PA 2.1 Content Credentials** · Pattern matching by **Claude Opus 5.5**.

---

## ProofVault for Health (default view)

Opening the app signs you in as **Priya Natarajan, Health Information Manager at Northside Hospital** — the person who checks every AI-scribed note before it enters the permanent medical record.

- **Worklist** — AI-drafted notes sorted by risk and due time, with tabs for *To review · Waiting on clinician · Ready to lock · Locked*.
- **Note review** — patient banner (MRN, age, allergies); the note with problem paragraphs highlighted; for each issue, the evidence (recording snippet with timestamp, linked hospital records), the known pattern it matches, and a suggested correction. Accept, edit, keep, or **ask the clinician** — the reply lands in the thread and the bell.
- **Sign & lock** — three plain-language checks and a typed signature; the final note is sealed into the Ed25519-signed ledger.
- **Locked records** — every sealed version with a one-click integrity check and a tamper simulation.
- **Import AI note** — upload a file; Claude reviews it paragraph by paragraph and the original draft is locked on arrival.

The earlier multi-sector workspace is still available at `/?classic`; the hospital and banking hand-off flows at `/hospital.html` and `/bank.html`.

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

As soon as an upload is analysed, the **original AI draft is signed into the ProofCore seal ledger** (Ed25519 + hash chain) as its own entry, so any later change to it is detectable; human sign-off then seals the reviewed version as a second entry. The `v1.0` badge shows a lock once the original is sealed.

Only newly uploaded files and claims typed into the map's "Trace with Claude Opus 5.5" box call the model; preset records and examples never do.

---

## 🔐 ProofCore Engine — Source Grounding & Signed Seal Ledger

1. **Source-Record Grounding Check (`/api/check-sources`, `server/sourceCheck.js`, `server/records.js`)** — deterministic 7-rule check against the Authoritative Records Register (`match`, `not_found`, `altered`, `superseded`, `number_mismatch`, `unlinked_result`, `unsourced`, `anachronism`) + character-weighted `Grounded / Ungrounded / Conflict` percentages rendered in the right panel (`src/components/GroundingCheck.jsx`).
2. **Ed25519 Signed Seal Ledger (`/api/seal`, `/api/verify`, `/api/ledger`, `server/ledger.js`)** — real Node `crypto` Ed25519 signatures and append-only SHA-256 hash chain (`prevHash` → `recordHash`), with non-destructive 1-character tamper simulation in the Seal modal.
3. **Standalone Visual Walkthroughs (Header → `Demos`)**:
   - `/proofchain.html` — interactive Grounding + Merkle tree + 3-node tamper consensus walkthrough
   - `/system3d.html` — Three.js 3D 4-layer architecture cutaway (ProofVault UI ↔ API ↔ ProofCore)
   - `/exploded.html` — 5-layer isometric threats vs. defences view
4. **CLI & Automated Tests**:
   ```bash
   npm run proofcore
   npm test
   ```

