#!/usr/bin/env node
// ProofCore CLI: the same checking and sealing engine the ProofVault UI uses, without the UI.
// Works on any text file, so the defences can sit in front of any system (EDRMS, a mail
// gateway, a CI check on published reports).
//
//   node tools/proofcore.mjs check draft.txt            grounding report: grounded / ungrounded / conflict %
//   node tools/proofcore.mjs check draft.txt --json     the same as JSON
//   node tools/proofcore.mjs seal final.txt --title "Policy 2026" --reviewer "Amelia Chen"
//   node tools/proofcore.mjs verify                     re-verify the whole seal chain
//   node tools/proofcore.mjs verify --tamper <archiveId> edited.txt
//   node tools/proofcore.mjs ledger                     list sealed records
import { readFileSync } from 'node:fs';
import { checkText } from '../server/sourceCheck.js';
import { sealRecord, verifyChain, listLedger } from '../server/ledger.js';

const [cmd, ...args] = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const read = (path) => (path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8'));
const tty = process.stdout.isTTY;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const STATUS = { grounded: ['32', 'GROUNDED  '], ungrounded: ['33', 'UNGROUNDED'], conflict: ['31', 'CONFLICT  '] };

function usage() {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(1);
}

if (cmd === 'check') {
  if (!args[0]) usage();
  const r = checkText(read(args[0]));
  if (args.includes('--json')) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const p = r.grounding.percent;
    console.log(`\nGrounding report  ${c('32', `grounded ${p.grounded}%`)}  ${c('33', `ungrounded ${p.ungrounded}%`)}  ${c('31', `conflict ${p.conflict}%`)}\n`);
    r.grounding.sentences.forEach((s) => {
      const [code, label] = STATUS[s.status];
      console.log(`${c(code, label)}  ${s.text}${s.sourceId ? c('2', `  [${s.sourceId}]`) : ''}`);
    });
    const problems = r.claims.filter((x) => !x.ok);
    if (problems.length) {
      console.log('\nFindings');
      problems.forEach((x) => console.log(`  ${c('31', x.label)}: ${x.claim}\n    ${x.evidence}`));
    }
    if (r.grounding.sources.length) console.log(`\nMatched sources: ${r.grounding.sources.map((s) => `${s.id} (${s.percent}%)`).join(', ')}`);
    console.log('');
  }
  process.exit(r.summary.problems ? 2 : 0);
}

if (cmd === 'seal') {
  if (!args[0]) usage();
  const name = flag('reviewer') ?? 'CLI reviewer';
  const e = sealRecord({ docId: flag('doc') ?? null, title: flag('title') ?? args[0], text: read(args[0]), reviewer: { id: `cli-${name.toLowerCase().replace(/\W+/g, '-')}`, name }, metadata: { via: 'proofcore-cli' } });
  console.log(`Sealed ${e.archiveId}\n  content sha256 ${e.contentHash}\n  previous seal  ${e.prevHash}\n  signed by      ${name} (${e.keyId}, Ed25519)`);
  process.exit(0);
}

if (cmd === 'verify') {
  const t = flag('tamper');
  const v = verifyChain(t ? { archiveId: t, text: read(args[args.indexOf('--tamper') + 2]) } : undefined);
  v.records.forEach((r) => console.log(`${r.ok ? c('32', 'OK    ') : r.downstreamOfBreak ? c('33', 'AFTER ') : c('31', 'BROKEN')}  #${r.index} ${r.archiveId}  ${r.title}${r.reason ? c('31', `  — ${r.reason}`) : ''}`));
  console.log(v.ok ? c('32', `\nChain intact: ${v.length} records.`) : c('31', `\nChain broken at #${v.brokenAt}.`));
  process.exit(v.ok ? 0 : 3);
}

if (cmd === 'ledger') {
  listLedger().forEach((e) => console.log(`#${e.index} ${e.archiveId}  ${e.title}  ${e.reviewer.name}  ${e.sealedAt}`));
  process.exit(0);
}

usage();
