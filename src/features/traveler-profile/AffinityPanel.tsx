'use client';
import { INTEREST_LABEL } from '@/domain/labels';
import { affinity } from '@/domain/recommendation/engine';
import { INTERESTS } from '@/domain/types';
import { useAround } from '@/lib/store';
import { cn } from '@/lib/format';

/** Visualises preference learning: affinities move as the traveler clicks, saves, likes and dismisses. */
export function AffinityPanel() {
  const { profile, learning } = useAround();
  const recent = new Map(learning.filter((l) => Date.now() - l.at < 60_000).map((l) => [l.tag, l]));
  const rows = INTERESTS.map((t) => ({ t, v: affinity(profile, t) }))
    .filter((r) => r.v !== 0 || recent.has(r.t))
    .sort((a, b) => b.v - a.v);
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">Your taste, learning</div>
        <span className="flex items-center gap-1.5 text-[11px] text-olive"><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-olive" />live</span>
      </div>
      <p className="mt-2 text-[12.5px] leading-snug text-ink-500">Open, save or like food spots — or dismiss nightlife — and watch the weights move. Rankings update instantly.</p>
      <ul className="mt-4 space-y-2.5">
        {rows.map(({ t, v }) => {
          const ch = recent.get(t);
          return (
            <li key={t}>
              <div className="flex justify-between text-[12.5px]">
                <span className={cn(ch && 'font-semibold')}>{INTEREST_LABEL[t]}</span>
                <span className={cn('tabular-nums', ch ? (ch.to > ch.from ? 'text-olive' : 'text-terra') : 'text-ink-400')}>
                  {ch && (ch.to > ch.from ? '▲ ' : '▼ ')}{v.toFixed(2)}
                </span>
              </div>
              <div className="relative mt-1 h-1.5 rounded-full bg-ink/5">
                <span className="absolute left-1/3 top-[-2px] h-2.5 w-px bg-ink/20" />
                <div className={cn('absolute top-0 h-full rounded-full transition-all duration-700', v >= 0 ? 'bg-olive' : 'bg-terra')}
                  style={v >= 0 ? { left: '33.33%', width: `${(v / 2) * 66.67}%` } : { right: '66.67%', width: `${-v * 33.33}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {learning.length > 0 && <div className="mt-4 border-t hairline pt-3 text-[11.5px] text-ink-400">{learning.length} learning signals this session</div>}
    </div>
  );
}
