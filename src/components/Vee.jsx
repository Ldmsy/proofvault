// Vee — ProofVault's owl archivist mascot. Pure SVG so it scales from a 28px logo to a 120px guide.
// Moods: idle (blinks), think (looks up, holds a magnifier), alert (wide eyes, "!"), happy (smiling eyes, holds a seal).

const INK = '#171717';
const YELLOW = '#ffdc00';
const BELLY = '#fff3a8';
const WING = '#e6c400';
const BEAK = '#f29a2e';

const PUPIL_OFFSET = { idle: [0, 1], think: [-3, -4], alert: [0, 0] };

export default function Vee({ mood = 'idle', size = 64, bob = false, className = '', title = 'Vee' }) {
  const [dx, dy] = PUPIL_OFFSET[mood] || [0, 0];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`${bob ? 'vee-bob' : ''} ${className}`} role="img" aria-label={title}>
      {/* ear tufts */}
      <path d="M30 34 L24 10 L46 26 Z" fill={INK} />
      <path d="M90 34 L96 10 L74 26 Z" fill={INK} />
      {/* wings */}
      <path d="M24 66 C10 78 14 98 30 104 C28 90 30 78 34 70 Z" fill={WING} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M96 66 C110 78 106 98 90 104 C92 90 90 78 86 70 Z" fill={WING} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      {/* body */}
      <ellipse cx="60" cy="68" rx="37" ry="42" fill={YELLOW} stroke={INK} strokeWidth="4" />
      <ellipse cx="60" cy="84" rx="21" ry="20" fill={BELLY} />
      <path d="M52 80 l4 4 l4 -4 M60 88 l4 4 l4 -4 M48 90 l4 4 l4 -4" fill="none" stroke={WING} strokeWidth="2.5" strokeLinecap="round" />
      {/* feet */}
      <ellipse cx="48" cy="110" rx="7" ry="3.5" fill={BEAK} stroke={INK} strokeWidth="2.5" />
      <ellipse cx="72" cy="110" rx="7" ry="3.5" fill={BEAK} stroke={INK} strokeWidth="2.5" />

      {/* glasses + eyes */}
      <line x1="58" y1="54" x2="62" y2="54" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="43" cy="54" r="15" fill="#fff" stroke={INK} strokeWidth="4" />
      <circle cx="77" cy="54" r="15" fill="#fff" stroke={INK} strokeWidth="4" />
      {mood === 'happy' ? (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d="M35 57 Q43 47 51 57" />
          <path d="M69 57 Q77 47 85 57" />
        </g>
      ) : (
        <g className={mood === 'idle' ? 'vee-blink' : ''} style={{ transformOrigin: '60px 54px' }}>
          <circle cx={43 + dx} cy={54 + dy} r={mood === 'alert' ? 4.5 : 6.5} fill={INK} />
          <circle cx={77 + dx} cy={54 + dy} r={mood === 'alert' ? 4.5 : 6.5} fill={INK} />
          <circle cx={45 + dx} cy={51 + dy} r="2" fill="#fff" />
          <circle cx={79 + dx} cy={51 + dy} r="2" fill="#fff" />
        </g>
      )}
      {/* beak */}
      <path d="M55 66 L65 66 L60 75 Z" fill={BEAK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {mood === 'happy' && (
        <>
          <circle cx="32" cy="68" r="4.5" fill="#f7a1a1" opacity="0.8" />
          <circle cx="88" cy="68" r="4.5" fill="#f7a1a1" opacity="0.8" />
        </>
      )}

      {/* props */}
      {mood === 'think' && (
        <g className="vee-wiggle" style={{ transformOrigin: '98px 86px' }}>
          <line x1="99" y1="96" x2="110" y2="110" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="94" cy="88" r="11" fill="#e8f6ff" stroke={INK} strokeWidth="4" />
        </g>
      )}
      {mood === 'happy' && (
        <g className="vee-wiggle" style={{ transformOrigin: '98px 92px' }}>
          <rect x="93" y="74" width="10" height="14" rx="2" fill={INK} />
          <rect x="86" y="88" width="24" height="9" rx="2.5" fill="#bf625c" stroke={INK} strokeWidth="3" />
          <path d="M92 108 l5 5 l10 -10" fill="none" stroke="#3c7362" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {mood === 'alert' && (
        <g>
          <circle cx="102" cy="22" r="13" fill="#bf625c" stroke={INK} strokeWidth="3" />
          <rect x="100" y="13" width="4" height="11" rx="2" fill="#fff" />
          <circle cx="102" cy="29" r="2.4" fill="#fff" />
        </g>
      )}
    </svg>
  );
}

// Vee with a speech bubble — used for tips, onboarding and empty states.
export function VeeSays({ mood = 'idle', size = 56, children, className = '', action }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Vee mood={mood} size={size} bob className="shrink-0" />
      <div className="relative min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-800 shadow-[0_6px_18px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <span className="absolute -left-[7px] top-4 h-3 w-3 rotate-45 border-b border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
        {children}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
