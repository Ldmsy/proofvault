import { Network, Maximize2, ShieldCheck, Inbox, ShieldAlert, Fingerprint, Archive, Plus, Sun, Moon } from 'lucide-react';
import { Card } from './ui.jsx';

function Metric({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{sub}</div>
      </div>
    </Card>
  );
}

export default function Header({
  metrics,
  dark,
  onToggleTheme,
  onIngest,
  onOpenMap,
}) {
  return (
    <header className="border-b border-slate-200 bg-white/80 px-5 pb-4 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight">
              <span>ProofVault</span>
              <span className="font-normal text-slate-400">—</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                AI Record Integrity &amp; Multimodal Provenance Platform
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Aligned to NAA Information Management Standard · ISO 15489 · AS ISO 23081 · C2PA 2.1 · Demo dashboard · optional server-side model extraction
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <details className="relative text-xs">
            <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">Demos</summary>
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-900">
              {[['proofchain', 'ProofChain walkthrough'], ['system3d', '3D system cutaway'], ['exploded', 'Threats vs defences']].map(([path, label]) => <a key={path} href={`/${path}.html`} target="_blank" rel="noopener noreferrer" className="block rounded px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{label}</a>)}
            </div>
          </details>
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow hover:from-indigo-500 hover:to-cyan-500"
          >
            <Network className="h-3.5 w-3.5" />
            Provenance Map
            <Maximize2 className="h-3 w-3 opacity-80" />
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle light / dark"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onIngest}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> Upload / Ingest AI Record
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">MCP / API</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          icon={Inbox}
          label="AI records pending review (demo)"
          value={metrics.pending}
          sub={`${metrics.queueOpen} in your queue · SLA 48h`}
          tone="bg-sky-500/15 text-sky-600 dark:text-sky-400"
        />
        <Metric
          icon={ShieldAlert}
          label="Findings intercepted (demo)"
          value={metrics.intercepted.toLocaleString()}
          sub={`+${metrics.sessionIntercepted} this session · pre-authored demo findings`}
          tone="bg-red-500/15 text-red-600 dark:text-red-400"
        />
        <Metric
          icon={Fingerprint}
          label="Avg. provenance score (demo)"
          value={`${metrics.provenance}/100`}
          sub="Illustrative score · not the grounding report"
          tone="bg-violet-500/15 text-violet-600 dark:text-violet-400"
        />
        <Metric
          icon={Archive}
          label="Compliance metric (demo)"
          value={`${metrics.compliance}%`}
          sub={`${metrics.sealed.toLocaleString()} records sealed to archive`}
          tone="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </header>
  );
}
