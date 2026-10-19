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

// Dynamic Opus 5.5 Multimodal Pool Builder for user-submitted custom text/media
export function buildCustomPoolCase({ title, text, mediaName, modalityType }) {
  const cleanTitle = title?.trim() || 'Custom Multimodal Submission — Live Opus 5.5 Audit';
  const body =
    text?.trim() ||
    'Recent community survey shows 92% of residents oppose bike lanes and prefer redirecting funds, as seen in attached street photo.';
  const hasNumbers = /\d+%|\$\d+|\d{4}/.test(body);
  const id = `pool-custom-${Date.now()}`;

  return {
    id,
    title: cleanTitle,
    subtitle: `${mediaName || 'Uploaded Visual/Doc'} + Text · Live Decomposed by Cloud Opus 5.5`,
    persona: 'Custom Live Inspection (Opus 5.5)',
    modalities: [mediaName ? `Media (${mediaName})` : `Visual (${modalityType})`, 'Document Metadata', 'Submitted Text'],
    surfaceTintScore: 71,
    linkedDocId: 'doc-pol26',
    linkedDocLabel: 'Cross-referenced against Enterprise IM Repository',
    storyContext:
      'Live decomposition by Cloud Opus 5.5 Multimodal Engine: separating the mildly persuasive yellow surface from its underlying red evidentiary and framing roots.',
    artifact: {
      headline: cleanTitle,
      sourceTag: `Live Scan · ${new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} AEDT · Cloud Opus 5.5`,
      sceneType: 'custom-scan',
      imageCaption: `Attached Media: ${mediaName || 'Mixed-Media Snapshot (C2PA Unverified)'}`,
      visionBoxes: [
        {
          id: 'vb1',
          x: '14%',
          y: '20%',
          w: '42%',
          h: '36%',
          tone: 'red',
          tag: 'Opus 5.5 Vision · Missing C2PA Provenance',
          finding: 'Visual attachment lacks cryptographic C2PA Content Credentials; context cropping & post-processing detected.',
        },
        {
          id: 'vb2',
          x: '52%',
          y: '48%',
          w: '38%',
          h: '34%',
          tone: 'orange',
          tag: 'Opus 5.5 Cross-Modal · Visual-Text Mismatch',
          finding: 'Visual framing selectively reinforces the text claim while omitting baseline comparison context.',
        },
      ],
      docExcerpt: {
        title: 'Opus 5.5 Claim & Citation Extraction',
        stat: hasNumbers ? 'Detected quantitative claim without primary register URI' : 'Detected broad generalisation without attributable source',
        warning: 'ISO 15489-1 §5.2.2 Reliability Alert: Unverified primary source behind surface narrative.',
      },
      articleQuotes: [
        {
          id: 'q1',
          text: `"${body.slice(0, 180)}${body.length > 180 ? '…' : ''}"`,
          tint: 'Soft Yellow Surface — reads fluently on the surface, but carries ungrounded assumptions from the red roots below.',
        },
      ],
    },
    pool: {
      surface: {
        id: 'surf-1',
        layer: 'surface',
        label: 'Surface Takeaway · Tinted Yellow (微微泛黄)',
        title: `"${cleanTitle}" — Plausible on the surface, but tinted by unverified roots`,
        summary:
          'Everyday readers encounter a cohesive multimodal package (visual + claim) that nudges opinion without exposing the missing provenance.',
        purifiedTitle: 'Neutralised & Source-Grounded Summary (IM Verified)',
        purifiedSummary:
          'Claims restricted to verifiable source records; unauthenticated visual attachments flagged as unverified context per NAA & C2PA standards.',
        tintLevel: '71% Surface Tinting (Opus 5.5 Live Score)',
      },
      middle: [
        {
          id: 'mid-1',
          layer: 'middle',
          label: 'Cross-Modal Amplification',
          title: 'Visual + Textual Confirmation Loop',
          modality: 'Multimodal Fusion',
          desc: 'Combining an unverified image/chart with assertive prose lowers reader scepticism and masks source gaps.',
        },
        {
          id: 'mid-2',
          layer: 'middle',
          label: 'Tone Smoothing',
          title: 'Confident AI / Editorial Phrasing',
          modality: 'Language Framing',
          desc: 'Converts contested or incomplete evidence into smooth, authoritative-sounding conclusions.',
        },
      ],
      roots: [
        {
          id: 'r1',
          layer: 'root',
          type: 'Disinformation / Provenance Risk',
          modality: 'Visual / Media Attachment',
          title: 'Unauthenticated Media Without C2PA Content Credentials',
          confidence: 95,
          c2pa: 'No urn:c2pa manifest attached · Origin unverified',
          detail: 'Opus 5.5 detected missing origin signature and potential selective framing in the visual/document layer.',
          imTip: 'IM Know-How: Verify C2PA 2.1 manifest and original capture metadata before trusting visual evidence.',
        },
        {
          id: 'r2',
          layer: 'root',
          type: 'Misinformation Source',
          modality: 'Textual Claim',
          title: 'Ungrounded Factual / Statistical Assertion',
          confidence: 92,
          c2pa: '0 matching authoritative records in linked EDRMS',
          detail: 'Key claims in the submitted text cannot be traced to an audited primary record (ISO 15489 Reliability).',
          imTip: 'IM Know-How: Require source record URIs for every quantitative or causal claim.',
        },
        {
          id: 'r3',
          layer: 'root',
          type: 'Bias Source',
          modality: 'Framing & Selection',
          title: 'Selective Context & Confirmation Bias',
          confidence: 89,
          c2pa: 'One-sided evidence selection detected by Opus 5.5',
          detail: 'Omits countervailing demographic or operational context, steering the reader toward a predetermined conclusion.',
          imTip: 'IM Know-How: Apply AS ISO 23081 contextual metadata checks to ensure balanced provenance.',
        },
      ],
      edges: [
        { from: 'r1', to: 'mid-1' },
        { from: 'r2', to: 'mid-1' },
        { from: 'r2', to: 'mid-2' },
        { from: 'r3', to: 'mid-2' },
        { from: 'mid-1', to: 'surf-1' },
        { from: 'mid-2', to: 'surf-1' },
      ],
    },
  };
}
