import { useState } from 'react';
import { GitCompare, Wand2, Clock, User, Plug, CheckCircle2, XCircle, UserCheck, BadgeCheck, Lock } from 'lucide-react';
import { CATEGORY_ICON, RiskBadge, StatusBadge, FLAG_META, SEG_STATUS_META, Toggle, Card } from './ui.jsx';
import { segStatus, issueCounts, fmtTime, wordDiff, currentVersion, getRevisedText } from '../lib.js';

const VERSIONS = ['v1.0 AI Draft', 'v1.1 Human-Revised', 'v1.2 Audited & Sealed'];

function VersionChain({ doc }) {
  const cur = currentVersion(doc);
  const step = doc.seal ? 2 : cur.startsWith('v1.1') ? 1 : 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
      {VERSIONS.map((v, i) => (
        <span key={v} className="flex items-center gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 ${
              i === step
                ? 'bg-indigo-600 text-white'
                : i < step
                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}
          >
            {v}
          </span>
          {i < VERSIONS.length - 1 && <span className="text-slate-400">→</span>}
        </span>
      ))}
    </div>
  );
}

function StatusIcon({ status }) {
  const map = { fixed: CheckCircle2, rejected: XCircle, escalated: UserCheck, verified: BadgeCheck };
  const Icon = map[status];
  return Icon ? <Icon className="h-3 w-3" /> : null;
}

function Segment({ seg, index, doc, selected, layers, onSelect }) {
  const st = segStatus(doc, seg.id);
  const flag = seg.flag;
  const visibleFlag = flag && layers[flag.type];
  const meta = flag && FLAG_META[flag.type];
  const revText = getRevisedText(doc, seg);

  let body;
  if (!visibleFlag) {
    body = <span>{st === 'fixed' ? revText : seg.text}</span>;
  } else if (st === 'fixed') {
    body = <span className="rounded bg-emerald-500/10 px-1 text-emerald-800 dark:text-emerald-200">{revText}</span>;
  } else if (st === 'rejected') {
    body = <span className="text-slate-400 line-through decoration-slate-400">{seg.text}</span>;
  } else {
    body = (
      <span
        className={`cursor-pointer rounded px-1 underline decoration-2 underline-offset-4 transition ${meta.mark} ${
          st === 'escalated' ? 'outline-dashed outline-1 outline-violet-500' : ''
        } ${st === 'verified' ? 'decoration-sky-500 decoration-dotted' : ''}`}
      >
        {seg.text}
      </span>
    );
  }

  return (
    <div
      id={`seg-${seg.id}`}
      onClick={() => visibleFlag && onSelect(seg.id)}
      className={`group relative flex gap-3 rounded-lg px-3 py-2.5 transition ${
        visibleFlag ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''
      } ${selected ? `bg-slate-50 ring-2 dark:bg-slate-800/50 ${meta.ring}` : ''}`}
    >
      <div className="w-6 shrink-0 pt-0.5 text-right font-mono text-[10px] text-slate-400">{String(index + 1).padStart(2, '0')}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{seg.section}</span>
          {visibleFlag && (
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-semibold ${meta.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.short} · {flag.severity}
            </span>
          )}
          {visibleFlag && st !== 'open' && (
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-medium ${SEG_STATUS_META[st].cls}`}>
              <StatusIcon status={st} />
              {SEG_STATUS_META[st].label}
            </span>
          )}
        </div>
        <p className="text-[14px] leading-relaxed text-slate-800 dark:text-slate-200">{body}</p>
      </div>
    </div>
  );
}

function DiffText({ parts, side }) {
  return parts.map((p, i) => {
    if (p.type === 'same') return <span key={i}>{p.text}</span>;
    if (p.type === 'del' && side === 'left')
      return (
        <span key={i} className="rounded-sm bg-red-500/20 text-red-800 line-through decoration-red-500/60 dark:text-red-300">
          {p.text}
        </span>
      );
    if (p.type === 'add' && side === 'right')
      return (
        <span key={i} className="rounded-sm bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
          {p.text}
        </span>
      );
    return null;
  });
}

function DiffView({ doc, compareTo, onSelect }) {
  const rows = doc.segments.map((seg) => {
    let right = seg.text;
    let removed = false;
    if (compareTo === 'v11') right = getRevisedText(doc, seg);
    else {
      const st = segStatus(doc, seg.id);
      if (st === 'fixed') right = getRevisedText(doc, seg);
      if (st === 'rejected') removed = true;
    }
    return { seg, right, removed, changed: removed || right !== seg.text };
  });
  const changed = rows.filter((r) => r.changed).length;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded bg-red-500/15 px-1.5 py-0.5 font-medium text-red-700 dark:text-red-300">− removed</span>
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">+ added</span>
        <span>
          {changed} of {rows.length} paragraphs changed
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
        <div className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900">
          v1.0 · AI original output
        </div>
        <div className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900">
          {compareTo === 'v11' ? 'v1.1 · Human-revised (IM reviewer)' : 'Working copy · your decisions'}
        </div>
        {rows.map(({ seg, right, removed, changed: ch }) => {
          const parts = ch && !removed ? wordDiff(seg.text, right) : null;
          return (
            <div key={seg.id} className="contents">
              <div
                onClick={() => seg.flag && onSelect(seg.id)}
                className={`bg-white px-3 py-2.5 text-[13px] leading-relaxed dark:bg-slate-950 ${ch ? 'bg-red-50/60 dark:bg-red-950/20' : ''} ${seg.flag ? 'cursor-pointer' : ''}`}
              >
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{seg.section}</div>
                {parts ? <DiffText parts={parts} side="left" /> : removed ? <span className="bg-red-500/20 line-through">{seg.text}</span> : seg.text}
              </div>
              <div className={`bg-white px-3 py-2.5 text-[13px] leading-relaxed dark:bg-slate-950 ${ch ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{seg.section}</div>
                {parts ? <DiffText parts={parts} side="right" /> : removed ? <span className="italic text-slate-400">[paragraph removed by reviewer]</span> : right}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Viewer({ doc, selectedSegId, onSelectSeg, showDiff, setShowDiff, layers, setLayers, onApplyAll }) {
  const [compareTo, setCompareTo] = useState('v11');
  const Icon = CATEGORY_ICON[doc.category];
  const c = issueCounts(doc);
  const locked = !!doc.seal || doc.status === 'Returned for Regeneration';

  return (
    <main className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-snug">{doc.title}</h1>
                <div className="mt-0.5 text-xs text-slate-500">{doc.org}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" /> {doc.owner}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Plug className="h-3 w-3" /> {doc.channel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ingested {fmtTime(doc.ingestedAt)} AEDT
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex gap-1.5">
                <RiskBadge risk={doc.risk} />
                <StatusBadge status={doc.status} />
              </div>
              <VersionChain doc={doc} />
            </div>
          </div>
        </Card>

        <div className="sticky top-0 z-10 -mx-4 mt-3 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-100/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-[#070b14]/90">
          {['misinfo', 'bias'].map((t) => (
            <button
              key={t}
              onClick={() => setLayers({ ...layers, [t]: !layers[t] })}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                layers[t]
                  ? 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                  : 'border-transparent text-slate-400 line-through'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${FLAG_META[t].dot}`} />
              {FLAG_META[t].label} ({c[t]})
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            {showDiff && (
              <select
                value={compareTo}
                onChange={(e) => setCompareTo(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="v11">v1.0 vs v1.1 Human-revised</option>
                <option value="working">v1.0 vs Working copy</option>
              </select>
            )}
            <Toggle
              checked={showDiff}
              onChange={setShowDiff}
              label={
                <span className="inline-flex items-center gap-1">
                  <GitCompare className="h-3.5 w-3.5" /> Version Diff
                </span>
              }
            />
            <button
              disabled={locked || c.open === 0}
              onClick={onApplyAll}
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Wand2 className="h-3.5 w-3.5" /> Apply all AI fixes
            </button>
          </div>
        </div>

        {locked && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Lock className="h-3.5 w-3.5" />
            {doc.seal
              ? 'This record is signed in the ProofCore ledger. Content is read-only in this interface.'
              : 'Returned to the AI system for regeneration. Re-open the review in the sign-off tab to continue.'}
          </div>
        )}

        <Card className="mt-3 p-3">
          {showDiff ? (
            <DiffView doc={doc} compareTo={compareTo} onSelect={onSelectSeg} />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {doc.segments.map((seg, i) => (
                <Segment
                  key={seg.id}
                  seg={seg}
                  index={i}
                  doc={doc}
                  selected={selectedSegId === seg.id}
                  layers={layers}
                  onSelect={onSelectSeg}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="mt-3 px-1 text-[11px] text-slate-500">
          Click any highlighted paragraph to open its AI audit insight. Red = unsupported or false facts (mis/disinformation); orange = group bias or emotive framing.
        </div>
      </div>
    </main>
  );
}
