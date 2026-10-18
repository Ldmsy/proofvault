import { HeartPulse, Landmark, Building2, MessagesSquare } from 'lucide-react';

export const CATEGORY_ICON = {
  Clinical: HeartPulse,
  Policy: Landmark,
  Corporate: Building2,
  Service: MessagesSquare,
};

const RISK_STYLE = {
  High: 'bg-red-500/15 text-red-600 ring-red-500/30 dark:text-red-400',
  Medium: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-400',
  Low: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-400',
};

const STATUS_STYLE = {
  'Pending Review': 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  Flagged: 'bg-red-500/15 text-red-700 dark:text-red-300',
  'Approved for Archive': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'Returned for Regeneration': 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

export function RiskBadge({ risk }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${RISK_STYLE[risk]}`}>
      {risk} Risk
    </span>
  );
}

export function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[status]}`}>{status}</span>;
}

export const FLAG_META = {
  misinfo: {
    label: 'Mis/Disinformation',
    short: 'Mis/Disinfo',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    mark: 'bg-red-500/10 decoration-red-500 hover:bg-red-500/20',
    ring: 'ring-red-500',
    chip: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
  bias: {
    label: 'Bias & Emotive Language',
    short: 'Bias',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    mark: 'bg-orange-500/10 decoration-orange-500 hover:bg-orange-500/20',
    ring: 'ring-orange-500',
    chip: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
};

export const SEG_STATUS_META = {
  open: { label: 'Open', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
  fixed: { label: 'Fix applied', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  rejected: { label: 'Paragraph rejected', cls: 'bg-slate-500/20 text-slate-600 dark:text-slate-300' },
  escalated: { label: 'Awaiting SME review', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  verified: { label: 'Verified by SME', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
};

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${className}`}>
      {children}
    </div>
  );
}

export function ScoreBar({ value }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

export function Modal({ onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={`animate-pop max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl scroll-thin dark:border-slate-700 dark:bg-slate-900 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
