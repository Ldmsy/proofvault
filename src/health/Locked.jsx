import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Loader2, FlaskConical } from 'lucide-react';
import { VeeSays } from '../components/Vee.jsx';

const post = async (url, body = {}) => {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
};

// The permanent record: every sealed entry in the signed ledger, with a one-click integrity check.
export default function Locked() {
  const [entries, setEntries] = useState(null);
  const [check, setCheck] = useState(null); // verify result
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tampered, setTampered] = useState(null);

  const load = async () => {
    setError('');
    try {
      setEntries((await post('/api/ledger')).entries);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const verify = async (tamper) => {
    setBusy(true);
    setError('');
    try {
      setCheck(await post('/api/verify', tamper ? { tamper } : {}));
      setTampered(tamper?.archiveId || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const byId = Object.fromEntries((check?.records || []).map((r) => [r.archiveId, r]));
  const rows = entries ? [...entries].reverse() : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locked records</h1>
          <p className="mt-1 text-slate-500">Every signed version, chained together. If anyone changes a record later, the check fails.</p>
        </div>
        <button onClick={() => verify()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check integrity
        </button>
      </div>

      {check && (
        <div className="mt-5">
          {check.ok ? (
            <VeeSays mood="happy" size={56}>
              All <b>{check.length}</b> records check out — content, signatures and links are intact.
            </VeeSays>
          ) : (
            <VeeSays
              mood="alert"
              size={56}
              action={
                tampered && (
                  <button onClick={() => verify()} className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                    Run the real check again
                  </button>
                )
              }
            >
              {tampered ? 'Simulated edit detected. ' : ''}Record <b>#{check.brokenAt}</b> no longer matches what was signed, and every record after it is flagged too.
              {tampered && <span className="text-slate-500"> (Simulation only — nothing was actually changed.)</span>}
            </VeeSays>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {!entries && !error && (
          <li className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the ledger…
          </li>
        )}
        {rows.map((e) => {
          const r = byId[e.archiveId];
          return (
            <li key={e.archiveId} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${r ? (r.ok ? 'bg-cyan-100 text-cyan-800' : 'bg-red-100 text-red-700') : 'bg-slate-100 text-slate-500'}`}>
                {r && !r.ok ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{e.title}</span>
                <span className="block truncate text-xs text-slate-500">
                  #{e.index} · {e.archiveId} · {e.reviewer?.name} · {new Date(e.sealedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {r && !r.ok && <span className="block text-xs text-red-700">{r.downstreamOfBreak ? 'Chain broken upstream' : r.reason}</span>}
              </span>
              <button
                onClick={() => verify({ archiveId: e.archiveId, text: `${e.textPreview} [edited]` })}
                title="Simulate someone editing this record, then run the check"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                <FlaskConical className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Simulate edit</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
