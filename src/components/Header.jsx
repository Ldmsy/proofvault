import { Network, Maximize2, Inbox, ShieldAlert, Fingerprint, Archive, Plus, Sun, Moon } from 'lucide-react';
import { Card } from './ui.jsx';
import Vee from './Vee.jsx';

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
          <Vee size={46} title="Vee, the ProofVault owl" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight">
              <span>ProofVault</span>
              <span className="font-normal text-slate-400">—</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                AI Record Integrity &amp; Multimodal Provenance Platform
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Aligned to NAA Information Management Standard · ISO 15489 · AS ISO 23081 · C2PA 2.1
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <details className="relative text-xs">
            <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">Demos</summary>
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-900">
              {[['hospital', 'Hospital check & lock'], ['bank', 'Banking review intake'], ['proofchain', 'ProofChain walkthrough'], ['system3d', '3D system cutaway'], ['exploded', 'Threats vs defences']].map(([path, label]) => <a key={path} href={`/${path}.html`} target="_blank" rel="noopener noreferrer" className="block rounded px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">{label}</a>)}
            </div>
          </details>
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
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
            className="inline-flex items-center gap-2 rounded-lg bg-brand-yellow px-3.5 py-2 text-sm font-bold text-slate-950 shadow-[0_3px_0_#d5b800] hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Upload / Ingest AI Record
            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-medium">MCP / API</span>
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric
          icon={Inbox}
          label="AI records pending review"
          value={metrics.pending}
          sub={`${metrics.queueOpen} in your queue · SLA 48h`}
          tone="bg-sky-500/15 text-sky-600 dark:text-sky-400"
        />
        <Metric
          icon={ShieldAlert}
          label="Findings intercepted"
          value={metrics.intercepted.toLocaleString()}
          sub={`+${metrics.sessionIntercepted} this session`}
          tone="bg-red-500/15 text-red-600 dark:text-red-400"
        />
        <Metric
          icon={Fingerprint}
          label="Avg. provenance score"
          value={`${metrics.provenance}/100`}
          sub="Source-matched claims, weighted"
          tone="bg-violet-500/15 text-violet-600 dark:text-violet-400"
        />
        <Metric
          icon={Archive}
          label="NAA / ISO 15489 compliance"
          value={`${metrics.compliance}%`}
          sub={`${metrics.sealed.toLocaleString()} records sealed to archive`}
          tone="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </header>
  );
}
