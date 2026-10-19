# ProofCore: the engine behind ProofVault

## The story in one line

**AI-written content gets a security check before it becomes a record, and a lock after.**

## How a records officer actually uses it

Sarah is a records officer at a council. A colleague used AI to draft a funding policy.

1. **Before it is filed — the check.** Sarah runs the draft through ProofCore. The report says
   48% of the text is grounded in council records and 52% is not. It points at the two
   problems: an "87% of households" figure that no record supports (the nearest real figure is
   48%), and a "Productivity Commission 2025 Energy Hardship Report" that does not exist.
2. **When it is filed — the lock.** She fixes or removes those sentences and approves. ProofCore
   seals the final text with her Ed25519 key and chains it to the previous record.
3. **Years later — the proof.** An auditor asks whether the record was changed after approval.
   One verify call re-checks every hash and signature. If anyone changed a single character,
   it shows exactly which record broke.

## Two products, one engine

| | What it is | Who uses it |
|---|---|---|
| **ProofCore** (this folder's `server/` + `tools/`) | The engine: grounding check against an authoritative records register, Ed25519 seal ledger | Any system, through the API or CLI |
| **ProofVault** (`src/`) | The reviewer's dashboard: provenance map, review queue, sign-off | Records officers |
| **ProofChain demo** (`public/proofchain.html`) | A single-page walkthrough: chatbot → grounding report → three-node archive chain | Pitch and explanation |

ProofCore does not need the ProofVault UI. The same files run as:

- **API** (Vite dev server or Vercel): `/api/check-sources`, `/api/seal`, `/api/verify`, `/api/ledger`
- **CLI**: `npm run proofcore -- check draft.txt`, `seal`, `verify`, `ledger`
  (exit code 2 when a check finds problems, 3 when the chain is broken, so it can gate a
  publishing pipeline or CI job)

That is the defensibility point: the moat is the records knowledge and the integrity layer,
not the screen. It can sit in front of an EDRMS, a mail gateway, or any AI tool.

## The technical moat, in three layers

| Layer | What it stops | How |
|---|---|---|
| 1. Records register (context graph) | Citing reports that do not exist, superseded policies, agencies before they existed | `server/records.js`: which records exist, what they say, whether current, agency dates, facts in systems of record |
| 2. Grounding check | Fabrication, altered quotes, inflated figures, results with no record | `server/sourceCheck.js`: the model may help find claims; verdicts come only from explainable rules. Character-weighted grounded / ungrounded / conflict %, like a similarity report |
| 3. Seal ledger | Changing a record after approval, impersonating a reviewer | `server/ledger.js`: SHA-256 content hash, Ed25519 signature per reviewer, hash chain |

Ungrounded does not mean false. It means no record supports it, so a person must decide.

## API

All endpoints are `POST` with a JSON body.

`/api/check-sources` `{ text, useModel? }` →
`{ grounding: { percent: { grounded, ungrounded, conflict }, sentences: [{ text, status, sourceId }], sources: [{ id, title, percent }] }, claims: [...], summary }`

`/api/seal` `{ docId, title, text, reviewer: { id, name, role }, metadata }` →
`{ index, archiveId, contentHash, prevHash, entryHash, signature, keyId, publicKey, sealedAt }`

`/api/verify` `{}` or `{ tamper: { archiveId, text } }` →
`{ ok, brokenAt, records: [{ archiveId, ok, downstreamOfBreak, checks: { content, signature, link }, reason }] }`

`/api/ledger` `{}` lists entries; `{ action: "reset" }` restores the seed records.

Storage is `.data/` locally (git-ignored) and `/tmp` on Vercel, which resets on cold start,
so run the live demo locally. Demo reviewer keys are generated on first use; in production
they would live in an HSM or on the reviewer's device.

## Wiring ProofVault's UI to ProofCore

Two changes in `src/App.jsx`:

1. In `approve()`, call `/api/seal` instead of building the seal in the browser:
```js
const res = await fetch('/api/seal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ docId: doc.id, title: doc.title, text: workingText(doc),
    reviewer: { id: reviewer.id, name: reviewer.name, role: reviewer.role },
    metadata: { c2paManifest: doc.c2pa.manifest, checklist: doc.checklist } }) });
const e = await res.json();
const seal = { archiveId: e.archiveId, hash: e.contentHash, signature: e.signature, prevHash: e.prevHash,
  sealedAt: e.sealedAt, reviewer: { ...reviewer, keyId: e.keyId },
  storage: 'ProofCore seal ledger · Ed25519-signed hash chain' };
```
2. On ingest (or a "Run grounding check" button), call `/api/check-sources` with the document
   text and show `grounding.percent` next to the provenance score.

Optionally link the demo from the header: `<a href="/proofchain.html">`.

## Wording to keep accurate before judging

"C2PA manifest validated", "WORM immutable" and the ingest progress animation are still
simulated in the UI. Label them as demo, or soften the wording.
