import { useState } from 'react';
import GroundingCheck from './GroundingCheck.jsx';
import {
  ScanSearch, Network, ClipboardCheck, Wand2, UserCheck, XCircle, Undo2, ChevronLeft, ChevronRight, BookOpen, Scale,
  FileSearch, Gauge, CheckCircle2, AlertTriangle, ShieldCheck, Stamp, RotateCcw, History, BadgeCheck, Cpu, Hash, KeyRound, Link2, PenLine,
} from 'lucide-react';
import { FLAG_META, SEG_STATUS_META, Card } from './ui.jsx';
import { CHECKLIST, REVIEWERS } from '../data.js';
import { flaggedSegments, segStatus, issueCounts, wordDiff, fmtTime, RESOLVED, getRevisedText } from '../lib.js';

const TABS = [
  { key: 'audit', label: 'Audit Insight', icon: ScanSearch },
  { key: 'graph', label: 'Provenance Graph', icon: Network },
  { key: 'signoff', label: 'IM Sign-off', icon: ClipboardCheck },
];

/* ───────────────────────── Audit insight ───────────────────────── */

function AuditTab({ doc, selectedSegId, onSelectSeg, onSegAction, onUpdateRevision, onTraceClaim, locked }) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const flags = flaggedSegments(doc);
  const seg = flags.find((s) => s.id === selectedSegId);

  if (!seg) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Select a highlighted paragraph, or pick a finding below.</p>
        {flags.map((s) => {
          const meta = FLAG_META[s.flag.type];
          const st = segStatus(doc, s.id);
          return (
            <button
              key={s.id}
              onClick={() => onSelectSeg(s.id)}
              className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${meta.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label} · {s.flag.severity}
                </span>
                <span className={`rounded px-1.5 py-px text-[10px] ${SEG_STATUS_META[st].cls}`}>{SEG_STATUS_META[st].label}</span>
              </div>
              <div className="mt-1 text-[13px] font-medium">{s.flag.title}</div>
              <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{s.section}</div>
            </button>
          );
        })}
      </div>
    );
  }

  const meta = FLAG_META[seg.flag.type];
  const st = segStatus(doc, seg.id);
  const idx = flags.indexOf(seg);
  const currentRevised = getRevisedText(doc, seg);
  const go = (d) => {
    setEditing(false);
    onSelectSeg(flags[(idx + d + flags.length) % flags.length].id);
  };

  return (
    <div key={seg.id} className="animate-pop space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => onSelectSeg(null)} className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          ← All findings
        </button>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <button onClick={() => go(-1)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {idx + 1} / {flags.length}
          <button onClick={() => go(1)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Card className={`overflow-hidden border-l-4 ${seg.flag.type === 'misinfo' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${meta.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
            </span>
            <span className="text-[10.5px] font-semibold uppercase text-slate-500">{seg.flag.severity} severity</span>
          </div>
          <h3 className="mt-2 text-sm font-semibold">{seg.flag.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <Gauge className="h-3.5 w-3.5" /> Detector confidence
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className={`h-full ${meta.dot}`} style={{ width: `${seg.flag.confidence}%` }} />
            </div>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{seg.flag.confidence}%</span>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 p-3 text-[12.5px] dark:border-slate-800">
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
              <Scale className="h-3 w-3" /> IM principle at risk
            </div>
            <div className="rounded-md bg-indigo-500/10 px-2.5 py-1.5 font-medium text-indigo-800 dark:text-indigo-200">{seg.flag.principle}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {seg.flag.standards.map((s) => (
                <span key={s} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
              <BookOpen className="h-3 w-3" /> Why this was flagged
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{seg.flag.rationale}</p>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
              <FileSearch className="h-3 w-3" /> Evidence trail
            </div>
            <p className="rounded-md bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {seg.flag.evidence}
            </p>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Wand2 className="h-3 w-3" /> Suggested correction
              </span>
              {!locked && !editing && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftText(currentRevised);
                    setEditing(true);
                  }}
                  className="inline-flex items-center gap-1 font-sans text-[10.5px] font-medium normal-case text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <PenLine className="h-3 w-3" /> Edit wording
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="w-full rounded-md border border-indigo-500 bg-white p-2 text-xs outline-none dark:bg-slate-950"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftText.trim()) onUpdateRevision(seg.id, draftText.trim());
                      setEditing(false);
                    }}
                    className="rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    Save &amp; Apply Custom Wording
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 leading-relaxed dark:border-slate-700">
                {wordDiff(seg.text, currentRevised).map((p, i) =>
                  p.type === 'same' ? (
                    <span key={i}>{p.text}</span>
                  ) : p.type === 'del' ? (
                    <span key={i} className="bg-red-500/15 text-red-700 line-through dark:text-red-300">
                      {p.text}
                    </span>
                  ) : (
                    <span key={i} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {p.text}
                    </span>
                  )
                )}
              </p>
            )}
          </div>
        </div>
      </Card>

      {st !== 'open' && (
        <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${SEG_STATUS_META[st].cls}`}>
          <span>Status: {SEG_STATUS_META[st].label}</span>
          {!locked && (
            <button onClick={() => onSegAction(seg.id, 'undo')} className="inline-flex items-center gap-1 hover:underline">
              <Undo2 className="h-3 w-3" /> Undo
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => onTraceClaim(seg.text, doc.category)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-500/40 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-500/10 dark:text-indigo-300"
      >
        <Network className="h-3.5 w-3.5" /> Trace in Provenance Map
      </button>

      {!locked && (st === 'open' || st === 'escalated') && (
        <div className="grid gap-2">
          <button
            onClick={() => onSegAction(seg.id, 'fix')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <Wand2 className="h-3.5 w-3.5" /> Apply suggested fix
          </button>
          <div className="grid grid-cols-2 gap-2">
            {st === 'open' ? (
              <button
                onClick={() => onSegAction(seg.id, 'escalate')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/40 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
              >
                <UserCheck className="h-3.5 w-3.5" /> Request human review
              </button>
            ) : (
              <button
                onClick={() => onSegAction(seg.id, 'verify')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
              >
                <BadgeCheck className="h-3.5 w-3.5" /> SME: keep original
              </button>
            )}
            <button
              onClick={() => onSegAction(seg.id, 'reject')}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject paragraph
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Provenance graph ───────────────────────── */

const CIT_META = {
  verified: { label: 'Source matched', color: '#10b981', cls: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  partial: { label: 'Partial — source carries bias', color: '#f59e0b', cls: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  conflict: { label: 'Source contradicts claim', color: '#ef4444', cls: 'text-red-600 dark:text-red-400', icon: XCircle },
  missing: { label: 'Source missing — warning', color: '#ef4444', cls: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
  remediated: { label: 'Remediated by reviewer', color: '#0ea5e9', cls: 'text-sky-600 dark:text-sky-400', icon: ShieldCheck },
};

function citStatus(doc, c) {
  if (c.status !== 'verified' && RESOLVED.includes(segStatus(doc, c.segId))) return 'remediated';
  return c.status;
}

function GraphTab({ doc, selectedCitationId, setSelectedCitationId, onJump }) {
  const cits = doc.citations;
  if (!cits.length) return <Card className="p-3 text-xs text-slate-500">No factual claims needing source checks were found in this record.</Card>;
  const sel = cits.find((c) => c.id === selectedCitationId) || cits[0];
  const rowH = 46;
  const H = cits.length * rowH + 16;
  const docY = H / 2;
  const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  return (
    <div className="space-y-3">
      <Card className="p-2">
        <div className="flex items-center justify-between px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Record</span>
          <span>AI claims</span>
          <span>Source records</span>
        </div>
        <svg viewBox={`0 0 360 ${H}`} className="w-full">
          {cits.map((c, i) => {
            const y = 8 + i * rowH + rowH / 2;
            const st = citStatus(doc, c);
            const m = CIT_META[st];
            const active = sel.id === c.id;
            return (
              <g key={c.id} className="cursor-pointer" onClick={() => setSelectedCitationId(c.id)} opacity={active ? 1 : 0.75}>
                <title>{c.claim}</title>
                <path d={`M64 ${docY} C 110 ${docY}, 110 ${y}, 150 ${y}`} fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1.5" />
                <path
                  d={`M178 ${y} L 246 ${y}`}
                  stroke={m.color}
                  strokeWidth={active ? 2.5 : 1.75}
                  fill="none"
                  className={st === 'missing' || st === 'conflict' ? 'flow-line' : ''}
                />
                <circle cx="164" cy={y} r={active ? 15 : 13} fill={m.color} fillOpacity="0.15" stroke={m.color} strokeWidth={active ? 2.5 : 1.5} />
                <text x="164" y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={m.color}>
                  C{i + 1}
                </text>
                <rect
                  x="248"
                  y={y - 14}
                  width="108"
                  height="28"
                  rx="6"
                  fill={st === 'missing' ? 'transparent' : m.color}
                  fillOpacity="0.1"
                  stroke={m.color}
                  strokeDasharray={st === 'missing' ? '4 3' : '0'}
                  strokeWidth={active ? 2 : 1}
                />
                <text x="302" y={y + 3.5} textAnchor="middle" fontSize="9" fill="currentColor" className="text-slate-700 dark:text-slate-200">
                  {c.source ? short(c.source, 20) : '⚠ no source found'}
                </text>
              </g>
            );
          })}
          <rect x="4" y={docY - 22} width="60" height="44" rx="8" className="fill-indigo-600" />
          <text x="34" y={docY - 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
            AI RECORD
          </text>
          <text x="34" y={docY + 10} textAnchor="middle" fontSize="8" fill="white" fillOpacity="0.8">
            {doc.id}
          </text>
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pt-1 text-[10px] text-slate-500">
          {['verified', 'partial', 'conflict', 'missing', 'remediated'].map((k) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: CIT_META[k].color }} /> {CIT_META[k].label.split(' — ')[0]}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Claim lineage · C{cits.indexOf(sel) + 1}</div>
        <ol className="relative mt-2 space-y-3 border-l border-slate-200 pl-4 text-[12px] dark:border-slate-700">
          <li>
            <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <div className="text-[10px] font-semibold uppercase text-slate-400">AI statement</div>
            <div className="font-medium">“{sel.claim}”</div>
          </li>
          <li>
            <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
            <div className="text-[10px] font-semibold uppercase text-slate-400">Cited / matched source</div>
            <div className="font-mono text-[11px]">{sel.source || '— none located in EDRMS, data lake or public registers —'}</div>
            {sel.alt && <div className="font-mono text-[11px] text-slate-500">+ {sel.alt}</div>}
          </li>
          {(() => {
            const st = citStatus(doc, sel);
            const m = CIT_META[st];
            const Icon = m.icon;
            return (
              <li>
                <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                <div className="text-[10px] font-semibold uppercase text-slate-400">Verification result</div>
                <div className={`inline-flex items-center gap-1 font-semibold ${m.cls}`}>
                  <Icon className="h-3.5 w-3.5" /> {m.label}
                </div>
                <div className="text-slate-600 dark:text-slate-400">{sel.note}</div>
              </li>
            );
          })()}
        </ol>
        <button onClick={() => onJump(sel.segId)} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          <Link2 className="h-3 w-3" /> Jump to paragraph in record
        </button>
      </Card>

      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">C2PA Content Credentials</div>
          {doc.c2pa.unsigned ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3" /> No credentials
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Demo metadata
            </span>
          )}
        </div>
        <dl className="space-y-1.5 text-[11px]">
          {[
            [Cpu, 'Generator', doc.c2pa.generator],
            [Cpu, 'Model version', doc.c2pa.model],
            [History, 'Created', `${fmtTime(doc.c2pa.created)} AEDT`],
            [Hash, 'Content hash', doc.c2pa.hash],
            [KeyRound, 'Signer', doc.c2pa.signer],
            [Link2, 'Manifest', doc.c2pa.manifest],
            [Network, 'Action chain', doc.c2pa.action],
          ].map(([Icon, k, v]) => (
            <div key={k} className="grid grid-cols-[96px_1fr] gap-2">
              <dt className="inline-flex items-center gap-1 text-slate-500">
                <Icon className="h-3 w-3" /> {k}
              </dt>
              <dd className="break-all font-mono text-[10.5px] text-slate-700 dark:text-slate-300">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

/* ───────────────────────── Sign-off ───────────────────────── */

function SignOffTab({ doc, reviewerId, setReviewerId, onToggleCheck, onApprove, onReject, onReopen, onViewSeal, sealing }) {
  const c = issueCounts(doc);
  const flags = flaggedSegments(doc);
  const openOf = (type) => flags.filter((s) => s.flag.type === type && !RESOLVED.includes(segStatus(doc, s.id))).length;
  const hints = {
    authenticity: openOf('misinfo') ? [false, `${openOf('misinfo')} mis/disinformation finding(s) unresolved`] : [true, 'All factual findings resolved'],
    bias: openOf('bias') ? [false, `${openOf('bias')} bias finding(s) unresolved`] : [true, 'All bias findings resolved'],
    metadata: [true, 'Demo C2PA metadata · not cryptographically validated'],
    value: [true, doc.retention],
  };
  const allChecked = CHECKLIST.every((i) => doc.checklist[i.key]);
  const unresolved = c.open + c.escalated;
  const canApprove = allChecked && unresolved === 0 && !sealing;
  const returned = doc.status === 'Returned for Regeneration';

  return (
    <div className="space-y-3">
      {doc.seal && (
        <Card className="border-emerald-500/40 bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <Stamp className="h-4 w-4" /> Sealed to archive
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">{doc.seal.archiveId}</div>
          <div className="mt-0.5 break-all font-mono text-[10px] text-slate-500">sha256:{doc.seal.hash}</div>
          <button onClick={onViewSeal} className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
            View seal certificate →
          </button>
        </Card>
      )}
      {returned && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <RotateCcw className="h-4 w-4" /> Returned for regeneration
          </div>
          <p className="mt-1 text-[11px] text-slate-500">The AI system has been instructed to regenerate this record with the reviewer feedback attached.</p>
          <button onClick={onReopen} className="mt-2 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Re-open review
          </button>
        </Card>
      )}

      <Card className="p-3">
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Compliance checklist</div>
        <div className="space-y-2">
          {CHECKLIST.map((item) => {
            const [ok, hint] = hints[item.key];
            const checked = !!doc.checklist[item.key];
            return (
              <label
                key={item.key}
                className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition ${
                  checked ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800'
                } ${doc.seal || returned ? 'pointer-events-none opacity-70' : ''}`}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggleCheck(item.key)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold">{item.label}</div>
                  <div className="text-[11px] leading-snug text-slate-500">{item.desc}</div>
                  <div className={`mt-1 inline-flex items-center gap-1 text-[10.5px] font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {hint}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {!doc.seal && !returned && (
        <Card className="p-3">
          <label className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Accountable reviewer</label>
          <select
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            {REVIEWERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.role}
              </option>
            ))}
          </select>
          {!canApprove && (
            <div className="mt-2 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              {unresolved > 0 ? `${unresolved} finding(s) still open or awaiting SME review. ` : ''}
              {!allChecked ? 'Complete all checklist items to enable sealing.' : ''}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reject &amp; Regenerate
            </button>
            <button
              disabled={!canApprove}
              onClick={onApprove}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Stamp className="h-3.5 w-3.5" /> {sealing ? 'Sealing…' : 'Approve & Seal'}
            </button>
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div className="mb-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
          <History className="h-3 w-3" /> Session activity log
        </div>
        <ol className="space-y-2">
          {[...doc.audit].reverse().map((e, i) => (
            <li key={i} className="flex gap-2 text-[11px]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <div>
                <span className="font-mono text-slate-400">{fmtTime(e.at)}</span> · <span className="font-semibold">{e.actor}</span>
                <div className="text-slate-600 dark:text-slate-400">{e.text}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

export default function RightPanel(props) {
  const { tab, setTab, doc } = props;
  const c = issueCounts(doc);
  const locked = !!doc.seal || doc.status === 'Returned for Regeneration';
  return (
    <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-[11.5px] font-semibold transition ${
              tab === key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
            {key === 'audit' && c.open + c.escalated > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 text-[9.5px] text-white">{c.open + c.escalated}</span>
            )}
            {tab === key && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 scroll-thin">
        <GroundingCheck doc={doc} />
        {tab === 'audit' && <AuditTab {...props} locked={locked} />}
        {tab === 'graph' && <GraphTab {...props} />}
        {tab === 'signoff' && <SignOffTab {...props} />}
      </div>
    </aside>
  );
}
