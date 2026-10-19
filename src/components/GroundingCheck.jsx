import { useEffect, useState } from 'react';
import { ScanSearch } from 'lucide-react';

// Promise cache also deduplicates StrictMode and rapid document switching.
const checks = new Map();
export default function GroundingCheck({ doc }) {
  const text = doc.segments.map(s => s.text).join('\n');
  const key = JSON.stringify([doc.id, text]);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key, loading: true });
  useEffect(() => {
    let active = true;
    setState({ key, loading: true });
    if (!checks.has(key)) {
      const request = fetch('/api/check-sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
        .then(async res => { const result = await res.json(); if (!res.ok) throw new Error(result.error || 'Grounding check failed'); return result; });
      checks.set(key, request);
      request.catch(() => { if (checks.get(key) === request) checks.delete(key); });
    }
    checks.get(key).then(result => { if (active) setState({ key, result }); }, err => { if (active) setState({ key, error: err.message }); });
    return () => { active = false; };
  }, [key, text, retry]);
  const current = state.key === key ? state : { loading: true };
  const report = current.result;
  return <section className="mb-4 space-y-2 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700">
    <h3 className="flex items-center gap-1.5 font-semibold"><ScanSearch className="h-4 w-4" /> ProofCore grounding · original draft</h3>
    <p className="text-[11px] text-slate-500">Register-based rules and text matching; not a truth probability.</p>
    {current.loading && <p role="status">Checking sources…</p>}
    {current.error && <p role="alert" className="text-red-500">{current.error}</p>}
    {report && <>
      <div className="flex h-2 overflow-hidden rounded bg-slate-200" aria-label={`Grounded ${report.grounding.percent.grounded}%, ungrounded ${report.grounding.percent.ungrounded}%, conflict ${report.grounding.percent.conflict}%`}>
        {['grounded', 'ungrounded', 'conflict'].map((s, i) => <div key={s} className={['bg-emerald-500', 'bg-amber-500', 'bg-red-500'][i]} style={{ width: `${report.grounding.percent[s]}%` }} />)}
      </div>
      <div className="flex flex-wrap gap-2">{Object.entries(report.grounding.percent).map(([name, value]) => <span key={name}>{name}: <b>{value}%</b></span>)}</div>
      <p>Ungrounded does not mean false: no record supports it, so a person must decide.</p>
      <details><summary className="cursor-pointer font-medium">Matched sources ({report.grounding.sources.length})</summary>
        <ul className="mt-2 space-y-2">{report.grounding.sources.map(s => <li key={s.id}><b>{s.id}</b> · {s.title} · {s.percent}%</li>)}</ul>
      </details>
      <details open><summary className="cursor-pointer font-medium">Non-ok claims ({report.claims.filter(c => !c.ok).length})</summary>
        <ul className="mt-2 max-h-52 space-y-3 overflow-y-auto">{report.claims.filter(c => !c.ok).map(c => <li key={c.id}><b>{c.label}</b><p>{c.claim}</p><p className="mt-1 text-slate-500">{c.evidence}</p></li>)}</ul>
      </details>
    </>}
    <button disabled={current.loading} onClick={() => { checks.delete(key); setRetry(n => n + 1); }} className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700 disabled:opacity-40">Run grounding check</button>
  </section>;
}
