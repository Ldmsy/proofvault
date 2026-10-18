import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import Header from './components/Header.jsx';
import Queue from './components/Queue.jsx';
import Viewer from './components/Viewer.jsx';
import RightPanel from './components/RightPanel.jsx';
import { IngestModal, RejectModal, SealModal } from './components/Modals.jsx';
import { INITIAL_DOCS, INGEST_TEMPLATE, BASE_METRICS, REVIEWERS } from './data.js';
import { prepareDoc, provenanceScore, segStatus, sha256, workingText, RESOLVED } from './lib.js';

const ACTION_TEXT = {
  fix: 'Applied AI-suggested correction to',
  escalate: 'Requested SME human review of',
  reject: 'Rejected (struck from record)',
  verify: 'SME verified original wording of',
  undo: 'Reverted decision on',
};
const ACTION_STATUS = { fix: 'fixed', escalate: 'escalated', reject: 'rejected', verify: 'verified' };

export default function App() {
  const [docs, setDocs] = useState(() => INITIAL_DOCS.map(prepareDoc));
  const [selectedId, setSelectedId] = useState(INITIAL_DOCS[0].id);
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [selectedCitationId, setSelectedCitationId] = useState(null);
  const [tab, setTab] = useState('audit');
  const [showDiff, setShowDiff] = useState(false);
  const [layers, setLayers] = useState({ misinfo: true, bias: true });
  const [reviewerId, setReviewerId] = useState(REVIEWERS[0].id);
  const [modal, setModal] = useState(null); // 'ingest' | 'reject' | 'seal'
  const [sealing, setSealing] = useState(false);
  const [dark, setDark] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [ingestCount, setIngestCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const doc = docs.find((d) => d.id === selectedId);
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
    setSealing(true);
    const sealedAt = new Date().toISOString();
    const hash = await sha256(`${workingText(doc)}\n${doc.c2pa.manifest}\n${sealedAt}`);
    const signature = (await sha256(hash + reviewer.keyId)) + (await sha256(reviewer.keyId + hash));
    const seal = {
      archiveId: `PV-ARC-2026-${doc.id.split('-')[1].toUpperCase()}-${hash.slice(0, 6).toUpperCase()}`,
      hash,
      signature,
      sealedAt,
      reviewer,
      storage: 'ProofVault Immutable Archive (WORM) · AU sovereign region, Sydney',
    };
    updateDoc(doc.id, (d) => ({
      ...d,
      seal,
      status: 'Approved for Archive',
      audit: logEvent(d, `Approved & sealed to archive as ${seal.archiveId} · sha256:${hash.slice(0, 16)}…`),
    }));
    setSealing(false);
    setModal('seal');
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

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <Header metrics={metrics} dark={dark} onToggleTheme={() => setDark(!dark)} onIngest={() => setModal('ingest')} />

      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[300px_minmax(0,1fr)_400px]">
        <Queue docs={docs} selectedId={selectedId} onSelect={selectDoc} />
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

      {modal === 'ingest' && <IngestModal onClose={() => setModal(null)} onIngest={ingest} />}
      {modal === 'reject' && <RejectModal doc={doc} onClose={() => setModal(null)} onConfirm={reject} />}
      {modal === 'seal' && doc.seal && <SealModal doc={doc} onClose={() => setModal(null)} />}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-pop flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Info className="h-4 w-4 text-sky-500" />}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
