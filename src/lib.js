// Pure helpers shared by the ProofVault components.

export const RESOLVED = ['fixed', 'rejected', 'verified'];

export function prepareDoc(raw) {
  const flags = raw.segments.filter((s) => s.flag);
  const mis = flags.filter((s) => s.flag.type === 'misinfo').length;
  return {
    ...raw,
    segStatus: {},
    customRevisions: {},
    checklist: {},
    seal: null,
    audit: [
      { at: raw.ingestedAt, actor: 'System', text: `Ingested via ${raw.channel}; C2PA metadata shown (demo; not validated)` },
      {
        at: raw.ingestedAt,
        actor: 'ProofVault AI Pre-screen',
        text: `${flags.length} findings raised (${mis} mis/disinformation, ${flags.length - mis} bias) · routed to IM review queue`,
      },
    ],
  };
}

export const flaggedSegments = (doc) => doc.segments.filter((s) => s.flag);

export function segStatus(doc, segId) {
  return doc.segStatus[segId] || 'open';
}

export function getRevisedText(doc, seg) {
  return doc.customRevisions?.[seg.id] ?? seg.revised ?? seg.text;
}

export function issueCounts(doc) {
  const c = { total: 0, open: 0, escalated: 0, resolved: 0, misinfo: 0, bias: 0 };
  flaggedSegments(doc).forEach((s) => {
    const st = segStatus(doc, s.id);
    c.total += 1;
    c[s.flag.type] += 1;
    if (st === 'open') c.open += 1;
    else if (st === 'escalated') c.escalated += 1;
    else c.resolved += 1;
  });
  return c;
}

export function provenanceScore(doc) {
  const flags = flaggedSegments(doc);
  if (!flags.length) return 96;
  let progress = 0;
  flags.forEach((s) => {
    const st = segStatus(doc, s.id);
    if (RESOLVED.includes(st)) progress += 1;
    else if (st === 'escalated') progress += 0.4;
  });
  return Math.round(doc.provenanceBase + ((96 - doc.provenanceBase) * progress) / flags.length);
}

export function currentVersion(doc) {
  if (doc.seal) return 'v1.2 Sealed';
  if (doc.status === 'Returned for Regeneration') return 'v1.0 Returned';
  if (Object.keys(doc.segStatus).length) return 'v1.1 In Review';
  return 'v1.0 AI Draft';
}

// Text of the record as it would be archived, given the reviewer's decisions.
export function workingText(doc) {
  return doc.segments
    .map((s) => {
      const st = segStatus(doc, s.id);
      if (st === 'rejected') return null;
      if (st === 'fixed') return getRevisedText(doc, s);
      return s.text;
    })
    .filter(Boolean)
    .join('\n');
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Australia/Sydney',
  });
}

// Word-level LCS diff → [{ type: 'same'|'del'|'add', text }]
export function wordDiff(a, b) {
  const x = a.split(/(\s+)/);
  const y = b.split(/(\s+)/);
  const m = x.length;
  const n = y.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  while (i < m && j < n) {
    if (x[i] === y[j]) {
      push('same', x[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', x[i++]);
    else push('add', y[j++]);
  }
  while (i < m) push('del', x[i++]);
  while (j < n) push('add', y[j++]);
  return out;
}

// Builds a queue record from an uploaded file and Claude's paragraph-level review.
export async function buildUploadedDoc({ fileName, paragraphs, truncated, analysis, model }, n) {
  const now = new Date().toISOString();
  const findingAt = new Map(analysis.findings.map((f) => [f.index, f]));
  const segments = paragraphs.map((text, i) => {
    const seg = { id: `s${i + 1}`, section: analysis.sections[i] || `Paragraph ${i + 1}`, text };
    const f = findingAt.get(i + 1);
    if (f) {
      const { index, revised, confidence, ...flag } = f;
      seg.flag = { ...flag, confidence: Math.max(0, Math.min(100, Math.round(confidence))) };
      seg.revised = revised;
    }
    return seg;
  });
  const count = analysis.findings.length;
  const hash = await sha256(paragraphs.join('\n'));
  const doc = prepareDoc({
    id: `doc-up${n}-${hash.slice(0, 6)}`,
    title: analysis.title,
    category: analysis.category,
    org: analysis.org,
    risk: analysis.risk,
    status: count ? 'Flagged' : 'Pending Review',
    channel: `Upload · ${fileName}`,
    ingestedAt: now,
    owner: 'Uploaded for IM review',
    retention: 'To be appraised by the records manager',
    provenanceBase: count ? Math.max(30, 88 - count * 12) : 92,
    c2pa: {
      generator: 'Not declared — no Content Credentials in file',
      model: `Reviewed by ${model || 'Claude Opus 5.5'}`,
      created: now,
      hash: `sha256:${hash}`,
      manifest: 'None attached',
      signer: '—',
      action: 'uploaded → reviewed',
      unsigned: true,
    },
    segments,
    citations: analysis.citations.map((c, i) => ({
      id: `c${i + 1}`,
      segId: `s${c.index}`,
      claim: c.claim,
      source: c.source || null,
      status: c.status,
      note: c.note,
    })),
  });
  if (truncated) {
    doc.audit.push({ at: now, actor: 'System', text: `Long file: only the first ${paragraphs.length} paragraphs were reviewed` });
  }
  return doc;
}
