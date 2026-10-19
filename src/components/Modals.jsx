import { useEffect, useRef, useState } from 'react';
import { X, UploadCloud, Plug, Code2, Loader2, CheckCircle2, Stamp, Copy, Download, ShieldCheck, RotateCcw } from 'lucide-react';
import { Modal } from './ui.jsx';
import { MCP_CONNECTORS } from '../data.js';
import { ACCEPTED_TYPES, extractText, toParagraphs } from '../fileText.js';

const STEPS = ['Parsing record & extracting text', 'Validating C2PA manifest & signature', 'Running Opus 5.5 mis/disinformation & bias classifiers', 'Matching claims to source records'];
const UPLOAD_STEPS = ['Reading file & extracting text', 'Claude Opus 5.5 reviewing each paragraph', 'Building the record & audit trail'];

// A newly uploaded file is the only ingest path that calls the model.
async function analyseUpload(file, setStep) {
  setStep(0);
  const { paragraphs, truncated } = toParagraphs(await extractText(file));
  if (!paragraphs.length) throw new Error('No readable text found in this file');
  setStep(1);
  const res = await fetch('/api/record-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, paragraphs }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Analysis failed (HTTP ${res.status})`);
  setStep(2);
  return { fileName: file.name, paragraphs, truncated, analysis: json.analysis, model: json.model };
}

export function IngestModal({ onClose, onIngest, onIngestUpload }) {
  const [mode, setMode] = useState('mcp');
  const [connector, setConnector] = useState('assistbot');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const fileName = file?.name || '';
  const [step, setStep] = useState(-1);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const sourceLabel = mode === 'mcp' ? MCP_CONNECTORS.find((c) => c.id === connector).name : mode === 'file' ? `Upload · ${fileName}` : 'REST API · POST /v1/records';
  const ready = mode !== 'file' || fileName;

  const start = async () => {
    setError('');
    if (mode === 'file') {
      try {
        await onIngestUpload(await analyseUpload(file, setStep));
      } catch (err) {
        setStep(-1);
        setError(err.message);
      }
      return;
    }
    setStep(0);
    let s = 0;
    timer.current = setInterval(() => {
      s += 1;
      if (s >= STEPS.length) {
        clearInterval(timer.current);
        onIngest(sourceLabel);
      } else setStep(s);
    }, 650);
  };

  return (
    <Modal onClose={step < 0 ? onClose : undefined}>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="font-semibold">Ingest AI-generated record</h2>
          <p className="text-xs text-slate-500">Records are pre-screened before entering the IM review queue.</p>
        </div>
        {step < 0 && (
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {step < 0 ? (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {[
              ['mcp', 'MCP Connector', Plug],
              ['file', 'File Upload', UploadCloud],
              ['api', 'REST API', Code2],
            ].map(([k, l, Icon]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold ${
                  mode === k ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {l}
              </button>
            ))}
          </div>

          {mode === 'mcp' && (
            <div className="mt-4 space-y-2">
              {MCP_CONNECTORS.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                    connector === c.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <input type="radio" checked={connector === c.id} onChange={() => setConnector(c.id)} className="mt-1 accent-indigo-600" />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.desc}</div>
                  </div>
                  <span className="ml-auto rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Connected</span>
                </label>
              ))}
            </div>
          )}

          {mode === 'file' && (
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-10 text-center hover:border-indigo-500 dark:border-slate-700">
              <UploadCloud className="h-8 w-8 text-slate-400" />
              <div className="mt-2 text-sm font-medium">{fileName || 'Click to choose a file'}</div>
              <div className="text-xs text-slate-500">.docx, .pdf, .txt, .md, .html — reviewed paragraph by paragraph by Claude Opus 5.5</div>
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files[0] || null);
                  setError('');
                }}
              />
            </label>
          )}

          {mode === 'api' && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-200">
{`curl -X POST https://api.proofvault.example/v1/records \\
  -H "Authorization: Bearer $PV_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_system": "assistbot",
    "record_type": "conversation_summary",
    "content": "...",
    "c2pa_manifest": "urn:c2pa:...",
    "retention_hint": "customer-interaction"
  }'`}
            </pre>
          )}

          {error && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</div>}

          <button
            disabled={!ready}
            onClick={start}
            className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
          >
            Ingest &amp; pre-screen
          </button>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          {(mode === 'file' ? UPLOAD_STEPS : STEPS).map((s, i) => (
            <div key={s} className={`flex items-center gap-3 text-sm ${i > step ? 'text-slate-400' : ''}`}>
              {i < step ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : i === step ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600" />
              )}
              {s}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function RejectModal({ doc, onClose, onConfirm }) {
  const [reason, setReason] = useState('Regenerate with grounding restricted to verified source records; remove unsupported claims and emotive framing.');
  return (
    <Modal onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center gap-2 font-semibold">
          <RotateCcw className="h-4 w-4 text-red-500" /> Reject &amp; return for regeneration
        </div>
        <p className="mt-1 text-xs text-slate-500">{doc.title}</p>
        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Instruction to the AI system</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
          >
            Reject record
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SealModal({ doc, onClose }) {
  const seal = doc.seal;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(seal.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const cert = {
      archive_id: seal.archiveId,
      record_title: doc.title,
      record_id: doc.id,
      content_sha256: seal.hash,
      c2pa_parent_manifest: doc.c2pa.manifest,
      reviewer: seal.reviewer,
      signature: { algorithm: 'Ed25519', key_id: seal.reviewer.keyId, value: seal.signature },
      sealed_at: seal.sealedAt,
      retention: doc.retention,
      storage: seal.storage,
      checklist: doc.checklist,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seal.archiveId}.seal.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = [
    ['Archive record ID', seal.archiveId],
    ['Content hash (SHA-256)', seal.hash],
    ['Reviewer signature (Ed25519)', seal.signature],
    ['Signing key', seal.reviewer.keyId],
    ['Parent C2PA manifest', doc.c2pa.manifest],
    ['Retention & disposal', doc.retention],
    ['Storage', seal.storage],
  ];

  return (
    <Modal wide>
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-6 text-white">
        <Stamp className="absolute -right-4 -top-4 h-32 w-32 rotate-12 opacity-15" />
        <button onClick={onClose} className="absolute right-3 top-3 rounded p-1 hover:bg-white/15">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-100">
          <ShieldCheck className="h-4 w-4" /> Archival seal issued
        </div>
        <h2 className="mt-1 text-xl font-bold">Record approved &amp; sealed to archive</h2>
        <p className="mt-1 text-sm text-emerald-50/90">{doc.title}</p>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {seal.reviewer.name
              .split(' ')
              .filter((w) => !w.endsWith('.'))
              .map((w) => w[0])
              .join('')}
          </div>
          <div className="flex-1">
            <div className="font-semibold" style={{ fontFamily: 'cursive' }}>
              {seal.reviewer.name}
            </div>
            <div className="text-xs text-slate-500">{seal.reviewer.role}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            Signed
            <div className="font-mono text-slate-700 dark:text-slate-300">
              {new Date(seal.sealedAt).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
            </div>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[170px_1fr] gap-3 py-2">
              <dt className="text-xs font-medium text-slate-500">{k}</dt>
              <dd className="break-all font-mono text-[11.5px]">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {['ISO 15489-1 compliant', 'AS ISO 23081 metadata', 'NAA IM Standard', 'C2PA 2.1 manifest appended', 'WORM immutable'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> {t}
            </span>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy hash'}
          </button>
          <button onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" /> Download certificate
          </button>
          <button onClick={onClose} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
