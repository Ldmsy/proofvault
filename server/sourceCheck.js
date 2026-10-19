// Source check: verifies AI-generated text against the Authoritative Records Register.
// Principle: the model may help find claims, but every verdict is decided by deterministic,
// explainable rules over records — never by the model's own opinion.
import { DOCUMENTS, AGENCIES, FACTS, RESULT_SYSTEMS, getDocument } from './records.js';

export const VERDICTS = {
  match: { label: 'Matches source record', ok: true, principle: 'Claim agrees with the authoritative record' },
  not_found: { label: 'Source not found', ok: false, principle: 'Citations must resolve to an existing record (ISO 15489-1 — authenticity)' },
  altered: { label: 'Quote altered', ok: false, principle: 'Quotations must match the source record verbatim (integrity)' },
  superseded: { label: 'Superseded source', ok: false, principle: 'Decisions must rely on the current version of a record' },
  number_mismatch: { label: 'Figure contradicts record', ok: false, principle: 'Recorded facts must agree with the system of record (reliability)' },
  unlinked_result: { label: 'Result with no source record', ok: false, principle: 'Every stated result must link to a source record' },
  unsourced: { label: 'Unsourced statistic', ok: false, principle: 'Evidence used in decision records must be attributable' },
  anachronism: { label: 'Impossible provenance', ok: false, principle: "Provenance must fit the creating agency's period of existence (context)" },
};

const ID_PATTERNS = [/\bD\d{2}\/\d{5}\b/g, /\bDS-\d{4}\b/g, /\bSER-[A-Z]\d{4}\/\d+\b/g, /\bSTATE-[A-Z]{2}-\d{4}\b/g, /\bPC-\d{4}-[A-Z]+\b/g, /\bDFIR-[A-Z]+-[\d.]+\b/g];
const STOP = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'on', 'for', 'to', 'report', 'reports']);

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const words = (s) => norm(s).replace(/[^a-z0-9\s]/g, ' ').split(' ').filter((w) => w && !STOP.has(w) && !/^\d{4}$/.test(w));

function splitSentences(text) {
  return text
    .split(/\n+/)
    .flatMap((p) => p.split(/(?<=[.!?。])\s+(?=[A-Z“"'(\d])/))
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasWord(sentence, term) {
  const t = term.toLowerCase();
  const s = sentence.toLowerCase();
  if (t.length <= 4 && /^[a-z]+$/.test(t)) return new RegExp(`\\b${t}\\b`).test(s);
  return s.includes(t);
}

function agenciesIn(sentence) {
  return AGENCIES.filter((a) => [a.name, ...a.aliases].some((n) => hasWord(sentence, n)));
}

// Character-bigram Dice similarity, for near-verbatim quote matching.
function dice(a, b) {
  const grams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) || 0) + 1);
    return m;
  };
  const A = grams(norm(a));
  const B = grams(norm(b));
  let inter = 0;
  let total = 0;
  A.forEach((v, k) => {
    inter += Math.min(v, B.get(k) || 0);
    total += v;
  });
  B.forEach((v) => (total += v));
  return total ? (2 * inter) / total : 0;
}

// Best window of the record text with the same length as the quote.
function bestWindow(quote, text) {
  const q = norm(quote);
  const t = norm(text);
  let best = { score: 0, text: '' };
  const step = Math.max(1, Math.floor(q.length / 6));
  for (let i = 0; i <= Math.max(0, t.length - q.length); i += step) {
    const w = t.slice(i, i + q.length);
    const sc = dice(q, w);
    if (sc > best.score) best = { score: sc, start: i };
  }
  if (best.start === undefined) return best;
  // Widen to whole words so the evidence reads naturally.
  let a = best.start;
  let b = Math.min(t.length, best.start + q.length);
  while (a > 0 && /\S/.test(t[a - 1])) a--;
  while (b < t.length && /[^\s.,;]/.test(t[b])) b++;
  return { score: best.score, text: t.slice(a, b) };
}

const UNIT = { mg: 'mg', million: 'million', m: 'million', k: 'k', day: 'day', days: 'day' };
function numbersIn(sentence) {
  const out = [];
  const re = /\$?(\d+(?:\.\d+)?)\s*-?\s*(mg|million|m\b|k\b|days?)?/gi;
  let m;
  while ((m = re.exec(sentence))) out.push({ value: parseFloat(m[1]), unit: m[2] ? UNIT[m[2].toLowerCase().replace(/\b/g, '')] : null, raw: m[0].trim() });
  return out;
}

function checkSentence(sentence) {
  const findings = [];
  const add = (verdict, claim, extra = {}) => findings.push({ verdict, claim, sentence, ...extra });
  const agencies = agenciesIn(sentence);
  let cited = false;

  // A. Record identifiers
  for (const re of ID_PATTERNS) {
    for (const [id] of sentence.matchAll(re)) {
      cited = true;
      const doc = getDocument(id);
      if (!doc) add('not_found', id, { evidence: `No record with identifier ${id} in the register.` });
      else if (doc.status === 'superseded') add('superseded', id, { sourceId: doc.id, source: doc.title, evidence: `${doc.id} was superseded by ${doc.supersededBy} (${getDocument(doc.supersededBy)?.title}).` });
      else add('match', id, { sourceId: doc.id, source: doc.title, evidence: doc.caveat ? `Record exists. Caveat: ${doc.caveat}` : 'Record exists and is current.' });
    }
  }

  // B. Titled citations ("According to the … Report")
  const cite = sentence.match(/\b(?:according to|as reported in|cited in|source:|as stated in)\s+(?:the\s+)?([A-Z][^,;:"“”]{4,90}?)(?=,|;|:|\s+(?:shows?|finds?|found|states?|says?|reduces?|confirms?)\b|\.|$)/i);
  if (cite) {
    cited = true;
    const phrase = cite[1].trim();
    const issuer = [...AGENCIES.map((a) => a.name), ...new Set(DOCUMENTS.map((d) => d.issuer))].find((n) => hasWord(phrase, n));
    const year = phrase.match(/\b(19|20)\d{2}\b/)?.[0];
    const pw = words(phrase.replace(issuer || '', ''));
    const scored = DOCUMENTS.filter((d) => !issuer || d.issuer === issuer)
      .map((d) => {
        const tw = words(d.title);
        const inter = pw.filter((w) => tw.includes(w)).length;
        return { d, score: inter / Math.max(1, new Set([...pw, ...tw]).size) };
      })
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (best && best.score >= 0.5 && (!year || best.d.date.startsWith(year))) {
      add(best.d.status === 'superseded' ? 'superseded' : 'match', phrase, { sourceId: best.d.id, source: best.d.title, evidence: `Resolved to ${best.d.id} (${best.d.date}).` });
    } else if (issuer) {
      const real = DOCUMENTS.filter((d) => d.issuer === issuer).map((d) => `${d.title} (${d.date.slice(0, 4)})`);
      add('not_found', phrase, { evidence: `No ${issuer} publication matches "${phrase}". Registered ${issuer} publications: ${real.join('; ') || 'none'}.` });
    }
  }

  // C. Attributed quotations
  for (const [, quote] of sentence.matchAll(/[“"]([^”"]{3,200})[”"]/g)) {
    const pool = DOCUMENTS.filter((d) => agencies.some((a) => a.name === d.issuer));
    if (!agencies.length) continue; // unattributed scare quotes are not quotations
    cited = true;
    const exact = pool.find((d) => norm(d.text).includes(norm(quote)));
    if (exact) {
      add('match', `“${quote}”`, { sourceId: exact.id, source: exact.title, evidence: 'Quotation appears verbatim in the record.' });
      continue;
    }
    const near = pool.map((d) => ({ d, ...bestWindow(quote, d.text) })).sort((a, b) => b.score - a.score)[0];
    if (near && near.score >= 0.6) add('altered', `“${quote}”`, { sourceId: near.d.id, source: near.d.title, evidence: `Closest wording in the record: “${near.text}”` });
    else add('not_found', `“${quote}”`, { evidence: `Searched ${pool.length} ${agencies[0].name} record(s): the quotation does not appear.` });
  }

  // D. Figures against systems of record
  for (const f of FACTS) {
    if (![f.entity, ...f.aliases].some((n) => hasWord(sentence, n))) continue;
    const nums = numbersIn(sentence).filter((n) => n.unit === f.unit);
    for (const n of nums) {
      if (n.value === f.value) add('match', n.raw, { sourceId: f.sourceId, source: f.source, evidence: `${f.source}: ${f.value} ${f.unit}.` });
      else {
        const ratio = n.value / f.value;
        const times = ratio >= 2 ? ` (${ratio.toFixed(ratio % 1 ? 1 : 0)}× the recorded value)` : ratio <= 0.5 ? ` (${ratio === 0.5 ? 'half' : `1/${(1 / ratio).toFixed(0)} of`} the recorded value)` : '';
        add('number_mismatch', n.raw, { sourceId: f.sourceId, source: f.source, evidence: `${f.source} records ${f.value} ${f.unit}${times}.` });
      }
    }
  }

  // E. Stated results that need a linked record
  if (/\b(showed|shows|revealed|normal|no abnormalit|ruled out|ruling out|confirmed)\b/i.test(sentence)) {
    for (const r of RESULT_SYSTEMS) {
      if (!r.aliases.some((a) => hasWord(sentence, a))) continue;
      if (!r.records.length) add('unlinked_result', r.test, { evidence: `${r.system}. No record supports a stated result.` });
    }
  }

  // F. Percentages with no attribution
  // Only population or outcome statistics need a citation; device readings (e.g. SpO₂ 97%) do not.
  const pct = sentence.match(/\b\d+(?:\.\d+)?\s*%/);
  const statistical = /\b(households?|people|residents|patients|customers|population|eligible|rate|reduc\w*|increas\w*|decreas\w*|majority|of (?:all|those))\b/i.test(sentence);
  if (pct && statistical && !cited && !findings.some((x) => x.verdict !== 'match')) {
    const sw = words(sentence);
    const nearest = DOCUMENTS.filter((d) => /%/.test(d.text))
      .map((d) => ({ d, score: words(d.text).filter((w) => sw.includes(w)).length }))
      .sort((a, b) => b.score - a.score)[0];
    const hint = nearest && nearest.score >= 3 ? ` Nearest registered figure: ${nearest.d.id} — “${nearest.d.text}”` : '';
    add('unsourced', pct[0], { evidence: `No record is cited for this figure.${hint}`, sourceId: hint ? nearest.d.id : undefined });
  }

  // G. Agency named in a year before it existed
  const years = [...sentence.matchAll(/\b(1[89]\d{2}|20\d{2})\b/g)].map((m) => +m[1]);
  for (const a of agencies) {
    const early = years.find((y) => y < a.established);
    if (early) add('anachronism', `${a.name} (${early})`, { evidence: `${a.name} was established in ${a.established}; it could not have issued anything in ${early}.` });
  }

  return findings;
}

export function checkText(text) {
  const findings = splitSentences(text).flatMap(checkSentence);
  const seen = new Set();
  const unique = findings.filter((f) => {
    const k = `${f.verdict}|${f.claim}|${f.sentence}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const claims = unique.map((f, i) => ({ id: `f${i + 1}`, ...f, label: VERDICTS[f.verdict].label, ok: VERDICTS[f.verdict].ok, principle: VERDICTS[f.verdict].principle }));
  const summary = { total: claims.length, ok: claims.filter((c) => c.ok).length, problems: claims.filter((c) => !c.ok).length, byVerdict: {} };
  claims.forEach((c) => (summary.byVerdict[c.verdict] = (summary.byVerdict[c.verdict] || 0) + 1));
  return { claims, summary, register: { documents: DOCUMENTS.length, agencies: AGENCIES.length, facts: FACTS.length } };
}

// Optional: let Claude rewrite implicit claims into explicit, checkable sentences
// (e.g. a paraphrased citation). Verdicts still come only from checkSentence.
async function modelExtract(text) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  const z = await import('zod');
  const Out = z.object({
    claims: z.array(z.string().describe('One checkable claim as a standalone sentence. Keep record IDs, report titles, quotations and figures exactly as written.')),
  });
  const client = new Anthropic();
  const res = await client.beta.messages.parse(
    {
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      output_config: { effort: 'low', format: betaZodOutputFormat(Out) },
      system: 'Extract every factual claim from the record that cites a source, quotes someone, states a figure, or states a test result. Rewrite each as a standalone sentence. Do not judge whether claims are true.',
      messages: [{ role: 'user', content: text }],
    },
    { timeout: 60_000 }
  );
  return res.parsed_output?.claims ?? [];
}

export async function handleCheckSources(payload) {
  const text = payload?.text?.trim();
  if (!text) return { status: 400, body: { error: 'Provide the text to check' } };
  if (text.length > 50_000) return { status: 413, body: { error: 'Text too long (max 50,000 characters)' } };
  const result = checkText(text);
  let extraction = 'rules';
  if (payload.useModel && (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) {
    try {
      const extra = checkText((await modelExtract(text)).join('\n'));
      const known = new Set(result.claims.map((c) => `${c.verdict}|${c.claim}`));
      extra.claims.filter((c) => !known.has(`${c.verdict}|${c.claim}`)).forEach((c) => result.claims.push({ ...c, id: `m${result.claims.length + 1}`, via: 'model' }));
      result.summary.total = result.claims.length;
      result.summary.ok = result.claims.filter((c) => c.ok).length;
      result.summary.problems = result.summary.total - result.summary.ok;
      result.summary.byVerdict = {};
      result.claims.forEach((c) => (result.summary.byVerdict[c.verdict] = (result.summary.byVerdict[c.verdict] || 0) + 1));
      extraction = 'rules+model';
    } catch (err) {
      console.error('[check-sources] model extraction failed, rules only:', err.message);
      extraction = 'rules (model unavailable)';
    }
  }
  return { status: 200, body: { ...result, extraction } };
}
