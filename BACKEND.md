# ProofVault backend: seal ledger and source check

Two server modules that turn the demo's simulated parts into working ones. Both run in the
Vite dev server (`server/apiPlugin.js`) and as Vercel Functions (`api/*.js`). No new
dependencies: signing uses Node's built-in `crypto`.

| Module | Files | What it does |
|---|---|---|
| Seal ledger | `server/ledger.js` | Real Ed25519 signatures per reviewer; every seal includes the previous seal's hash (append-only hash chain); full re-verification, with tamper simulation |
| Source check | `server/sourceCheck.js`, `server/records.js` | Checks AI text against an Authoritative Records Register with deterministic rules. Optional Claude extraction finds implicit claims; verdicts always come from the rules |

All endpoints are `POST` with a JSON body.

## Seal ledger

### `POST /api/seal`
```json
{ "docId": "doc-pol26", "title": "…", "text": "<final record text>",
  "reviewer": { "id": "r1", "name": "Dr. Amelia Chen", "role": "Senior Records Manager" },
  "metadata": { "c2paManifest": "urn:c2pa:…", "checklist": { "authenticity": true } } }
```
Returns the ledger entry: `index, archiveId, contentHash, prevHash, entryHash, signature (Ed25519, base64), keyId, publicKey (PEM), sealedAt, reviewer, metadata`.

### `POST /api/verify`
`{}` re-verifies the whole chain. To demo tampering without changing anything:
```json
{ "tamper": { "archiveId": "PV-ARC-2026-0001-BA72A7", "text": "…$42 million…" } }
```
Returns `{ ok, brokenAt, length, head, records: [{ index, archiveId, title, ok, downstreamOfBreak, checks: { content, signature, link }, sealedHash, currentHash, reason }] }`.

### `POST /api/ledger`
`{}` lists entries (text preview only). `{ "action": "reset" }` restores the two seeded historical records.

Storage: `.data/ledger.json` and `.data/keys.json` locally (git-ignored); `/tmp` on Vercel, which
resets on cold start, so **run the pitch demo locally**. Demo keys are generated per reviewer
on first use; in production the private key would live in an HSM or on the reviewer's device.

## Source check

### `POST /api/check-sources`
```json
{ "text": "<AI-generated record>", "useModel": false }
```
Returns `{ claims: [{ id, verdict, label, ok, claim, sentence, sourceId, source, evidence, principle }], summary, register, extraction }`.

| Verdict | Rule | Example from the demo documents |
|---|---|---|
| `not_found` | Cited ID, report title or attributed quote is not in the register | "Productivity Commission 2025 Energy Hardship Report"; ACSC "industry-leading" |
| `altered` | Quote is close to, but not verbatim with, the record | |
| `superseded` | Cited record has been replaced | D19/02231 → D21/04410 |
| `number_mismatch` | Figure differs from the system of record | metoprolol 500 mg vs PBS dispense 50 mg (10×) |
| `unlinked_result` | A test result is stated but no record exists in the linked system | "ECG showed no abnormalities" |
| `unsourced` | Population statistic with no citation; nearest registered figure shown | "87% … already received relief" (nearest: 48%, 2022) |
| `anachronism` | Agency cited in a year before it existed | "In 2009 the ACSC…" (est. 2014) |
| `match` | Agrees with the record | $4.2 million, 28-day consultation |

Run on the three demo documents, the rules independently reproduce 5 of the hand-written flags
(dose, ECG, 87%, PC report, ACSC quote) and confirm the two verified figures. Bias and emotive-language findings
and the PR statement's contradiction of the DFIR report are judgement calls and stay with the
existing flags/model.

## Wiring the frontend (two small changes in `App.jsx`)

Replace the body of `approve()` so the seal comes from the server:
```js
const approve = async () => {
  setSealing(true);
  try {
    const res = await fetch('/api/seal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docId: doc.id, title: doc.title, text: workingText(doc),
        reviewer: { id: reviewer.id, name: reviewer.name, role: reviewer.role },
        metadata: { c2paManifest: doc.c2pa.manifest, checklist: doc.checklist },
      }),
    });
    const e = await res.json();
    if (!res.ok) throw new Error(e.error);
    const seal = { archiveId: e.archiveId, hash: e.contentHash, signature: e.signature, prevHash: e.prevHash,
      entryHash: e.entryHash, sealedAt: e.sealedAt, reviewer: { ...reviewer, keyId: e.keyId },
      storage: 'ProofVault seal ledger · Ed25519-signed hash chain' };
    updateDoc(doc.id, (d) => ({ ...d, seal, status: 'Approved for Archive',
      audit: logEvent(d, `Approved & sealed as ${seal.archiveId} · sha256:${seal.hash.slice(0, 16)}…`) }));
    setModal('seal');
  } finally {
    setSealing(false);
  }
};
```
Then add a "Verify chain" button on the seal certificate that calls `/api/verify` (and, for the
live demo, a "Simulate edit" that sends `tamper` with one changed character).

## Wording to keep accurate in the UI

- The certificate's "Ed25519" label is accurate once `approve()` uses `/api/seal`.
- "C2PA manifest validated", "WORM immutable" and the ingest progress steps are still simulated; label them as demo or soften the wording before judging.
