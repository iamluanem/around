'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Accommodation, StayMatch } from '@/domain/types';
import { Photo } from '@/components/ui/Photo';
import { MatchPill, MatchRing } from '@/components/ui/MatchRing';
import { Stars } from '@/components/ui/misc';
import { useAround } from '@/lib/store';
import { cn, eur } from '@/lib/format';
import { nearestLandmarks } from './landmarks';

export function StayCard({ stay, match, rank, nights, best }: { stay: Accommodation; match: StayMatch | null; rank: number; nights: number; best?: boolean }) {
  const [img, setImg] = useState(0);
  const track = useAround((s) => s.track);
  const near = nearestLandmarks(stay);
  return (
    <Link href={`/stays/${stay.id}`} onClick={() => track('CLICK', 'accommodation', stay.id, [], true)}
      className="group block animate-fade-up" style={{ animationDelay: `${rank * 60}ms` }}>
      <div className="relative aspect-[4/3.4] overflow-hidden rounded-[28px]">
        <Photo src={stay.images[img]} alt={stay.title} label={stay.neighborhood} className="h-full w-full transition duration-700 group-hover:scale-[1.03]" />
        {match && <MatchPill score={match.score} className="absolute left-4 top-4" />}
        {best && match && <span className="absolute right-4 top-4 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-sand-50">Best for you</span>}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {stay.images.map((_, i) => (
            <button key={i} aria-label={`Photo ${i + 1}`} onClick={(e) => { e.preventDefault(); setImg(i); }}
              className={cn('h-1.5 rounded-full bg-white transition-all', i === img ? 'w-5' : 'w-1.5 opacity-60')} />
          ))}
        </div>
      </div>
      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] text-ink-500">{stay.type} · {stay.neighborhood}</div>
            <h3 className="mt-0.5 font-serif text-[21px] font-medium leading-snug">{stay.title}</h3>
          </div>
          <Stars rating={stay.rating} className="mt-1 shrink-0" />
        </div>
        <div className="mt-1.5 truncate text-[13px] text-ink-500">{stay.amenities.slice(0, 3).join(' · ')}</div>
        <div className="mt-1 text-[13px] text-ink-500">{near.map((l) => `${l.minutes} min to ${l.name}`).join(' · ')}</div>
        <div className="mt-2 text-[15px]"><b className="font-semibold">{eur(stay.nightlyPrice)}</b> <span className="text-ink-500">night · {eur(stay.nightlyPrice * nights)} total</span></div>
        {match && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 ring-1 ring-ink/5 transition group-hover:ring-ink/15">
            <MatchRing score={match.score} size={46} stroke={4} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Experience Match</div>
              <div className="text-[13.5px] leading-snug">{match.headline}</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
