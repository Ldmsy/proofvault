import { ShieldCheck, Inbox, ShieldAlert, Fingerprint, Archive, Plus, Sun, Moon } from 'lucide-react';
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

export default function Header({ metrics, dark, onToggleTheme, onIngest }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 px-5 pb-4 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">
              ProofVault <span className="font-normal text-slate-400">—</span>{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">AI Record Integrity &amp; Archival Governance Platform</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Tenant: Australian Public Sector &amp; Health Demo · Aligned to NAA Information Management Standard · ISO 15489 · C2PA 2.1
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            AC
          </div>
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
          label="Hallucinations / disinfo intercepted"
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
