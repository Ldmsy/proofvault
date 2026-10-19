# ProofVault v0.3 — AI Record Integrity & Provenance Platform

**RIMPA Global Hackathon 2026 MVP** · Aligned to **NAA Information Management Standard**, **ISO 15489-1:2016**, **AS ISO 23081**, and **C2PA 2.1 Content Credentials** · Pattern matching by **Claude Opus 5.5**.

---

## The idea

AI-generated content rarely looks blatantly fake. A post, a policy draft or a clinical note reads calmly — but underneath it may rest on a known misinformation, disinformation or bias pattern. ProofVault does two things:

1. **Provenance Map** — traces any claim through a layered pattern database: **Domain → Sub-domain → Topic → Known pattern**. At each layer the best-fitting node lights up and links to the one above; unrelated branches fade. The final node shows the known pattern, how often it has appeared, and the information-management control to apply. Claims that match nothing are reported as novel and routed to a human verifier. Lenses: **Personal · Enterprise · Government · Healthcare**.
2. **Enterprise IM Gate** — lets Information Managers intercept hallucinations and bias in AI-generated records **before** they enter the official archive (TRIM / EDRMS): inline annotations, version diff, citation graph with C2PA metadata, a compliance checklist and SHA-256 WORM sealing.

The two are joined: the mini Provenance Map in the left column traces the selected finding automatically, its **Fullscreen** button opens the full map, and every audit card has **Trace in Provenance Map**.

---

## 🚀 Quick Start / 运行方式

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Claude Opus 5.5 matching (optional)

Map tracing calls a small backend (`server/taxonomyMatch.js` — mounted into the Vite dev server locally via `server/apiPlugin.js`, and deployed as the Vercel Function `api/taxonomy-match.js`). Claude walks the tree and its path is validated against it.

```bash
cp .env.example .env.local   # then put your key after ANTHROPIC_API_KEY=
npm run dev
```

- The API key is read only by the server and is never bundled into the browser code; `.env.local` is git-ignored.
- On Vercel, set `ANTHROPIC_API_KEY` in the project's Environment Variables and redeploy.
- Without a key, or if the call fails, a local keyword matcher is used and the map labels the result accordingly.
- The pattern database (`src/taxonomy.js`), enterprise records and case counts are fictional demo data.

---

## 🎬 4-Act Pitch Walkthrough (3–5 minutes)

Use the **Story Arc** bar at the top of the app:

1. **Act I · A Claim Reaches the Public** — opens the Provenance Map fullscreen on Maya's viral "empty bus stop" post and traces it down to *Cropped "empty service" imagery*.
2. **Act II · Sinking Through the Pattern Database** — traces the "87% of households already received relief" statistic layer by layer to *Unsourced uptake statistics*; point out how unrelated domains fade.
3. **Act III · Tracing Upstream to the Archive Gate** — the same statistic inside the unreviewed AI policy draft (`doc-pol26`); show the audit card's IM principle and evidence, then **Trace in Provenance Map**.
4. **Act IV · Sealing Clean Collective Memory** — on the clinical scribe note (Patient #4092), resolve findings, check the 4-point **IM Sign-off** checklist and **Approve & Seal** to issue a SHA-256 archival certificate.
