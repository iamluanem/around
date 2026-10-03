'use client';
import { useMemo, useState } from 'react';
import type { Accommodation, Experience } from '@/domain/types';
import { maps, TIBER } from '@/providers/maps';
import { cn } from '@/lib/format';

export type Layer = 'restaurant' | 'experience' | 'event' | 'attraction' | 'nightlife' | 'cafe' | 'hidden';

export const LAYER_META: Record<Layer, { label: string; color: string }> = {
  restaurant: { label: 'Restaurants', color: '#C2532B' },
  experience: { label: 'Experiences', color: '#5C6B3A' },
  event: { label: 'Events', color: '#7B5EA7' },
  attraction: { label: 'Attractions', color: '#B98A3A' },
  nightlife: { label: 'Nightlife', color: '#2F3E66' },
  cafe: { label: 'Cafés', color: '#8C5A3C' },
  hidden: { label: 'Hidden gems', color: '#2E8C83' },
};

export function layerOf(e: Experience): Layer {
  if (e.localness >= 0.85 && e.category !== 'restaurant' && e.category !== 'cafe') return 'hidden';
  if (e.category === 'tour' || e.category === 'walk') return 'experience';
  return e.category as Layer;
}

const W = 1000, H = 700;
const NEIGHBOURHOODS = [
  { n: 'Monti', lat: 41.8968, lng: 12.4955 }, { n: 'Trastevere', lat: 41.8865, lng: 12.4655 }, { n: 'Centro Storico', lat: 41.9012, lng: 12.4715 },
  { n: 'Testaccio', lat: 41.8752, lng: 12.4735 }, { n: 'Prati', lat: 41.9105, lng: 12.4615 }, { n: 'Tridente', lat: 41.9085, lng: 12.4815 },
  { n: 'San Lorenzo', lat: 41.9005, lng: 12.5135 }, { n: 'Aventine', lat: 41.8818, lng: 12.4825 }, { n: 'Celio', lat: 41.8868, lng: 12.4975 },
];

interface Props {
  stay: Accommodation;
  experiences: Experience[];
  scores: Map<string, number>;
  highlight?: string | null;
  onHover?: (id: string | null) => void;
  routes?: string[];
  layers: Set<Layer>;
}

export function RomeMap({ stay, experiences, scores, highlight, onHover, routes = [], layers }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const P = (p: { lat: number; lng: number }) => maps.project(p, W, H);
  const river = useMemo(() => TIBER.map((p, i) => `${i ? 'L' : 'M'}${P(p).x.toFixed(1)},${P(p).y.toFixed(1)}`).join(' '), []); // eslint-disable-line react-hooks/exhaustive-deps
  const s = P(stay);
  const visible = experiences.filter((e) => layers.has(layerOf(e)) && P(e).inside);
  const active = highlight ?? hover;
  const activeExp = experiences.find((e) => e.id === active);
  const set = (id: string | null) => { setHover(id); onHover?.(id); };

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#F3EDE2] ring-1 ring-ink/5">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#E6DCCB" strokeWidth="1" /></pattern>
          <radialGradient id="pulse"><stop offset="0" stopColor="#C2532B" stopOpacity=".35" /><stop offset="1" stopColor="#C2532B" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {/* parks */}
        <ellipse cx={P({ lat: 41.9135, lng: 12.488 }).x} cy={P({ lat: 41.9135, lng: 12.488 }).y} rx="120" ry="45" fill="#DCE3C8" />
        <ellipse cx={P({ lat: 41.8835, lng: 12.4915 }).x} cy={P({ lat: 41.8835, lng: 12.4915 }).y} rx="60" ry="28" fill="#DCE3C8" />
        <ellipse cx={P({ lat: 41.889, lng: 12.461 }).x} cy={P({ lat: 41.889, lng: 12.461 }).y} rx="40" ry="70" fill="#DCE3C8" />
        {/* river */}
        <path d={river} fill="none" stroke="#B9D0D7" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        <path d={river} fill="none" stroke="#CFE0E5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        {NEIGHBOURHOODS.map((n) => { const q = P(n); return q.inside && <text key={n.n} x={q.x} y={q.y} textAnchor="middle" className="fill-ink-400 font-serif" fontSize="17" fontStyle="italic" opacity=".7">{n.n}</text>; })}
        {/* walking routes */}
        {routes.map((id) => {
          const e = experiences.find((x) => x.id === id);
          if (!e) return null;
          const q = P(e);
          return <line key={id} x1={s.x} y1={s.y} x2={q.x} y2={q.y} stroke={active === id ? '#1E1A16' : '#C2532B'} strokeOpacity={active === id ? 0.8 : 0.35} strokeWidth={active === id ? 2.5 : 1.5} strokeDasharray="4 6" className="transition-all" />;
        })}
        {visible.map((e) => {
          const q = P(e);
          const on = active === e.id;
          const sc = scores.get(e.id) ?? 0;
          const r = 6 + Math.max(0, sc - 60) / 8;
          return (
            <g key={e.id} transform={`translate(${q.x},${q.y})`} onMouseEnter={() => set(e.id)} onMouseLeave={() => set(null)} className="cursor-pointer">
              <circle r={on ? r + 6 : r} fill={LAYER_META[layerOf(e)].color} stroke="#fff" strokeWidth="2.5" className="transition-all duration-200" opacity={on || !active ? 1 : 0.55} />
            </g>
          );
        })}
        <circle cx={s.x} cy={s.y} r="60" fill="url(#pulse)" className="animate-pulse-dot" />
        <g transform={`translate(${s.x},${s.y})`}>
          <circle r="20" fill="#1E1A16" stroke="#fff" strokeWidth="3" />
          <path d="M-7 3v-6l7-6 7 6v6z" fill="#FBF8F3" />
        </g>
      </svg>
      {activeExp && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-[260px] animate-scale-in rounded-2xl bg-white/95 p-3 text-[13px] shadow-lift backdrop-blur">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: LAYER_META[layerOf(activeExp)].color }}>{LAYER_META[layerOf(activeExp)].label}</div>
          <div className="font-medium leading-snug">{activeExp.name}</div>
          <div className="text-ink-500">{maps.walkingMinutes(stay, activeExp)} min walk · {scores.get(activeExp.id)}% match</div>
        </div>
      )}
      <div className="absolute bottom-3 right-4 rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] text-ink-500 backdrop-blur">Stylised map · walking times estimated</div>
    </div>
  );
}

export function LayerToggles({ layers, onToggle, counts }: { layers: Set<Layer>; onToggle: (l: Layer) => void; counts: Record<Layer, number> }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {(Object.keys(LAYER_META) as Layer[]).map((l) => (
        <button key={l} onClick={() => onToggle(l)} className={cn('flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition', layers.has(l) ? 'bg-white ring-ink/15' : 'opacity-50 ring-transparent')}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: LAYER_META[l].color }} />
          {LAYER_META[l].label} <span className="text-ink-400">{counts[l] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
