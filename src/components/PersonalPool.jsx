import { useState } from 'react';
import {
  Sparkles, Waves, AlertOctagon, AlertTriangle, ShieldCheck, Eye, FileText, Image as ImageIcon,
  ArrowUpRight, Droplets, Filter, Plus, CheckCircle2, Loader2, Compass, Layers, Lock, Cpu, BookOpen, X,
} from 'lucide-react';
import { Card, Modal } from './ui.jsx';

/* ───────────────────────── Simulated Multimodal Scene Illustrations ───────────────────────── */

function MultimodalCanvas({ artifact, selectedBoxId, onSelectBox, purified }) {
  const { sceneType, visionBoxes } = artifact;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white shadow-inner dark:border-slate-800">
      {/* Top status bar inside visual frame */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-3 py-1.5 text-[10.5px]">
        <span className="inline-flex items-center gap-1.5 font-mono text-cyan-300">
          <Cpu className="h-3.5 w-3.5" /> Claude Opus 5.5 Vision-Language Inspector
        </span>
        <span className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] ${purified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {purified ? 'C2PA Context Restored' : `${visionBoxes.length} Visual Flag${visionBoxes.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Scene SVG artwork */}
      <div
        className={
          artifact.imageUrl
            ? 'relative mx-auto w-fit select-none overflow-hidden'
            : 'relative h-48 w-full select-none overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900'
        }
      >
        {artifact.imageUrl && <img src={artifact.imageUrl} alt={artifact.imageCaption} className="block max-h-72 w-auto max-w-full" />}

        {sceneType === 'bus-shelter' && (
          <svg viewBox="0 0 400 180" className="h-full w-full">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="400" height="180" fill="url(#skyGrad)" />
            {/* Road & platform */}
            <rect x="0" y="135" width="400" height="45" fill="#090d16" />
            <line x1="0" y1="158" x2="400" y2="158" stroke="#fbbf24" strokeDasharray="12 10" strokeWidth="1.5" opacity="0.5" />
            {/* Shelter structure */}
            <rect x="38" y="32" width="165" height="103" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <rect x="46" y="42" width="110" height="36" rx="3" fill="#0f172a" stroke="#334155" />
            <text x="54" y="57" fill={purified ? '#34d399' : '#f87171'} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              {purified ? '04:55 AM · TRACKWORK' : '12:30 PM · WEEKDAY [AI]'}
            </text>
            <text x="54" y="70" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
              {purified ? 'Original CCTV Timestamp' : 'Sharpened / Inpainted Sign'}
            </text>
            {/* Empty bench */}
            <rect x="56" y="108" width="120" height="8" rx="2" fill="#64748b" />
            <rect x="66" y="116" width="6" height="19" fill="#475569" />
            <rect x="160" y="116" width="6" height="19" fill="#475569" />
            {/* Right side: cropped shuttle queue */}
            <rect x="245" y="42" width="135" height="93" rx="4" fill={purified ? '#064e3b' : '#1e1b4b'} fillOpacity="0.45" stroke="#64748b" strokeDasharray="4 4" />
            <text x="312" y="64" textAnchor="middle" fill="#fb923c" fontSize="8.5" fontWeight="bold">
              {purified ? 'UN-CROPPED FRAME:' : 'CROPPED OUT OF PHOTO'}
            </text>
            <text x="312" y="77" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">
              38 commuters in shuttle queue
            </text>
            {/* Silhouettes of commuters */}
            {[265, 282, 299, 316, 333, 350].map((cx, idx) => (
              <g key={cx} opacity={purified ? 0.95 : 0.35}>
                <circle cx={cx} cy={98 + (idx % 2) * 3} r="6" fill={purified ? '#34d399' : '#fb923c'} />
                <rect x={cx - 5} y={106} width="10" height="22" rx="3" fill={purified ? '#10b981' : '#f97316'} />
              </g>
            ))}
          </svg>
        )}

        {sceneType === 'clinical-card' && (
          <svg viewBox="0 0 400 180" className="h-full w-full">
            <rect width="400" height="180" fill="#0f172a" />
            {/* Left pill dosage card */}
            <rect x="24" y="26" width="180" height="72" rx="8" fill="#1e293b" stroke="#475569" />
            <circle cx="50" cy="62" r="15" fill={purified ? '#10b981' : '#ef4444'} fillOpacity="0.2" stroke={purified ? '#10b981' : '#ef4444'} strokeWidth="1.5" />
            <text x="50" y="65" textAnchor="middle" fill={purified ? '#34d399' : '#f87171'} fontSize="9" fontWeight="bold">Rx</text>
            <text x="74" y="52" fill="#f8fafc" fontSize="10" fontWeight="bold">
              {purified ? 'Metoprolol 50 mg BD' : 'Metoprolol 500 mg BD'}
            </text>
            <text x="74" y="66" fill={purified ? '#34d399' : '#fca5a5'} fontSize="8" fontFamily="monospace">
              {purified ? '✔ Verified against MHR PBS' : '⚠ 10× ASR Dictation Error'}
            </text>
            <text x="74" y="80" fill="#94a3b8" fontSize="7.5">
              Morning &amp; Evening · Oral Tablet
            </text>
            {/* Bottom status bar */}
            <rect x="24" y="110" width="180" height="44" rx="6" fill="#1e293b" stroke="#334155" />
            <text x="36" y="128" fill="#cbd5e1" fontSize="8.5" fontWeight="bold">
              {purified ? 'ECG Status: PENDING UPLOAD' : 'ECG Status: ✔ NORMAL (AI Inferred)'}
            </text>
            <text x="36" y="142" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
              {purified ? 'Father MI @ 58 restored' : 'Family CVD Risk: None (Inverted)'}
            </text>
            {/* Right wellness card */}
            <rect x="220" y="26" width="156" height="128" rx="8" fill="#2e1065" fillOpacity="0.45" stroke="#a855f7" strokeOpacity="0.5" />
            <text x="298" y="52" textAnchor="middle" fill="#e9d5ff" fontSize="9.5" fontWeight="bold">
              Women 65+ Wellness Guide
            </text>
            <text x="298" y="68" textAnchor="middle" fill="#fb923c" fontSize="8">
              {purified ? '[Biased Template Removed]' : '"Mild Stress & Tension"'}
            </text>
            <path d="M 244 108 Q 270 82, 298 108 T 352 108" fill="none" stroke="#c084fc" strokeWidth="2" />
            <text x="298" y="134" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">
              {purified ? 'Cardiac work-up prioritised' : 'Breathing exercises recommended'}
            </text>
          </svg>
        )}

        {sceneType === 'archive-photo' && (
          <svg viewBox="0 0 400 180" className="h-full w-full">
            <rect width="400" height="180" fill="#1c1917" />
            {/* Sepia archival frame */}
            <rect x="20" y="18" width="360" height="144" rx="4" fill="#292524" stroke="#78716c" strokeWidth="1.5" />
            {/* Banner in background */}
            <rect x="228" y="28" width="134" height="44" rx="3" fill="#44403c" stroke="#a8a29e" />
            <text x="295" y="46" textAnchor="middle" fill="#fde68a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              {purified ? ' COMITATO SOCCORSO / RELIEF ' : ' RIVERBEND RELIEF ONLY [AI] '}
            </text>
            <text x="295" y="60" textAnchor="middle" fill="#d6d3d1" fontSize="7">
              {purified ? 'Original Bilingual Sign (VPRS-8812)' : 'AI Upscaler Erased Italian/Chinese'}
            </text>
            {/* Group of volunteer figures */}
            {[68, 102, 136, 170].map((cx, i) => (
              <g key={cx}>
                <circle cx={cx} cy="72" r="12" fill={purified ? '#d6d3d1' : '#fca5a5'} fillOpacity="0.85" />
                <rect x={cx - 11} y="88" width="22" height="44" rx="4" fill="#57534e" />
                <text x={cx} y="75" textAnchor="middle" fill="#1c1917" fontSize="6.5" fontWeight="bold">
                  {purified ? `V${i + 1}` : 'AI'}
                </text>
              </g>
            ))}
            <text x="120" y="148" textAnchor="middle" fill="#e7e5e4" fontSize="8" fontFamily="monospace">
              {purified ? 'Master Glass-Plate + Box 14 Register Linked' : 'Generative Super-Resolution v4 (Unwatermarked)'}
            </text>
          </svg>
        )}

        {sceneType === 'custom-scan' && !artifact.imageUrl && (
          <svg viewBox="0 0 400 180" className="h-full w-full">
            <rect width="400" height="180" fill="#0f172a" />
            <rect x="28" y="24" width="168" height="130" rx="8" fill="#1e293b" stroke="#475569" />
            <text x="112" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              UPLOADED VISUAL LAYER
            </text>
            <text x="112" y="84" textAnchor="middle" fill="#f87171" fontSize="8" fontFamily="monospace">
              {purified ? '✔ C2PA Context Tagged' : '⚠ Missing C2PA Signature'}
            </text>
            <rect x="212" y="24" width="160" height="130" rx="8" fill="#1e293b" stroke="#475569" />
            <text x="292" y="65" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              CROSS-MODAL ALIGNMENT
            </text>
            <text x="292" y="84" textAnchor="middle" fill="#fb923c" fontSize="8" fontFamily="monospace">
              Opus 5.5 Claim-to-Source Check
            </text>
          </svg>
        )}

        {/* Interactive Opus 5.5 Vision Bounding Boxes */}
        {!purified &&
          visionBoxes.map((b) => {
            const isRed = b.tone === 'red';
            const active = selectedBoxId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBox(b.id)}
                style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                className={`group absolute rounded-md border-2 text-left transition-all ${
                  isRed
                    ? 'border-red-500 bg-red-500/15 hover:bg-red-500/25'
                    : 'border-orange-400 bg-orange-400/15 hover:bg-orange-400/25'
                } ${active ? 'ring-2 ring-white' : ''}`}
              >
                <span
                  className={`inline-block rounded-br px-1.5 py-0.5 font-mono text-[9px] font-semibold text-white ${
                    isRed ? 'bg-red-600' : 'bg-orange-500'
                  }`}
                >
                  {b.tag}
                </span>
              </button>
            );
          })}
      </div>

      <div className="border-t border-white/10 bg-slate-900/95 px-3 py-2 text-[11px] text-slate-300">
        <div className="font-medium text-slate-200">{artifact.imageCaption}</div>
        {!purified && (
          <div className="mt-1 text-[10.5px] text-amber-300/90">
            Click any bounding box on the image above to inspect Claude Opus 5.5 pixel &amp; framing forensics.
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Custom Scan Modal (Opus 5.5 Live) ───────────────────────── */

function CustomScanModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [modalityType, setModalityType] = useState('Image + Article');
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState(0);
  const mediaName = file?.name || '';

  const steps = [
    'Sending content to Claude Opus 5.5 via the local ProofVault backend...',
    'Claude is reading the text and attachment (vision / PDF)...',
    'Separating surface takeaway, propagation layer and red roots...',
    'Building the Contamination Pool (falls back to a simulated result on error)...',
  ];

  const handleStart = async (e) => {
    e.preventDefault();
    setScanning(true);
    setStep(0);
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + 1, steps.length - 1);
      setStep(current);
    }, 1800);
    try {
      await onSubmit({ title, text, file, modalityType });
    } finally {
      clearInterval(id);
    }
  };

  return (
    <Modal onClose={!scanning ? onClose : undefined}>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" /> Claude Opus 5.5 Multimodal Engine
          </div>
          <h2 className="mt-0.5 font-semibold">Scan Mixed-Media Content (Personal Lens)</h2>
        </div>
        {!scanning && (
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!scanning ? (
        <form onSubmit={handleStart} className="space-y-3.5 p-5 text-xs">
          <div>
            <label className="font-semibold uppercase tracking-wide text-slate-500">Modality Combination</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {['Image + Article', 'PDF Chart + Post', 'Historical Photo + Doc'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setModalityType(m)}
                  className={`rounded-lg border px-2.5 py-2 font-semibold transition ${
                    modalityType === m
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold uppercase tracking-wide text-slate-500">Headline / Post Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Viral Street Photo Claims 92% of Residents Oppose Transit Upgrade"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="font-semibold uppercase tracking-wide text-slate-500">Attach Image / Document (Optional)</label>
            <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-2.5 hover:border-indigo-500 dark:border-slate-700">
              <span className="truncate text-slate-500">{mediaName || 'Click to attach .jpg, .png, .pdf, or infographic…'}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">Browse</span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div>
            <label className="font-semibold uppercase tracking-wide text-slate-500">Article / Caption Text</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the article paragraph, caption, or social post you want Opus 5.5 to decompose into the Contamination Pool…"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-500 hover:to-cyan-500"
          >
            Run Opus 5.5 Multimodal Pool Analysis
          </button>
        </form>
      ) : (
        <div className="space-y-3 p-6">
          {steps.map((s, idx) => (
            <div key={s} className={`flex items-center gap-3 text-xs ${idx > step ? 'text-slate-400' : ''}`}>
              {idx < step ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : idx === step ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-slate-700" />
              )}
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ───────────────────────── Main Personal Multimodal Contamination Pool ───────────────────────── */

export default function PersonalPool({
  cases,
  selectedCaseId,
  onSelectCase,
  selectedNodeId,
  onSelectNode,
  onJumpToEnterprise,
  onAddCustomCase,
}) {
  const [purified, setPurified] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);

  const cur = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const { pool, artifact } = cur;

  // Determine currently focused node in the pool (default to first red root r1)
  const activeNodeId = selectedNodeId || 'r1';
  const allNodes = [pool.surface, ...pool.middle, ...pool.roots];
  const activeNode = allNodes.find((n) => n.id === activeNodeId) || pool.roots[0];

  const handleSelectCase = (id) => {
    setPurified(false);
    setSelectedBoxId(null);
    onSelectCase(id);
  };

  return (
    <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[380px_minmax(0,1fr)_360px]">
      {/* ─────────────── LEFT COLUMN: Multimodal Artifact & Opus 5.5 X-Ray ─────────────── */}
      <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5" /> Personal Multimodal Lens
              </div>
              <h2 className="text-sm font-semibold">Everyday Mixed-Media Cases</h2>
            </div>
            <button
              onClick={() => setScanOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" /> Live Scan
            </button>
          </div>

          {/* Case switcher pills */}
          <div className="mt-2.5 space-y-1.5">
            {cases.map((c) => {
              const active = c.id === cur.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${
                    active
                      ? 'border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/50'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {c.persona}
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      Surface Tint {c.surfaceTintScore}%
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs font-semibold">{c.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.modalities.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multimodal Artifact Breakdown */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scroll-thin">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              📖 Why this case matters (The Story)
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{cur.storyContext}</p>
          </div>

          {/* Modality 1: Image + Vision Bounding Boxes */}
          <MultimodalCanvas
            artifact={artifact}
            selectedBoxId={selectedBoxId}
            onSelectBox={(id) => {
              setSelectedBoxId(id);
              onSelectNode('r1');
            }}
            purified={purified}
          />

          {/* Selected Vision Box detail */}
          {!purified &&
            artifact.visionBoxes.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBoxId(b.id);
                  onSelectNode('r1');
                }}
                className={`cursor-pointer rounded-lg border p-2.5 text-xs transition ${
                  b.tone === 'red'
                    ? 'border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200'
                    : 'border-orange-500/40 bg-orange-500/10 text-orange-900 dark:text-orange-200'
                }`}
              >
                <div className="font-mono text-[10px] font-bold uppercase">{b.tag}</div>
                <div className="mt-0.5 text-[11.5px]">{b.finding}</div>
              </div>
            ))}

          {/* Modality 2: Document / Chart OCR */}
          <Card className="p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              <FileText className="h-3.5 w-3.5 text-orange-500" /> {artifact.docExcerpt.title}
            </div>
            <div className="mt-1.5 rounded bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] font-medium dark:bg-slate-800">
              {artifact.docExcerpt.stat}
            </div>
            <div className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">{artifact.docExcerpt.warning}</div>
          </Card>

          {/* Modality 3: Surface Article Text (Tinted Yellow) */}
          <Card className="p-3">
            <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Article Prose (What the Reader Sees)</span>
              <span className="text-amber-600 dark:text-amber-400">🟡 Tinted Yellow</span>
            </div>
            <div className="space-y-2.5">
              {artifact.articleQuotes.map((q) => (
                <div
                  key={q.id}
                  onClick={() => onSelectNode('surf-1')}
                  className="cursor-pointer rounded-lg border border-amber-400/40 bg-amber-400/10 p-2.5 text-xs transition hover:bg-amber-400/20"
                >
                  <p className="leading-relaxed text-slate-800 underline decoration-amber-400/80 decoration-2 underline-offset-4 dark:text-slate-100">
                    {q.text}
                  </p>
                  <div className="mt-1.5 text-[10.5px] text-amber-800 dark:text-amber-300/90">↳ {q.tint}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </aside>

      {/* ─────────────── CENTER COLUMN: THE CONTAMINATION POOL GRAPH ("水池图谱") ─────────────── */}
      <main className="flex min-h-0 flex-col overflow-y-auto p-4 scroll-thin">
        {/* Top Pool Control Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-amber-500" />
              <h1 className="text-sm font-bold">
                The Information Contamination Pool (信息溯源沉积池)
              </h1>
              <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                Claude Opus 5.5 Multimodal Graph
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              Why does the top of the pool look <span className="font-semibold text-amber-500">slightly yellow (mildly skewed)</span>? Because{' '}
              <span className="font-semibold text-red-500">deep-red misinformation &amp; bias sources</span> at the bottom of the pool diffuse upward.
            </p>
          </div>

          <button
            onClick={() => setPurified(!purified)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition ${
              purified
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'border border-amber-500/50 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300'
            }`}
          >
            <Droplets className="h-4 w-4" />
            {purified ? '✔ Pool Purified (Showing IM-Cleaned Water)' : 'Quarantine Red Roots & Purify Pool'}
          </button>
        </div>

        {/* ─────────────── THE 3-LAYER WATER POOL VISUALIZATION ─────────────── */}
        <div
          className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-500 ${
            purified
              ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/35 via-slate-900/90 to-slate-950 text-white'
              : 'border-amber-500/30 bg-gradient-to-b from-amber-500/20 via-orange-950/40 to-red-950/75 text-white'
          } bg-slate-950 shadow-xl`}
        >
          {/* Animated upward dye plumes SVG background */}
          <svg
            viewBox="0 0 600 420"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-75"
          >
            <defs>
              <linearGradient id="plumeToxic" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="52%" stopColor="#f97316" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="plumeClean" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Plume paths from 3 bottom roots -> 2 middle nodes -> 1 top surface */}
            <path
              d="M 110 355 C 110 275, 190 255, 200 210 C 210 155, 270 120, 300 78"
              fill="none"
              stroke={purified ? 'url(#plumeClean)' : 'url(#plumeToxic)'}
              strokeWidth={activeNodeId === 'r1' || activeNodeId === 'surf-1' ? '4' : '2.2'}
              className="plume-up"
            />
            <path
              d="M 300 355 C 300 280, 230 250, 200 210 C 200 150, 285 120, 300 78"
              fill="none"
              stroke={purified ? 'url(#plumeClean)' : 'url(#plumeToxic)'}
              strokeWidth={activeNodeId === 'r2' || activeNodeId === 'surf-1' ? '4' : '2.2'}
              className="plume-up"
            />
            <path
              d="M 300 355 C 300 280, 370 250, 400 210 C 400 150, 320 120, 300 78"
              fill="none"
              stroke={purified ? 'url(#plumeClean)' : 'url(#plumeToxic)'}
              strokeWidth={activeNodeId === 'r2' || activeNodeId === 'mid-2' ? '3.5' : '2'}
              className="plume-up"
            />
            <path
              d="M 490 355 C 490 275, 415 255, 400 210 C 390 155, 330 120, 300 78"
              fill="none"
              stroke={purified ? 'url(#plumeClean)' : 'url(#plumeToxic)'}
              strokeWidth={activeNodeId === 'r3' || activeNodeId === 'surf-1' ? '4' : '2.2'}
              className="plume-up"
            />
          </svg>

          {/* ──────── LAYER 1: TOP OF THE POOL (微微泛黄表层 · Surface Layer) ──────── */}
          <div className="relative z-10">
            <div className="mb-2 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest">
              <span className={`inline-flex items-center gap-1.5 ${purified ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${purified ? 'bg-emerald-400' : 'bg-amber-300 animate-ping'}`} />
                {purified
                  ? 'Layer 1 · Purified Water Surface (Verified Takeaway)'
                  : 'Layer 1 · Water Surface — Slightly Yellow / Tinted Takeaway (表层微黄现象)'}
              </span>
              <span className="font-mono text-[10px] text-slate-300">
                {purified ? '0% Surface Tinting' : pool.surface.tintLevel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectNode(pool.surface.id)}
              className={`w-full rounded-2xl border-2 p-4 text-left backdrop-blur-md transition-all ${
                purified
                  ? 'border-emerald-400/70 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                  : 'border-amber-300/80 bg-gradient-to-r from-amber-400/25 via-yellow-300/15 to-amber-500/20 shadow-lg shadow-amber-500/15'
              } ${activeNodeId === pool.surface.id ? 'ring-2 ring-white' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    purified ? 'bg-emerald-400/25 text-emerald-200' : 'bg-amber-300/30 text-amber-100'
                  }`}
                >
                  {purified ? '✔ IM-Verified Surface View' : '🟡 What Everyday Users See (Mildly Skewed Surface)'}
                </span>
                <span className="text-[10.5px] text-slate-200">Click to inspect surface layer →</span>
              </div>
              <div className="mt-2 text-sm font-bold text-white">
                {purified ? pool.surface.purifiedTitle : pool.surface.title}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-200/90">
                {purified ? pool.surface.purifiedSummary : pool.surface.summary}
              </p>
            </button>
          </div>

          {/* ──────── LAYER 2: MIDDLE WATER COLUMN (中层发酵传导 · Synthesis & Echo Chamber) ──────── */}
          <div className="relative z-10 my-4">
            <div className="mb-2 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest text-orange-300">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Layer 2 · Mid-Water Diffusion — Multimodal Synthesis &amp; Tone Laundering (中层加工扩散)
              </span>
              <span className="font-mono text-[10px] text-orange-200/80">Dilutes Red into Yellow ↑</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pool.middle.map((m) => {
                const active = activeNodeId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectNode(m.id)}
                    className={`rounded-xl border p-3 text-left backdrop-blur-md transition-all ${
                      purified
                        ? 'border-cyan-500/40 bg-cyan-950/30 opacity-75'
                        : 'border-orange-400/60 bg-orange-500/15 hover:bg-orange-500/25'
                    } ${active ? 'ring-2 ring-white' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-orange-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-orange-200">
                        🟠 {m.label}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300">{m.modality}</span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-white">{m.title}</div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-200/85">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ──────── LAYER 3: BOTTOM OF THE POOL (池底深红毒源 · Root Misinfo / Disinfo / Bias) ──────── */}
          <div className="relative z-10">
            <div className="mb-2 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-widest text-red-300">
              <span className="inline-flex items-center gap-1.5">
                <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                Layer 3 · Bottom of the Pool — Deep-Red Root Toxicity (池底深红毒源：错误 / 虚假 / 偏见源头)
              </span>
              <span className="font-mono text-[10px] text-red-200">Origin of Contamination</span>
            </div>

            <div className={`grid grid-cols-1 gap-3 ${pool.roots.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {pool.roots.map((r, idx) => {
                const active = activeNodeId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectNode(r.id)}
                    className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left backdrop-blur-md transition-all ${
                      purified
                        ? 'border-emerald-500/50 bg-slate-900/80'
                        : 'border-red-500 bg-gradient-to-t from-red-950/90 via-red-900/50 to-red-800/30 shadow-lg shadow-red-950/60 hover:border-red-400'
                    } ${active ? 'ring-2 ring-white' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ${
                          purified ? 'bg-emerald-500/25 text-emerald-300' : 'bg-red-600 text-white'
                        }`}
                      >
                        {purified ? 'Quarantined' : `🔴 Root #${idx + 1} · ${r.type}`}
                      </span>
                      <span className="font-mono text-[10px] text-red-200">{r.confidence}% conf</span>
                    </div>
                    <div className="mt-2 text-xs font-bold leading-snug text-white">{r.title}</div>
                    <div className="mt-1 font-mono text-[10px] text-red-200/90">{r.modality}</div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-200/85">{r.detail}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ─────────────── RIGHT COLUMN: OPUS 5.5 FORENSIC & IM KNOW-HOW INSPECTOR ─────────────── */}
      <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selected Pool Node Inspector
          </div>
          <span className="rounded bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
            Opus 5.5 Forensics
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto scroll-thin">
          {/* Node Detail Card */}
          <Card
            className={`border-l-4 p-3.5 ${
              activeNode.layer === 'root'
                ? 'border-l-red-500'
                : activeNode.layer === 'middle'
                ? 'border-l-orange-500'
                : 'border-l-amber-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  activeNode.layer === 'root'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-300'
                    : activeNode.layer === 'middle'
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {activeNode.layer === 'root'
                  ? `🔴 Deep-Red Root · ${activeNode.type}`
                  : activeNode.layer === 'middle'
                  ? `🟠 Mid-Water · ${activeNode.label}`
                  : '🟡 Water Surface · Reader Takeaway'}
              </span>
              {activeNode.confidence && (
                <span className="font-mono text-xs font-bold text-red-500">{activeNode.confidence}%</span>
              )}
            </div>

            <h3 className="mt-2 text-sm font-bold">{activeNode.title}</h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {activeNode.detail || activeNode.desc || activeNode.summary}
            </p>

            {activeNode.c2pa && (
              <div className="mt-3 rounded-lg bg-slate-100 p-2.5 font-mono text-[10.5px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <div className="font-sans text-[10px] font-bold uppercase text-slate-400">
                  C2PA &amp; Source Lineage
                </div>
                <div className="mt-0.5">{activeNode.c2pa}</div>
              </div>
            )}

            {activeNode.imTip && (
              <div className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Built-in IM Know-How
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed">{activeNode.imTip}</p>
              </div>
            )}
          </Card>

          {/* How the Pool Metaphor Works (Quick Pitch Card for Judges) */}
          <Card className="p-3.5">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              <BookOpen className="h-3.5 w-3.5 text-amber-500" /> Contamination Pool Legend
            </div>
            <div className="mt-2.5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
                <div>
                  <span className="font-semibold">🟡 Top Surface (Tinted Yellow):</span> Subtle framing or plausible-sounding conclusions that everyday users read and share.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
                <div>
                  <span className="font-semibold">🟠 Middle Column (Propagation):</span> Multimodal pairing &amp; AI style-smoothing that disguises raw errors.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
                <div>
                  <span className="font-semibold">🔴 Pool Floor (Deep Red Root):</span> The root misinformation, disinformation, or bias source poisoning the water from below.
                </div>
              </div>
            </div>
          </Card>

          {/* Story Bridge: Jump from Personal Pool -> Enterprise IM Gate */}
          <Card className="border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 p-3.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              🏛️ Upstream Governance Connection
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              How do we stop <span className="font-semibold text-red-500">Red Root Toxins</span> from entering the public pool? By intercepting them at the{' '}
              <span className="font-semibold">Enterprise IM Archival Gate</span> before records are sealed!
            </p>
            <div className="mt-2 font-mono text-[10.5px] text-slate-500">{cur.linkedDocLabel}</div>
            <button
              type="button"
              onClick={() => onJumpToEnterprise(cur.linkedDocId)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              Trace to Enterprise IM Gate ({cur.linkedDocId}) <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </Card>
        </div>
      </aside>

      {scanOpen && (
        <CustomScanModal
          onClose={() => setScanOpen(false)}
          onSubmit={async (payload) => {
            await onAddCustomCase(payload);
            setScanOpen(false);
            setPurified(false);
          }}
        />
      )}
    </div>
  );
}
