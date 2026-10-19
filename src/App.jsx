import { useEffect, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import ReviewExperience from './components/ReviewExperience.jsx';
import Header from './components/Header.jsx';
import Queue from './components/Queue.jsx';
import Viewer from './components/Viewer.jsx';
import RightPanel from './components/RightPanel.jsx';
import ProvenanceMapOverlay, { MiniProvenanceMap } from './components/ProvenanceMap.jsx';
import { IngestModal, RejectModal, SealModal } from './components/Modals.jsx';
import { INITIAL_DOCS, INGEST_TEMPLATE, BASE_METRICS, REVIEWERS } from './data.js';
import { prepareDoc, provenanceScore, segStatus, workingText, RESOLVED, buildUploadedDoc, lockOriginalDraft } from './lib.js';

import { readBankHandoff, HANDOFF_KEY } from './handoff.js';
import Vee from './components/Vee.jsx';

const ACTION_TEXT = {
  fix: 'Applied AI-suggested correction to',
  escalate: 'Requested SME human review of',
  reject: 'Rejected (struck from record)',
  verify: 'SME verified original wording of',
  undo: 'Reverted decision on',
};
const ACTION_STATUS = { fix: 'fixed', escalate: 'escalated', reject: 'rejected', verify: 'verified' };

export default function App() {
  const [docs, setDocs] = useState(() => { const incoming = ['bank','hospital'].includes(new URLSearchParams(location.search).get('review')) ? readBankHandoff(sessionStorage) : null; return incoming ? [incoming, ...INITIAL_DOCS.map(prepareDoc)] : INITIAL_DOCS.map(prepareDoc); });
  const [selectedId, setSelectedId] = useState(() => docs[0].id);
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [selectedCitationId, setSelectedCitationId] = useState(null);
  const [tab, setTab] = useState('audit');
  const [showDiff, setShowDiff] = useState(false);
  const [layers, setLayers] = useState({ misinfo: true, bias: true });
  const [reviewerId, setReviewerId] = useState(() => docs[0].handoff?.scenario === 'hospital' ? 'r3' : REVIEWERS[0].id);
  const [modal, setModal] = useState(null); // 'ingest' | 'reject' | 'seal'
  const [sealing, setSealing] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [sealError, setSealError] = useState('');
  const [dark, setDark] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [ingestCount, setIngestCount] = useState(0);

  // Fullscreen Provenance Map
  const [mapOpen, setMapOpen] = useState(false);
  const [mapIncoming, setMapIncoming] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const doc = docs.find((d) => d.id === selectedId);
  useEffect(() => { const incoming = docs.find(d => d.handoff); if (incoming) { try { sessionStorage.setItem(`${HANDOFF_KEY}.state`, JSON.stringify(incoming)); } catch { /* Session continuity unavailable; live state is retained. */ } } }, [docs]);

  const reviewer = REVIEWERS.find((r) => r.id === reviewerId);

  const toast = (text, tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const updateDoc = (id, fn) => setDocs((all) => all.map((d) => (d.id === id ? fn(d) : d)));
  const logEvent = (d, text, actor = reviewer.name) => [...d.audit, { at: new Date().toISOString(), actor, text }];

  const metrics = useMemo(() => {
    const active = docs.filter((d) => !d.seal && d.status !== 'Returned for Regeneration');
    const sealedHere = docs.filter((d) => d.seal).length;
    const sessionIntercepted = docs.reduce(
      (n, d) => n + d.segments.filter((s) => s.flag?.type === 'misinfo' && ['fixed', 'rejected'].includes(segStatus(d, s.id))).length,
      0
    );
    const provenance = Math.round(docs.reduce((n, d) => n + provenanceScore(d), 0) / docs.length);
    const compliance = (((BASE_METRICS.archivedCompliant + sealedHere) / (BASE_METRICS.archivedTotal + sealedHere)) * 100).toFixed(1);
    return {
      pending: BASE_METRICS.pendingElsewhere + active.length,
      queueOpen: active.length,
      intercepted: BASE_METRICS.intercepted + sessionIntercepted,
      sessionIntercepted,
      provenance,
      compliance,
      sealed: BASE_METRICS.archivedCompliant + sealedHere,
    };
  }, [docs]);

  const selectDoc = (id) => {
    setSelectedId(id);
    setSelectedSegId(null);
    setSelectedCitationId(null);
  };

  const selectSeg = (segId) => {
    setSelectedSegId(segId);
    if (!segId) return;
    setTab('audit');
    requestAnimationFrame(() => document.getElementById(`seg-${segId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const jumpToSeg = (segId) => {
    setShowDiff(false);
    setSelectedSegId(segId);
    requestAnimationFrame(() => document.getElementById(`seg-${segId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const segAction = (segId, action) => {
    updateDoc(doc.id, (d) => {
      const idx = d.segments.findIndex((s) => s.id === segId);
      const seg = d.segments[idx];
      const segStatusNext = { ...d.segStatus };
      if (action === 'undo') delete segStatusNext[segId];
      else segStatusNext[segId] = ACTION_STATUS[action];
      return { ...d, segStatus: segStatusNext, audit: logEvent(d, `${ACTION_TEXT[action]} ¶${idx + 1} (${seg.section}) — “${seg.flag.title}”`) };
    });
    const msg = {
      fix: 'Correction applied — paragraph updated in working copy',
      escalate: 'Routed to subject-matter expert for human review',
      reject: 'Paragraph rejected and struck from the record',
      verify: 'Original wording verified by SME',
      undo: 'Decision reverted',
    }[action];
    toast(msg, action === 'reject' ? 'info' : 'success');
  };

  const updateRevision = (segId, customText) => {
    updateDoc(doc.id, (d) => {
      const idx = d.segments.findIndex((s) => s.id === segId);
      const seg = d.segments[idx];
      return {
        ...d,
        customRevisions: { ...(d.customRevisions || {}), [segId]: customText },
        segStatus: { ...d.segStatus, [segId]: 'fixed' },
        audit: logEvent(d, `Edited & applied custom wording to ¶${idx + 1} (${seg.section})`),
      };
    });
    toast('Custom wording saved & applied to working copy');
  };

  const applyAll = () => {
    updateDoc(doc.id, (d) => {
      const next = { ...d.segStatus };
      let n = 0;
      d.segments.forEach((s) => {
        if (s.flag && segStatus(d, s.id) === 'open') {
          next[s.id] = 'fixed';
          n += 1;
        }
      });
      return { ...d, segStatus: next, audit: logEvent(d, `Bulk-applied ${n} AI-suggested corrections`) };
    });
    toast('All open findings corrected with AI suggestions');
  };

  const toggleCheck = (key) =>
    updateDoc(doc.id, (d) => {
      const on = !d.checklist[key];
      return { ...d, checklist: { ...d.checklist, [key]: on }, audit: logEvent(d, `${on ? 'Checked' : 'Unchecked'} compliance item: ${key}`) };
    });

  const approve = async () => {
    setSealError('');
    setSealing(true);
    try {
      const sealedText = workingText(doc);
      const res = await fetch('/api/seal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: doc.id, title: doc.title, text: sealedText,
          reviewer: { id: reviewer.id, name: reviewer.name, role: reviewer.role },
          metadata: { c2paManifest: doc.c2pa.manifest, checklist: doc.checklist, checklistPurpose: doc.handoff ? 'Internal review acknowledgements; not compliance certification or release approval' : 'Reviewer checklist', originalText: doc.segments.map(s => s.text).join('\n'), reviewHistory: doc.audit, handoff: doc.handoff || null } }),
      });
      const entry = await res.json();
      if (!res.ok) throw new Error(entry.error || 'Could not seal record');
      const seal = { archiveId: entry.archiveId, hash: entry.contentHash, signature: entry.signature,
        prevHash: entry.prevHash, sealedAt: entry.sealedAt, sealedText,
        reviewer: { ...reviewer, keyId: entry.keyId },
        storage: 'ProofCore seal ledger · Ed25519-signed hash chain' };
      updateDoc(doc.id, (d) => ({ ...d, seal, status: 'Approved for Archive',
        audit: logEvent(d, `Approved & sealed to archive as ${seal.archiveId} · sha256:${seal.hash.slice(0, 16)}…`) }));
      setSelectedId(doc.id);
      setModal('seal');
    } catch (err) {
      setSealError(`Seal failed: ${err.message}`);
      toast(`Seal failed: ${err.message}`, 'info');
    } finally {
      setSealing(false);
    }
  };

  const reject = (reason) => {
    updateDoc(doc.id, (d) => ({ ...d, status: 'Returned for Regeneration', audit: logEvent(d, `Rejected & returned for regeneration: “${reason}”`) }));
    setModal(null);
    toast('Record returned to the AI system for regeneration', 'info');
  };

  const reopen = () =>
    updateDoc(doc.id, (d) => ({
      ...d,
      status: d.segments.some((s) => s.flag && !RESOLVED.includes(segStatus(d, s.id))) ? 'Flagged' : 'Pending Review',
      audit: logEvent(d, 'Re-opened review'),
    }));

  const ingest = (sourceLabel) => {
    const n = ingestCount + 1;
    const raw = {
      ...INGEST_TEMPLATE,
      id: `doc-cs${77120 + n}`,
      title: INGEST_TEMPLATE.title.replace('77120', String(77120 + n)),
      channel: sourceLabel,
      ingestedAt: new Date().toISOString(),
    };
    setIngestCount(n);
    setDocs((all) => [prepareDoc(raw), ...all]);
    selectDoc(raw.id);
    setModal(null);
    toast(`Ingested via ${sourceLabel} — 1 finding raised by pre-screen`);
  };

  const ingestUpload = async (upload) => {
    const n = ingestCount + 1;
    const built = await buildUploadedDoc(upload, n);
    const { originalSeal, event } = await lockOriginalDraft({ docId: built.id, title: built.title, paragraphs: upload.paragraphs, fileName: upload.fileName, model: upload.model });
    const newDoc = { ...built, originalSeal, audit: [...built.audit, { at: new Date().toISOString(), actor: 'ProofCore Ledger', text: event }] };
    setIngestCount(n);
    setDocs((all) => [newDoc, ...all]);
    selectDoc(newDoc.id);
    setModal(null);
    const count = upload.analysis.findings.length;
    toast(`${upload.fileName} reviewed — ${count} finding${count === 1 ? '' : 's'} raised${originalSeal ? ' · original locked' : ''}`);
  };

  const LENS_BY_CATEGORY = { Clinical: 'healthcare', Policy: 'government', Corporate: 'enterprise', Service: 'enterprise' };
  const openMap = (claim, lens) => {
    if (claim) setMapIncoming({ claim, lens, nonce: Date.now() });
    setMapOpen(true);
  };
  const traceClaim = (claim, category) => openMap(claim, LENS_BY_CATEGORY[category]);

  // The mini map follows the selected finding, or the record's first unresolved one.
  const flagged = doc.segments.filter((s) => s.flag);
  const miniSeg =
    flagged.find((s) => s.id === selectedSegId) || flagged.find((s) => !RESOLVED.includes(segStatus(doc, s.id))) || flagged[0];


  if (doc.handoff && !detailed) return <ReviewExperience doc={doc} onUpdateRevision={updateRevision} onToggleCheck={toggleCheck} onApprove={approve} sealing={sealing} reviewerId={reviewerId} setReviewerId={setReviewerId} onDetailed={() => setDetailed(true)} error={sealError} />;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <Header
        metrics={metrics}
        dark={dark}
        onToggleTheme={() => setDark(!dark)}
        onIngest={() => setModal('ingest')}
        onOpenMap={() => openMap()}
      />

      {doc.handoff && <div className="border-b border-amber-500/40 bg-amber-100 px-5 py-3 text-sm text-slate-900"><strong>One file · {doc.id}</strong><div>Submitted → Source checked → Human review → {doc.seal ? 'Signed & archived' : 'Sign-off pending'} · Customer release approval remains separate.</div><div className="text-xs">Original draft and evidence travelled from the banking experience. Review each finding, edit or reject, complete IM Sign-off, then seal. Progress is saved in this browser tab only.</div><a href="/bank.html" className="underline">Back to scenario</a></div>}

      {/* ──────── Main Workspace: queue + mini map │ record │ audit panels ──────── */}
        <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[300px_minmax(0,1fr)_400px]">
          <div className="flex min-h-0 flex-col">
            <Queue docs={docs} selectedId={selectedId} onSelect={selectDoc} />
            <MiniProvenanceMap claim={miniSeg?.text} onExpand={() => openMap(miniSeg?.text, LENS_BY_CATEGORY[doc.category])} />
          </div>
          <Viewer
            doc={doc}
            selectedSegId={selectedSegId}
            onSelectSeg={selectSeg}
            showDiff={showDiff}
            setShowDiff={setShowDiff}
            layers={layers}
            setLayers={setLayers}
            onApplyAll={applyAll}
          />
          <RightPanel
            doc={doc}
            tab={tab}
            setTab={setTab}
            selectedSegId={selectedSegId}
            onSelectSeg={selectSeg}
            onSegAction={segAction}
            onUpdateRevision={updateRevision}
            onTraceClaim={traceClaim}
            selectedCitationId={selectedCitationId}
            setSelectedCitationId={setSelectedCitationId}
            onJump={jumpToSeg}
            reviewerId={reviewerId}
            setReviewerId={setReviewerId}
            onToggleCheck={toggleCheck}
            onApprove={approve}
            onReject={() => setModal('reject')}
            onReopen={reopen}
            onViewSeal={() => setModal('seal')}
            sealing={sealing}
          />
        </div>

      {mapOpen && <ProvenanceMapOverlay incoming={mapIncoming} onClose={() => setMapOpen(false)} />}

      {modal === 'ingest' && <IngestModal onClose={() => setModal(null)} onIngest={ingest} onIngestUpload={ingestUpload} />}
      {modal === 'reject' && <RejectModal doc={doc} onClose={() => setModal(null)} onConfirm={reject} />}
      {modal === 'seal' && doc.seal && <SealModal doc={doc} onClose={() => setModal(null)} />}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-pop flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {t.tone === 'success' ? <Vee mood="happy" size={26} /> : <Info className="h-4 w-4 text-sky-500" />}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
