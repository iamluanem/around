'use client';
import { useState } from 'react';
import { COMPONENT_LABEL, WEIGHTS } from '@/domain/recommendation/weights';
import type { MatchResult, ScoreBreakdown } from '@/domain/types';
import { cn } from '@/lib/format';

const NOTE: Record<keyof ScoreBreakdown, string> = {
  interest: 'How well nearby experiences cover what you love, weighted by learned affinities',
  budget: 'Share of your best picks that fit your daily experience budget',
  location: 'Walking time to your top picks, plus pedestrian friendliness',
  style: 'Fit with your travel style and highlights-vs-local preference',
  context: 'Suitability for your occasion and who you travel with',
  quality: 'Ratings and review volume',
};

/** Fully explainable score: every bar is a weighted component of the final number. */
export function MatchBreakdown({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[];
  return (
    <div>
      <div className="space-y-3">
        {keys.map((k, i) => {
          const v = match.breakdown[k];
          const pts = v * WEIGHTS[k] * 100;
          return (
            <div key={k}>
              <div className="mb-1 flex items-baseline justify-between text-[13px]">
                <span className="font-medium">{COMPONENT_LABEL[k]} <span className="font-normal text-ink-400">· {WEIGHTS[k] * 100}%</span></span>
                <span className="tabular-nums text-ink-500">{pts.toFixed(1)} / {WEIGHTS[k] * 100} pts</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                <div className={cn('h-full rounded-full', v >= 0.85 ? 'bg-olive' : v >= 0.6 ? 'bg-gold' : 'bg-terra')} style={{ width: `${v * 100}%`, transition: `width 1s cubic-bezier(.2,.7,.2,1) ${i * 80}ms` }} />
              </div>
              {!compact && <p className="mt-1 text-[12px] text-ink-400">{NOTE[k]}</p>}
            </div>
          );
        })}
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 text-[12.5px] text-ink-500 hover:text-ink">{open ? '▾' : '▸'} How is this calculated?</button>
      {open && (
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-ink p-4 text-[11.5px] leading-relaxed text-sand-100">{`score = ${keys.map((k) => `${k} × ${WEIGHTS[k]}`).join('\n      + ')}
      = ${keys.map((k) => (match.breakdown[k] * WEIGHTS[k]).toFixed(3)).join(' + ')}
      = ${match.score} / 100   (deterministic — no randomness)`}</pre>
      )}
    </div>
  );
}
