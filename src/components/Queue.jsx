import { useState } from 'react';
import { Search, GitBranch, AlertTriangle } from 'lucide-react';
import { CATEGORY_ICON, RiskBadge, StatusBadge, ScoreBar } from './ui.jsx';
import { currentVersion, issueCounts, provenanceScore } from '../lib.js';
import Vee from './Vee.jsx';

const FILTERS = ['All', 'High', 'Medium', 'Low'];

export default function Queue({ docs, selectedId, onSelect }) {
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('All');

  const visible = docs.filter(
    (d) => (risk === 'All' || d.risk === risk) && d.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <aside className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">AI Record Queue</h2>
          <span className="text-[11px] text-slate-500">{visible.length} records</span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="mt-2 flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setRisk(f)}
              className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                risk === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 scroll-thin">
        {visible.map((doc) => {
          const Icon = CATEGORY_ICON[doc.category];
          const c = issueCounts(doc);
          const score = provenanceScore(doc);
          const active = doc.id === selectedId;
          return (
            <button
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[13px] font-semibold leading-snug">{doc.title}</div>
                  <div className="mt-1 truncate text-[11px] text-slate-500">{doc.org}</div>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <RiskBadge risk={doc.risk} />
                <StatusBadge status={doc.status} />
              </div>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-slate-500">
                <GitBranch className="h-3 w-3" />
                v1.0 AI Draft <span className="text-slate-400">→</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {currentVersion(doc) === 'v1.0 AI Draft' ? 'v1.1 awaiting audit' : currentVersion(doc)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <ScoreBar value={score} />
                </div>
                <span className="w-7 text-right text-[11px] font-semibold tabular-nums">{score}%</span>
                {c.open + c.escalated > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {c.open + c.escalated}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {!visible.length && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-slate-500">
            <Vee mood="think" size={56} />
            Nothing matches that search.
          </div>
        )}
      </div>
    </aside>
  );
}
