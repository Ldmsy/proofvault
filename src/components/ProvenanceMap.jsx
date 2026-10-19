import { useEffect, useMemo, useRef, useState } from 'react';
import { Network, User, Building2, Landmark, HeartPulse, Play, Loader2, Sparkles, Cpu, Database, ShieldAlert, ShieldCheck, ChevronRight, RotateCcw } from 'lucide-react';
import { Card } from './ui.jsx';
import { TAXONOMY, LAYER_NAMES, RISK_META, getNode, childrenOf, scoreCandidates, localMatch } from '../taxonomy.js';

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
  health: '#22d3ee',
  gov: '#818cf8',
  corp: '#c084fc',
  edu: '#34d399',
  sci: '#38bdf8',
  culture: '#fbbf24',
  env: '#4ade80',
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
  return lines.slice(0, 3);
}

const curve = (x1, y1, x2, y2) => `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

/* ───────────────────────── Map canvas ───────────────────────── */

function MapCanvas({ claim, result, step, selectedId, onSelect, running }) {
  const pathIds = result ? result.levels.map((l) => l.chosenId) : [];
  const layout = useMemo(() => computeLayout(pathIds), [pathIds.join('>')]);
  const depth = pathIds.length;
  // Leaves take their risk colour; every other node takes its top-level domain's colour.
  const colorOf = (node, domain = pathIds[0]) => (node.risk ? RISK_META[node.risk].color : DOMAIN_COLOR[domain] || '#94a3b8');

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
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      <defs>
        <filter id="pv-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="pv-bg" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pv-bg)" />

      {/* Layer bands */}
      {ROW_Y.map((y, i) => (
        <g key={i}>
          <rect x="8" y={y - 52} width={W - 16} height="104" rx="14" fill={i % 2 ? '#0f172a' : '#111827'} fillOpacity="0.55" />
          <text x="22" y={y - 6} fill="#64748b" fontSize="11" fontWeight="700" letterSpacing="1.5">
            LAYER {i + 1}
          </text>
          <text x="22" y={y + 10} fill="#94a3b8" fontSize="11">
            {LAYER_NAMES[i]}
          </text>
          {result && chosen(i) && (
            <text x="22" y={y + 26} fill={colorOf(getNode(pathIds[i]))} fontSize="10" fontFamily="monospace">
              ✓ {scoreOf(pathIds[i], i)}% match
            </text>
          )}
          {result && finished && i === depth && depth < LAYER_NAMES.length && (
            <text x="22" y={y + 26} fill="#f87171" fontSize="10" fontFamily="monospace">
              ✕ no fit
            </text>
          )}
        </g>
      ))}

      {/* Society band */}
      <rect x="8" y={SOCIETY_Y - 14} width={W - 16} height="44" rx="12" fill="#0b1220" stroke="#1e293b" />
      <text x="22" y={SOCIETY_Y + 12} fill="#94a3b8" fontSize="11" fontWeight="700" letterSpacing="1.5">
        SOCIETY
      </text>
      <text x={PAD_L} y={SOCIETY_Y + 12} fill={leaf && finished ? '#e2e8f0' : '#475569'} fontSize="12">
        {leaf && finished
          ? `This pattern already surfaced ${leaf.cases.toLocaleString()} times in the database · ${RISK_META[leaf.risk].label}`
          : result && finished
          ? 'No known pattern reached — novel claim, route to a human verifier and add it to the database'
          : 'Where matched patterns meet the public'}
      </text>

      {/* Faint candidate fan-out from each chosen node */}
      {pathIds.map((id, l) =>
        l + 1 < LAYER_NAMES.length && chosen(l) && candidatesVisible(l + 1)
          ? (getNode(id).children || []).map((c) => (
              <path key={`fan-${c.id}`} d={curve(pos(id).x, pos(id).y + 20, pos(c.id).x, pos(c.id).y - 18)} stroke="#475569" strokeOpacity="0.35" strokeWidth="1" fill="none" />
            ))
          : null
      )}

      {/* Matched path */}
      {segments.map((s) => (
        <g key={s.key}>
          <path d={s.d} stroke={s.color} strokeWidth="10" strokeOpacity="0.18" fill="none" filter="url(#pv-glow)" />
          <path d={s.d} stroke={s.color} strokeWidth="3" fill="none" pathLength="1" className="pv-draw" />
          <circle r="4" fill="#fff">
            <animateMotion dur="1.6s" repeatCount="indefinite" path={s.d} />
          </circle>
        </g>
      ))}

      {/* Problem node */}
      <g>
        <rect x={W / 2 - 230} y={PROBLEM_Y - 30} width="460" height="56" rx="14" fill="#1e1b4b" stroke={running ? '#a5b4fc' : '#6366f1'} strokeWidth={running ? 2.5 : 1.5} className={running ? 'animate-pulse' : ''} />
        <text x={W / 2} y={PROBLEM_Y - 10} textAnchor="middle" fill="#a5b4fc" fontSize="10" fontWeight="700" letterSpacing="2">
          PROBLEM · CLAIM UNDER TRACE
        </text>
        <text x={W / 2} y={PROBLEM_Y + 10} textAnchor="middle" fill="#e2e8f0" fontSize="14">
          {claim ? (claim.length > 70 ? `${claim.slice(0, 68)}…` : claim) : 'Pick or type a claim to trace'}
        </text>
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
                fill={labeled ? color : '#64748b'}
                fillOpacity={isWinner ? 0.95 : labeled ? 0.22 : 0.9}
                stroke={selectedId === node.id ? '#fff' : color}
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
            {labeled && (
              <g style={{ opacity: faded ? 0.25 : 1, transition: 'opacity .6s' }}>
                {wrap(node.label).map((line, i) => (
                  <text key={i} y={38 + i * 13.5} textAnchor="middle" fontSize="12" fontWeight={isWinner ? 700 : 500} fill={isWinner ? '#fff' : '#cbd5e1'}>
                    {line}
                  </text>
                ))}
                {pct != null && (scanning || isWinner) && (
                  <text y="-28" textAnchor="middle" fontSize="11.5" fontFamily="monospace" fill={isWinner ? color : '#94a3b8'}>
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

/* ───────────────────────── Main view ───────────────────────── */

export default function ProvenanceMap({ incoming }) {
  const [lens, setLens] = useState('personal');
  const [claim, setClaim] = useState(LENSES[0].presets[0]);
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const timer = useRef(null);
  const runId = useRef(0);

  const depth = result?.levels.length ?? 0;
  const maxStep = result ? 2 * depth - 1 + (depth < LAYER_NAMES.length ? 1 : 0) : 0;

  const run = async (text) => {
    const id = ++runId.current;
    clearInterval(timer.current);
    setClaim(text);
    setResult(null);
    setSelectedId(null);
    setStep(0);
    setRunning(true);
    const r = await traceClaim(text);
    if (id !== runId.current) return;
    setRunning(false);
    setResult(r);
  };

  // Step the reveal forward once a result arrives (first step waits for the layout transition).
  useEffect(() => {
    if (!result) return undefined;
    let s = 0;
    const tick = () => {
      s += 1;
      setStep(s);
      if (s >= maxStep) clearInterval(timer.current);
    };
    timer.current = setInterval(tick, 900);
    return () => clearInterval(timer.current);
  }, [result, maxStep]);

  // Trace a claim handed over from another view, or the first example on first open.
  useEffect(() => {
    if (incoming?.lens) setLens(incoming.lens);
    run(incoming?.claim || LENSES[0].presets[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.nonce]);

  const finished = result && step >= maxStep;
  const leaf = finished && depth === LAYER_NAMES.length ? getNode(result.levels[depth - 1].chosenId) : null;
  const lensDef = LENSES.find((l) => l.key === lens);
  const selected = selectedId ? getNode(selectedId) : null;
  const selectedLevel = result?.levels.findIndex((l) => l.scores.some((s) => s.id === selectedId));

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-[290px_minmax(0,1fr)_330px] lg:overflow-hidden">
      {/* Left: lens + claims */}
      <aside className="space-y-3 lg:overflow-y-auto scroll-thin">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Network className="h-4 w-4 text-indigo-500" /> Provenance Map
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
            A claim sinks through the pattern database layer by layer. The best-fitting branch lights up; everything unrelated fades.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {LENSES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setLens(key)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                  lens === key ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">{lensDef.label} lens · example claims</div>
          <div className="space-y-2">
            {lensDef.presets.map((p) => (
              <button
                key={p}
                onClick={() => run(p)}
                className={`w-full rounded-lg border p-2.5 text-left text-[12px] leading-snug transition ${
                  claim === p ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Play className="h-3 w-3" /> Trace
                </span>
                <div className="text-slate-700 dark:text-slate-300">{p}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Trace your own claim</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Paste a sentence from a post, record or AI draft…"
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            disabled={!draft.trim() || running}
            onClick={() => run(draft.trim())}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" /> Trace with Claude Opus 5.5
          </button>
        </Card>
      </aside>

      {/* Center: the map */}
      <section className="min-w-0 lg:overflow-y-auto scroll-thin">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-mono text-cyan-300">
              <Database className="h-3.5 w-3.5" /> Pattern database · {LAYER_NAMES.length} layers
            </span>
            <span className="inline-flex items-center gap-2">
              {running && (
                <span className="inline-flex items-center gap-1 text-indigo-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Claude is reading the claim…
                </span>
              )}
              {result && (
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono ${
                    result.source === 'claude' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-amber-500/20 text-amber-200'
                  }`}
                  title={result.fallbackReason || ''}
                >
                  <Cpu className="h-3 w-3" /> {result.source === 'claude' ? 'Matched by Claude Opus 5.5' : 'Local keyword matcher (Claude unavailable)'}
                </span>
              )}
              {result && (
                <button onClick={() => run(claim)} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-300 hover:bg-white/10">
                  <RotateCcw className="h-3 w-3" /> Replay
                </button>
              )}
            </span>
          </div>
          <MapCanvas claim={claim} result={result} step={step} selectedId={selectedId} onSelect={setSelectedId} running={running} />
        </div>
      </section>

      {/* Right: result */}
      <aside className="space-y-3 lg:overflow-y-auto scroll-thin">
        <Card className="p-3">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Matched path</div>
          {!result ? (
            <p className="text-xs text-slate-500">{running ? 'Tracing…' : 'Choose a claim to start.'}</p>
          ) : (
            <ol className="space-y-2">
              {result.levels.map((l, i) => {
                const n = getNode(l.chosenId);
                const shown = step >= 2 * i + 1;
                const pct = l.scores.find((s) => s.id === l.chosenId).pct;
                return (
                  <li key={l.chosenId} className={`transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-20'}`}>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-normal text-slate-400">L{i + 1}</span> {n.label}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{pct}%</span>
                    </div>
                    {l.reason && shown && <p className="ml-4 mt-0.5 text-[11px] leading-snug text-slate-500">{l.reason}</p>}
                  </li>
                );
              })}
              {finished && depth < LAYER_NAMES.length && (
                <li className="text-[12px] text-amber-600 dark:text-amber-400">
                  Stopped at layer {depth + 1}: nothing in the database fits closely enough.
                </li>
              )}
            </ol>
          )}
        </Card>

        {leaf && (
          <Card className="animate-pop overflow-hidden">
            <div className="p-3" style={{ borderTop: `4px solid ${RISK_META[leaf.risk].color}` }}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: RISK_META[leaf.risk].color }}>
                  <ShieldAlert className="h-3 w-3" /> {RISK_META[leaf.risk].label}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{leaf.cases.toLocaleString()} cases in DB</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold">{leaf.label}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">{leaf.pattern}</p>
              <div className="mt-2 rounded-md bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                DB example: {leaf.example}
              </div>
              <div className="mt-2 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-[12px] text-emerald-800 dark:text-emerald-200">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> IM control
                </span>
                <div className="mt-0.5">{leaf.control}</div>
              </div>
            </div>
          </Card>
        )}

        {finished && result.summary && (
          <Card className="p-3 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Claude's summary</div>
            {result.summary}
          </Card>
        )}

        {selected && selectedLevel >= 0 && (
          <Card className="p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
              Node · Layer {selectedLevel + 1} {LAYER_NAMES[selectedLevel]}
            </div>
            <div className="mt-1 text-sm font-semibold">{selected.label}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              Fit score {result.levels[selectedLevel].scores.find((s) => s.id === selectedId)?.pct}% among {result.levels[selectedLevel].scores.length} candidates
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {selected.kw.slice(0, 8).map((k) => (
                <span key={k} className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700">
                  {k}
                </span>
              ))}
            </div>
          </Card>
        )}
      </aside>
    </div>
  );
}
