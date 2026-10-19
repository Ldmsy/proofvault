# ProofVault v0.2 — AI Record Integrity & Multimodal Provenance Platform

**RIMPA Global Hackathon 2026 MVP** · Aligned to **NAA Information Management Standard**, **ISO 15489-1:2016**, **AS ISO 23081**, and **C2PA 2.1 Content Credentials** · Powered by **Claude Opus 5.5 Multimodal Engine**.

---

## 🌊 The Core Story: One Information Pool, Two Lenses

Why do everyday people fall for subtle bias, misinformation, and disinformation in the AI era?
Because **information is like a water pool**:
- **🟡 At the Top of the Pool (Water Surface — 微微泛黄)**: What an individual citizen, patient, or researcher reads every day — a sleek article with a photo and a chart — rarely looks blatantly fake. It only looks **slightly tinted yellow** (mildly persuasive, calm, seemingly reasonable).
- **🟠 In the Middle Water Column (Propagation & Synthesis — 中层传导)**: Multimodal AI tools pair cropped images with hallucinated statistics, or polish discriminatory drafts into polite bureaucratic phrasing, diluting obvious errors into subtle persuasion.
- **🔴 At the Bottom of the Pool (Pool Floor — 池底深红毒源)**: Sitting in the sediment are the **deep-red root sources** of misinformation, disinformation, and demographic bias — an unverified AI-sharpened photo stripped of C2PA metadata, a fabricated Productivity Commission report, a 10× ASR clinical dictation error, or a biased legacy dataset.

**ProofVault solves this from both ends of the pool:**
1. **🌊 Personal Contamination Pool (`PersonalPool.jsx` · Claude Opus 5.5 Multimodal Lens)**: Helps everyday users X-ray mixed-media content (**Images + PDF Charts/Documents + Article Prose**) and visually trace how **deep-red roots at the bottom of the pool** rise up to tint the **surface yellow** — with one-click pool purification.
2. **🏛️ Enterprise IM Gate (`Queue.jsx` + `Viewer.jsx` + `RightPanel.jsx`)**: Empowers Information Managers (IM) to intercept hallucinations and bias **before** AI-generated records ever sink into the organisation's official archive (TRIM / EDRMS), enforcing **ISO 15489**, **AS ISO 23081**, **C2PA**, and **SHA-256 WORM Sealing**.

---

## 🚀 Quick Start / 运行方式

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Live Scan with Claude Opus 5.5 (optional)

The **`+ Live Scan`** button sends your headline, text and an optional image (JPG/PNG/GIF/WebP) or PDF to a small backend built into the Vite dev server (`server/poolScanPlugin.js`), which calls **Claude Opus 5.5** with structured output and returns a Contamination Pool.

```bash
cp .env.example .env.local   # then put your key after ANTHROPIC_API_KEY=
npm run dev
```

- The API key is read only by the local server and is never bundled into the browser code; `.env.local` is git-ignored.
- If the call fails (no key, no network, timeout), the app automatically shows a **clearly labelled simulated result** so the demo never stalls.
- The built-in preset cases and enterprise records are pre-scripted demo data; only Live Scan runs a real model analysis.

---

## 🎬 4-Act Story Pitch Walkthrough (3–5 Minute Demo Route)

Use the built-in **Pitch Story Arc Bar** at the top of the app to guide Mentors and Judges through our 4-act narrative:

1. **Act I · The Yellow Surface (Everyday Citizen Lens)**:
   - Start in **`Personal Contamination Pool (Opus 5.5)`** on Case 1 (*Viral "Empty Bus Stop" Mixed-Media Article*).
   - Point to the **Top of the Pool (Layer 1 · Yellow Surface)**: show how a local resident named Maya sees a calm, data-backed article claiming northern suburbs don't need the $4.2M subsidy.
2. **Act II · Opus 5.5 Dives to the Red Pool Floor (Multimodal Forensics)**:
   - Click the **Vision Bounding Boxes** on the left image (`C2PA Stripped + AI Inpainting` on the 04:55 AM sign; `Cropped Commuter Queue`) and the **Deep-Red Root Nodes (`Root #1, #2, #3`)** at the bottom of the pool.
   - Click **`Quarantine Red Roots & Purify Pool`** to watch the rising red plumes turn into clean emerald water and reveal the unbiased truth.
   - *(Optional)* Click **`+ Live Scan`** to drop custom text/media and watch **Claude Opus 5.5** build a Contamination Pool live!
3. **Act III · Tracing Upstream to the Enterprise IM Gate**:
   - Click **`Trace to Enterprise IM Gate (doc-pol26) →`** in the right panel (or click **Act III** in the top Story Bar).
   - Show how those exact red roots originated in an unreviewed AI policy draft (`doc-pol26`) and how our **Audit Insight** flags them against **ISO 15489-1**, **Racial Discrimination Act**, and **NAA IM Standard**.
4. **Act IV · Sealing Clean Collective Memory (Clinical & Archival Sign-Off)**:
   - Click **Act IV** (or switch to `Clinical AI Ambient Scribe Note — Patient #4092`), resolve findings (or use **`Edit wording`** / **`Apply all AI fixes`**), inspect the **Provenance Graph & C2PA Credentials**, check the 4-point **IM Sign-off Checklist**, and click **`Approve & Seal`** to issue a live **SHA-256 WORM Archival Certificate**.
