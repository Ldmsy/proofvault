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
      { at: raw.ingestedAt, actor: 'System', text: `Ingested via ${raw.channel}; C2PA manifest validated` },
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

// Offline stand-in used when the Claude call fails: a generic, clearly-labelled simulated analysis.
function fallbackAnalysis(body, mediaName) {
  const hasNumbers = /\d+%|\$\d+|\d{4}/.test(body);
  return {
    surfaceTintScore: 71,
    storyContext:
      'Simulated result — the live Claude analysis was unavailable, so this pool shows a generic template rather than an analysis of your content.',
    imageCaption: `Attached Media: ${mediaName || 'Mixed-Media Snapshot (C2PA Unverified)'}`,
    visionBoxes: [
      { x: 14, y: 20, w: 42, h: 36, tone: 'red', tag: 'Missing C2PA Provenance', finding: 'Template finding: visual attachments should carry C2PA Content Credentials before being trusted.' },
      { x: 52, y: 48, w: 38, h: 34, tone: 'orange', tag: 'Visual-Text Mismatch', finding: 'Template finding: check whether the visual framing omits baseline comparison context.' },
    ],
    docExcerpt: {
      title: 'Claim & Citation Extraction (simulated)',
      stat: hasNumbers ? 'Quantitative claim without a primary register URI' : 'Broad generalisation without an attributable source',
      warning: 'ISO 15489-1 §5.2.2 Reliability: confirm the primary source behind the surface narrative.',
    },
    surface: {
      title: 'Plausible on the surface, but sources are unverified',
      summary: 'Everyday readers encounter a cohesive package (visual + claim) that nudges opinion without exposing missing provenance.',
      purifiedTitle: 'Neutralised & Source-Grounded Summary (IM Verified)',
      purifiedSummary: 'Claims restricted to verifiable source records; unauthenticated attachments flagged as unverified context.',
    },
    middle: [
      { label: 'Cross-Modal Amplification', title: 'Visual + Textual Confirmation Loop', modality: 'Multimodal Fusion', desc: 'Pairing an unverified image or chart with assertive prose lowers reader scepticism.' },
      { label: 'Tone Smoothing', title: 'Confident Editorial Phrasing', modality: 'Language Framing', desc: 'Contested or incomplete evidence is presented as a settled conclusion.' },
    ],
    roots: [
      { type: 'Disinformation / Provenance Risk', modality: 'Visual / Media Attachment', title: 'Unauthenticated Media Without C2PA Content Credentials', confidence: 50, evidence: 'Template — not derived from your content', detail: 'Media origin should be verified before it is used as evidence.', imTip: 'IM Know-How: Verify C2PA 2.1 manifest and original capture metadata before trusting visual evidence.' },
      { type: 'Misinformation Source', modality: 'Textual Claim', title: 'Ungrounded Factual / Statistical Assertion', confidence: 50, evidence: 'Template — not derived from your content', detail: 'Key claims should be traceable to an audited primary record (ISO 15489 Reliability).', imTip: 'IM Know-How: Require source record URIs for every quantitative or causal claim.' },
    ],
  };
}

const clampPct = (n) => `${Math.max(0, Math.min(100, Math.round(n)))}%`;

// Turns an analysis (from Claude or the offline fallback) into the Contamination Pool case shape.
function assemblePoolCase({ title, body, mediaName, mediaUrl, modalityType }, a, source) {
  const live = source.kind === 'live';
  const engine = live ? 'Claude Opus 5.5' : 'Offline fallback (simulated)';
  const middle = a.middle.slice(0, 2).map((m, i) => ({ id: `mid-${i + 1}`, layer: 'middle', ...m }));
  const roots = a.roots.slice(0, 3).map((r, i) => ({ id: `r${i + 1}`, layer: 'root', ...r, c2pa: r.evidence, confidence: Math.round(r.confidence) }));
  if (!middle.length) middle.push({ id: 'mid-1', layer: 'middle', label: 'Direct Reading', title: 'No amplification mechanism identified', modality: 'Language Framing', desc: 'The analysis found no notable propagation mechanism.' });
  if (!roots.length) roots.push({ id: 'r1', layer: 'root', type: 'No material contamination found', modality: 'Textual Claim', title: 'No root problems identified', confidence: 0, c2pa: '—', detail: 'The analysis did not identify misinformation, disinformation or bias sources.', imTip: 'IM Know-How: Still confirm key facts against the authoritative record before archiving.' });
  const tint = Math.max(0, Math.min(100, Math.round(a.surfaceTintScore)));

  return {
    id: `pool-custom-${Date.now()}`,
    title,
    subtitle: `${mediaName || 'No attachment'} + Text · ${live ? 'Live analysis by Claude Opus 5.5' : 'Simulated — live analysis unavailable'}`,
    persona: live ? 'Custom Live Inspection (Claude Opus 5.5)' : 'Custom Inspection (simulated fallback)',
    modalities: [mediaName ? `Media (${mediaName})` : `Visual (${modalityType})`, 'Document Metadata', 'Submitted Text'],
    surfaceTintScore: tint,
    linkedDocId: 'doc-pol26',
    linkedDocLabel: 'Cross-referenced against Enterprise IM Repository',
    storyContext: a.storyContext,
    isFallback: !live,
    fallbackReason: live ? null : source.reason,
    artifact: {
      headline: title,
      sourceTag: `${live ? 'Live Scan' : 'Fallback'} · ${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} AEDT · ${engine}`,
      sceneType: 'custom-scan',
      imageUrl: mediaUrl || null,
      imageCaption: a.imageCaption,
      visionBoxes: a.visionBoxes.slice(0, 3).map((b, i) => ({ id: `vb${i + 1}`, ...b, x: clampPct(b.x), y: clampPct(b.y), w: clampPct(b.w), h: clampPct(b.h) })),
      docExcerpt: a.docExcerpt,
      articleQuotes: [
        {
          id: 'q1',
          text: `"${body.slice(0, 180)}${body.length > 180 ? '…' : ''}"`,
          tint: 'Surface reading — fluent on the surface; see the roots below for what it rests on.',
        },
      ],
    },
    pool: {
      surface: { id: 'surf-1', layer: 'surface', label: 'Surface Takeaway · Tinted Yellow (微微泛黄)', ...a.surface, tintLevel: `${tint}% Surface Tinting (${engine})` },
      middle,
      roots,
      edges: [
        ...roots.flatMap((r, i) => [{ from: r.id, to: middle[i % middle.length]?.id }]),
        ...middle.map((m) => ({ from: m.id, to: 'surf-1' })),
      ],
    },
  };
}

// Live Scan: ask the local backend (Claude Opus 5.5); on any failure fall back to the simulated template.
export async function runLiveScan({ title, text, modalityType, file }) {
  const cleanTitle = title?.trim() || 'Custom Multimodal Submission — Live Scan';
  const body = text?.trim() || '';
  const mediaName = file?.name || '';
  const mediaUrl = file?.type?.startsWith('image/') ? URL.createObjectURL(file) : null;
  const meta = { title: cleanTitle, body, mediaName, mediaUrl, modalityType };

  try {
    const media = file ? { name: file.name, type: file.type, data: await fileToBase64(file) } : null;
    const res = await fetch('/api/pool-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: cleanTitle, text: body, modalityType, media }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return assemblePoolCase(meta, json.analysis, { kind: 'live' });
  } catch (err) {
    return assemblePoolCase(meta, fallbackAnalysis(body, mediaName), { kind: 'fallback', reason: err.message });
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
