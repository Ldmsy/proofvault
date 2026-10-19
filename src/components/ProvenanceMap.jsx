import { useEffect, useMemo, useState } from 'react';
import { Network, User, Building2, Landmark, HeartPulse, Loader2, Sparkles, Cpu, ShieldAlert, ShieldCheck, RotateCcw, Maximize2, Minimize2, X } from 'lucide-react';
import { TAXONOMY, LAYER_NAMES, RISK_META, getNode, childrenOf, scoreCandidates, localMatch } from '../taxonomy.js';
import Vee from './Vee.jsx';

/* ───────────────────────── Lenses & preset claims ───────────────────────── */

export const LENSES = [
  {
    key: 'personal',
    label: 'Personal',
    icon: User,
    presets: [
      'Viral photo shows an empty bus stop at midday — proof the northern suburbs do not need the transport subsidy.',
      'AI-restored 1956 flood photo shows the relief centre sign read "Riverbend residents only".',
    ],
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    icon: Building2,
    presets: [
      'The Australian Cyber Security Centre has praised our swift response to the data breach as "industry-leading".',
      'We can confirm that absolutely no customer data was accessed or compromised in any way.',
    ],
  },
  {
    key: 'government',
    label: 'Government',
    icon: Landmark,
    presets: [
      'An estimated 87% of eligible low-income households already received relief under previous subsidy schemes.',
      'Suburbs with high proportions of renters and recent migrants have historically shown lower civic responsibility in program compliance.',
    ],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    icon: HeartPulse,
    presets: [
      'Patient states she is currently taking metoprolol 500 mg twice daily for hypertension.',
      'Given her anxious demeanour, symptoms are likely stress-related and may be exaggerated, as is common in women of her age.',
    ],
  },
];

const DOMAIN_COLOR = {
  health: '#3f9a82',
  gov: '#6c5fc7',
  corp: '#b0782a',
  edu: '#2f86a6',
  sci: '#4a7fbf',
  culture: '#c9a227',
  env: '#5a9a45',
};

/* ───────────────────────── Matching (Claude → local fallback) ───────────────────────── */

// Builds per-layer candidate scores; when Claude chose the node, its confidence leads and siblings share the rest.
function buildLevels(text, path) {
  let parent = null;
  return path.map((step) => {
    const local = scoreCandidates(text, childrenOf(parent));
    const others = local.filter((s) => s.id !== step.id);
    const rest = others.reduce((sum, s) => sum + s.raw + 0.4, 0) || 1;
    const scores = local.map((s) =>
      s.id === step.id ? { ...s, pct: step.confidence } : { ...s, pct: Math.round(((100 - step.confidence) * (s.raw + 0.4)) / rest) }
    );
    parent = step.id;
    return { chosenId: step.id, scores, reason: step.reason };
  });
}

const traceCache = new Map();

// Only new content a user submits goes to the model; preset claims and existing records use the
// built-in matcher, so browsing the app never spends API credit.
function traceClaimCached(text, live) {
  if (!live) return Promise.resolve({ levels: localMatch(text), source: 'local', summary: null });
  if (!traceCache.has(text)) {
    const p = traceClaim(text);
    traceCache.set(text, p);
    // Retry Claude next time if this attempt fell back to the local matcher.
    p.then((r) => r.source === 'local' && traceCache.delete(text));
  }
  return traceCache.get(text);
}

async function traceClaim(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch('/api/taxonomy-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim: text }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return { levels: buildLevels(text, json.path), source: 'claude', summary: json.summary };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timed out' : err.message;
    return { levels: localMatch(text), source: 'local', summary: null, fallbackReason: reason };
  } finally {
    clearTimeout(timer);
  }
}

/* ───────────────────────── Layout ───────────────────────── */

const W = 1100;
const PAD_L = 150;
const PAD_R = 30;
const PROBLEM_Y = 62;
const ROW_Y = [175, 295, 415, 535];
const SOCIETY_Y = 630;
const H = 690;

const leafCount = (n) => (n.children ? n.children.reduce((s, c) => s + leafCount(c), 0) : 1);

// Focus + context: nodes on the matched path expand so their children get room for labels;
// every other branch collapses into a faint "dust" column under its parent.
function computeLayout(pathIds) {
  const onPath = new Set(pathIds);
  // Known-pattern labels are the longest, so leaves get extra room.
  const units = (n) => (onPath.has(n.id) && n.children ? n.children.reduce((s, c) => s + units(c), 0) : n.children ? 1 : 1.6);
  const out = {};

  function dust(nodes, a, b, level) {
    const total = nodes.reduce((s, n) => s + leafCount(n), 0);
    let cur = a;
    for (const n of nodes) {
      const w = ((b - a) * leafCount(n)) / total;
      out[n.id] = { x: cur + w / 2, level, labeled: false };
      if (n.children) dust(n.children, cur, cur + w, level + 1);
      cur += w;
    }
  }
  function place(nodes, a, b, level) {
    const total = nodes.reduce((s, n) => s + units(n), 0);
    let cur = a;
    for (const n of nodes) {
      const w = ((b - a) * units(n)) / total;
      out[n.id] = { x: cur + w / 2, level, labeled: true };
      if (n.children) (onPath.has(n.id) ? place : dust)(n.children, cur, cur + w, level + 1);
      cur += w;
    }
  }
  place(TAXONOMY, PAD_L, W - PAD_R, 0);
  return out;
}

function wrap(label, max = 14) {
  const lines = [''];
  for (const word of label.split(' ')) {
    const last = lines[lines.length - 1];
    if ((last + ' ' + word).trim().length > max && last) lines.push(word);
    else lines[lines.length - 1] = (last + ' ' + word).trim();
  }
  return lines.slice(0, 4);
}

const curve = (x1, y1, x2, y2) => `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

/* ───────────────────────── Map canvas ───────────────────────── */

// compact: thumbnail for the side panel — shapes, path and glow only, no text.
// fill: stretch to the parent's full width and height (fullscreen), keeping the aspect ratio.
function MapCanvas({ claim, result, step, selectedId, onSelect, running, compact = false, fill = false }) {
  const pathIds = result ? result.levels.map((l) => l.chosenId) : [];
  const layout = useMemo(() => computeLayout(pathIds), [pathIds.join('>')]);
  const depth = pathIds.length;
  // Leaves take their risk colour; every other node takes its top-level domain's colour.
  const colorOf = (node, domain = pathIds[0]) => (node.risk ? RISK_META[node.risk].color : DOMAIN_COLOR[domain] || '#a3a197');

  // Reveal timeline: layer L (0-based) candidates appear at step 2L, its winner is chosen at step 2L+1.
  const candidatesVisible = (level) => level === 0 || (!!result && step >= 2 * level);
  const chosen = (level) => !!result && level < depth && step >= 2 * level + 1;
  const scoreOf = (id, level) => result?.levels[level]?.scores.find((s) => s.id === id)?.pct;
  const finished = result && step >= 2 * depth - 1 + (depth < LAYER_NAMES.length ? 1 : 0);
  const leaf = depth === LAYER_NAMES.length ? getNode(pathIds[depth - 1]) : null;

  const nodes = [];
  (function collect(list, level, domain) {
    for (const n of list) {
      nodes.push({ node: n, level, domain: domain || n.id });
      if (n.children) collect(n.children, level + 1, domain || n.id);
    }
  })(TAXONOMY, 0, null);

  const pos = (id) => ({ x: layout[id].x, y: ROW_Y[layout[id].level] });
  const segments = [];
  if (result && chosen(0)) segments.push({ key: 'p-0', d: curve(W / 2, PROBLEM_Y + 26, pos(pathIds[0]).x, ROW_Y[0] - 20), color: colorOf(getNode(pathIds[0])) });
  for (let l = 1; l < depth; l++) {
    if (!chosen(l)) break;
    const a = pos(pathIds[l - 1]);
    const b = pos(pathIds[l]);
    segments.push({ key: `p-${l}`, d: curve(a.x, a.y + 20, b.x, b.y - 20), color: colorOf(getNode(pathIds[l])) });
  }
  if (leaf && chosen(depth - 1)) {
    const a = pos(leaf.id);
    segments.push({ key: 'society', d: curve(a.x, a.y + 22, a.x, SOCIETY_Y - 14), color: RISK_META[leaf.risk].color });
  }

  return (
    // The compact thumbnail crops to the four layer bands only.
    <svg viewBox={compact ? `0 ${ROW_Y[0] - 56} ${W} ${ROW_Y[3] - ROW_Y[0] + 112}` : `0 0 ${W} ${H}`} className={`${fill ? 'h-full w-full' : 'w-full'} select-none`}>
      <defs>
        <filter id="pv-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="pv-bg" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#f5f4ef" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pv-bg)" />

      {/* Layer bands */}
      {ROW_Y.map((y, i) => (
        <g key={i}>
          <rect x="8" y={y - 52} width={W - 16} height="104" rx="14" fill={i % 2 ? '#faf9f6' : '#ffffff'} stroke="#e4e2d9" />
          {!compact && (
          <>
          <text x="22" y={y - 6} fill="#171717" fontSize="11" fontWeight="700" letterSpacing="1.5">
            LAYER {i + 1}
          </text>
          <text x="22" y={y + 10} fill="#77766e" fontSize="11">
            {LAYER_NAMES[i]}
          </text>
          {result && chosen(i) && (
            <text x="22" y={y + 26} fill={colorOf(getNode(pathIds[i]))} fontSize="10" fontFamily="monospace">
              ✓ {scoreOf(pathIds[i], i)}% match
            </text>
          )}
          {result && finished && i === depth && depth < LAYER_NAMES.length && (
            <text x="22" y={y + 26} fill="#bf625c" fontSize="10" fontFamily="monospace">
              ✕ no fit
            </text>
          )}
          </>
          )}
        </g>
      ))}

      {/* Society band */}
      <rect x="8" y={SOCIETY_Y - 14} width={W - 16} height="44" rx="12" fill="#171717" stroke="#171717" />
      {!compact && (
      <>
      <text x="22" y={SOCIETY_Y + 12} fill="#ffdc00" fontSize="11" fontWeight="700" letterSpacing="1.5">
        SOCIETY
      </text>
      <text x={PAD_L} y={SOCIETY_Y + 12} fill={leaf && finished ? '#ffffff' : '#a3a197'} fontSize="12">
        {leaf && finished
          ? `This pattern already surfaced ${leaf.cases.toLocaleString()} times in the database · ${RISK_META[leaf.risk].label}`
          : result && finished
          ? 'No known pattern reached — novel claim, route to a human verifier and add it to the database'
          : 'Where matched patterns meet the public'}
      </text>
      </>
      )}

      {/* Faint candidate fan-out from each chosen node */}
      {pathIds.map((id, l) =>
        l + 1 < LAYER_NAMES.length && chosen(l) && candidatesVisible(l + 1)
          ? (getNode(id).children || []).map((c) => (
              <path key={`fan-${c.id}`} d={curve(pos(id).x, pos(id).y + 20, pos(c.id).x, pos(c.id).y - 18)} stroke="#a3a197" strokeOpacity="0.6" strokeWidth="1" fill="none" />
            ))
          : null
      )}

      {/* Matched path */}
      {segments.map((s) => (
        <g key={s.key}>
          <path d={s.d} stroke={s.color} strokeWidth="10" strokeOpacity="0.18" fill="none" filter="url(#pv-glow)" />
          <path d={s.d} stroke={s.color} strokeWidth="3" fill="none" pathLength="1" className="pv-draw" />
          <circle r="4" fill="#171717">
            <animateMotion dur="1.6s" repeatCount="indefinite" path={s.d} />
          </circle>
        </g>
      ))}

      {/* Problem node */}
      <g>
        <rect x={W / 2 - 230} y={PROBLEM_Y - 30} width="460" height="56" rx="14" fill="#171717" stroke={running ? '#ffdc00' : '#171717'} strokeWidth={running ? 2.5 : 1.5} className={running ? 'animate-pulse' : ''} />
        {!compact && (
        <>
        <text x={W / 2} y={PROBLEM_Y - 10} textAnchor="middle" fill="#ffdc00" fontSize="10" fontWeight="700" letterSpacing="2">
          PROBLEM · CLAIM UNDER TRACE
        </text>
        <text x={W / 2} y={PROBLEM_Y + 10} textAnchor="middle" fill="#ffffff" fontSize="14">
          {claim ? (claim.length > 70 ? `${claim.slice(0, 68)}…` : claim) : 'Pick or type a claim to trace'}
        </text>
        </>
        )}
      </g>

      {/* Nodes */}
      {nodes.map(({ node, level, domain }) => {
        const p = layout[node.id];
        const labeled = p.labeled && candidatesVisible(level);
        const isWinner = pathIds[level] === node.id && chosen(level);
        const decided = chosen(level) || (finished && level === depth);
        const faded = labeled && decided && !isWinner;
        const color = colorOf(node, domain);
        const pct = scoreOf(node.id, level);
        const scanning = labeled && !decided && !!result;
        return (
          <g
            key={node.id}
            style={{ transform: `translate(${p.x}px, ${ROW_Y[level]}px)`, transition: 'transform 0.9s cubic-bezier(.2,.8,.2,1)' }}
            onClick={() => labeled && onSelect(node.id)}
            className={labeled ? 'cursor-pointer' : ''}
          >
            <g style={{ transform: `scale(${labeled ? 1 : 0.14})`, opacity: faded ? 0.16 : labeled ? 1 : 0.55, transition: 'transform .6s, opacity .6s' }}>
              {isWinner && <circle r="34" fill={color} fillOpacity="0.25" filter="url(#pv-glow)" className="animate-pool-glow" />}
              <circle
                r={isWinner ? 23 : 17}
                fill={labeled ? color : '#b8b6ab'}
                fillOpacity={isWinner ? 0.95 : labeled ? 0.22 : 0.9}
                stroke={selectedId === node.id ? '#171717' : color}
                strokeWidth={selectedId === node.id ? 3 : 1.5}
              />
              {scanning && pct != null && (
                <circle r="21" fill="none" stroke={color} strokeWidth="3" pathLength="100" strokeDasharray={`${pct} 100`} transform="rotate(-90)" style={{ transition: 'stroke-dasharray .6s' }} />
              )}
              {node.risk && labeled && (
                <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill={isWinner ? '#fff' : color}>
                  !
                </text>
              )}
            </g>
            {labeled && !compact && (
              <g style={{ opacity: faded ? 0.25 : 1, transition: 'opacity .6s' }}>
                {wrap(node.label, faded ? 10 : 14).map((line, i) => (
                  <text key={i} y={38 + i * 13.5} textAnchor="middle" fontSize={faded ? 10 : 12} fontWeight={isWinner ? 700 : 500} fill={isWinner ? '#171717' : '#5c5b55'}>
                    {line}
                  </text>
                ))}
                {pct != null && (scanning || isWinner) && (
                  <text y="-28" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill={isWinner ? color : '#77766e'}>
                    {pct}%
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────────────────── Trace state ───────────────────────── */

// Runs the trace for a claim and steps the layer-by-layer reveal forward.
function useTrace(claim, live = false) {
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!claim) return undefined;
    let cancelled = false;
    setResult(null);
    setStep(0);
    setRunning(true);
    traceClaimCached(claim, live).then((r) => {
      if (cancelled) return;
      setRunning(false);
      setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [claim, live, nonce]);

  const depth = result?.levels.length ?? 0;
  const maxStep = result ? 2 * depth - 1 + (depth < LAYER_NAMES.length ? 1 : 0) : 0;

  // The first step waits for the layout transition, then one step per 0.9s.
  useEffect(() => {
    if (!result) return undefined;
    let s = 0;
    const t = setInterval(() => {
      s += 1;
      setStep(s);
      if (s >= maxStep) clearInterval(t);
    }, 900);
    return () => clearInterval(t);
  }, [result, maxStep]);

  return { result, step, maxStep, running, finished: !!result && step >= maxStep, replay: () => setNonce((n) => n + 1) };
}

// Shown only when Claude produced the match; the built-in matcher carries no label.
function SourceBadge({ result }) {
  if (result?.source !== 'claude') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-cyan-100 px-1.5 py-0.5 font-mono text-cyan-800">
      <Cpu className="h-3 w-3" /> Matched by Claude Opus 5.5
    </span>
  );
}

/* ───────────────────────── Side-panel mini map ───────────────────────── */

export function MiniProvenanceMap({ claim, onExpand }) {
  const { result, step, running, finished } = useTrace(claim);
  const depth = result?.levels.length ?? 0;
  const leaf = finished && depth === LAYER_NAMES.length ? getNode(result.levels[depth - 1].chosenId) : null;

  return (
    <div className="border-r border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <Network className="h-4 w-4 text-indigo-500" /> Provenance Map
        </span>
        <button
          onClick={onExpand}
          title="Open fullscreen"
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
        </button>
      </div>
      <button onClick={onExpand} className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left">
        <MapCanvas claim={claim} result={result} step={step} running={running} compact selectedId={null} onSelect={() => {}} />
      </button>
      <div className="mt-1.5 space-y-1">
        {!claim && <p className="text-[11px] text-slate-500">Select a finding to trace it through the pattern database.</p>}
        {running && (
          <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Tracing the selected finding…
          </p>
        )}
        {result && (
          <div className="truncate text-[11px] text-slate-500" title={result.levels.map((l) => getNode(l.chosenId).label).join(' › ')}>
            {result.levels
              .filter((_, i) => step >= 2 * i + 1)
              .map((l) => getNode(l.chosenId).label)
              .join(' › ') || 'Tracing…'}
          </div>
        )}
        {leaf && (
          <div className="flex items-center justify-between rounded-md px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: RISK_META[leaf.risk].color }}>
            <span className="truncate">{RISK_META[leaf.risk].label} pattern</span>
            <span className="font-mono">{leaf.cases} cases</span>
          </div>
        )}
        {finished && !leaf && <p className="text-[11px] text-amber-600 dark:text-amber-400">No known pattern — novel claim, verify manually.</p>}
      </div>
    </div>
  );
}

/* ───────────────────────── Fullscreen map ───────────────────────── */

// lenses: restrict which lenses can be picked (e.g. ['healthcare'] in the hospital product).
export default function ProvenanceMapOverlay({ incoming, onClose, lenses }) {
  const available = lenses ? LENSES.filter((l) => lenses.includes(l.key)) : LENSES;
  const [lens, setLens] = useState(incoming?.lens || 'personal');
  const [claim, setClaim] = useState(incoming?.claim || LENSES[0].presets[0]);
  const [draft, setDraft] = useState('');
  const [claimsOpen, setClaimsOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(true);
  const [live, setLive] = useState(false); // true only for a claim the user typed in
  const { result, step, running, finished, replay } = useTrace(claim, live);

  useEffect(() => {
    if (!incoming) return;
    if (incoming.lens) setLens(incoming.lens);
    if (incoming.claim) {
      setLive(false);
      setClaim(incoming.claim);
    }
  }, [incoming?.nonce]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trace = (text, isNew = false) => {
    setClaimsOpen(false);
    setCardOpen(true);
    setLive(isNew);
    if (text === claim) replay();
    else setClaim(text);
  };

  const depth = result?.levels.length ?? 0;
  const leaf = finished && depth === LAYER_NAMES.length ? getNode(result.levels[depth - 1].chosenId) : null;
  const lensDef = LENSES.find((l) => l.key === lens);
  const floating = 'rounded-xl border border-slate-200 bg-white/95 text-slate-900 shadow-[0_10px_25px_rgba(0,0,0,0.06)] backdrop-blur';

  // The map fills the whole screen; controls float on top of it.
  return (
    <div className="animate-pop fixed inset-0 z-50 bg-slate-100">
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <MapCanvas claim={claim} result={result} step={step} selectedId={null} onSelect={() => {}} running={running} fill />
      </div>

      {/* Top-right controls */}
      <div className={`absolute right-4 top-4 flex items-center gap-2 px-2 py-1.5 text-[11px] ${floating}`}>
        <Vee mood={running ? 'think' : leaf ? 'alert' : finished ? 'happy' : 'idle'} size={30} />
        {running && (
          <span className="inline-flex items-center gap-1 px-1 text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tracing…
          </span>
        )}
        <SourceBadge result={result} />
        {result && (
          <button onClick={replay} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100">
            <RotateCcw className="h-3 w-3" /> Replay
          </button>
        )}
        <button onClick={onClose} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-slate-100">
          <Minimize2 className="h-3.5 w-3.5" /> Exit <span className="font-mono text-[10px] text-slate-400">Esc</span>
        </button>
      </div>

      {/* Bottom-left: change the claim (collapsed by default) */}
      <div className="absolute bottom-4 left-4 w-[320px] max-w-[calc(100vw-2rem)]">
        {claimsOpen && (
          <div className={`animate-pop mb-2 space-y-2.5 p-3 ${floating}`}>
            <div className="grid grid-cols-4 gap-1">
              {available.length > 1 && available.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setLens(key)}
                  title={label}
                  className={`inline-flex items-center justify-center gap-1 rounded-md px-1 py-1 text-[10.5px] font-semibold ${
                    lens === key ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                </button>
              ))}
            </div>
            {lensDef.presets.map((p) => (
              <button
                key={p}
                onClick={() => trace(p)}
                className={`block w-full rounded-lg border p-2 text-left text-[11.5px] leading-snug ${
                  claim === p ? 'border-slate-950 bg-brand-yellow/30' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                {p}
              </button>
            ))}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Or paste your own claim…"
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-[11.5px] outline-none focus:border-slate-950"
            />
            <button
              disabled={!draft.trim() || running}
              onClick={() => trace(draft.trim(), true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-950 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" /> Trace with Claude Opus 5.5
            </button>
          </div>
        )}
        <button onClick={() => setClaimsOpen(!claimsOpen)} className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-semibold ${floating}`}>
          <lensDef.icon className="h-3.5 w-3.5 text-slate-950" /> {claimsOpen ? 'Hide claims' : 'Change claim'}
        </button>
      </div>

      {/* Top-right, under the controls: matched pattern, once the trace reaches it */}
      {leaf && cardOpen && (
        <div className={`animate-pop absolute right-4 top-16 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden ${floating}`} style={{ borderTop: `3px solid ${RISK_META[leaf.risk].color}` }}>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: RISK_META[leaf.risk].color }}>
                <ShieldAlert className="h-3 w-3" /> {RISK_META[leaf.risk].label}
              </span>
              <button onClick={() => setCardOpen(false)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100" title="Hide">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1.5 text-[13px] font-semibold text-slate-950">{leaf.label}</div>
            <div className="mt-1.5 text-[11.5px] leading-snug text-cyan-800">
              <span className="inline-flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3" /> IM control
              </span>{' '}
              {leaf.control}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
