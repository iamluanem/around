'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/format';

export const matchTone = (s: number) => (s >= 85 ? 'text-olive' : s >= 70 ? 'text-gold' : 'text-ink-400');

/** Animated circular Experience Match indicator. */
export function MatchRing({ score, size = 56, stroke = 5, className, label = true }: { score: number; size?: number; stroke?: number; className?: string; label?: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setV(score)); return () => cancelAnimationFrame(t); }, [score]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn('relative shrink-0', matchTone(score), className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      {label && (
        <span className="absolute inset-0 flex items-center justify-center font-serif font-semibold text-ink" style={{ fontSize: size * 0.3 }}>
          {score}<span style={{ fontSize: size * 0.16 }} className="ml-px text-ink-500">%</span>
        </span>
      )}
    </div>
  );
}

export function MatchPill({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-soft backdrop-blur', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', score >= 85 ? 'bg-olive' : score >= 70 ? 'bg-gold' : 'bg-ink-300')} />
      {score}% match
    </span>
  );
}
