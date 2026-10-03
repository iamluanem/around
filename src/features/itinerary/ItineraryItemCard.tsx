'use client';
import { useState } from 'react';
import type { Experience, ItineraryItem } from '@/domain/types';
import { Photo } from '@/components/ui/Photo';
import { MatchPill } from '@/components/ui/MatchRing';
import { Stars } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { useAround } from '@/lib/store';
import { toast } from '@/lib/toast';
import { cn, dur, eur } from '@/lib/format';
import { askAgent, usePlannerUI } from './usePlanner';

export function ItineraryItemCard({ item, e, onOpen, occasion }: { item: ItineraryItem; e: Experience; onOpen: () => void; occasion?: boolean }) {
  const addBooking = useAround((s) => s.addBooking);
  const track = useAround((s) => s.track);
  const highlight = usePlannerUI((s) => s.highlight.includes(`${item.date}|${item.time}`));
  const busyAgent = usePlannerUI((s) => s.busy);
  const [busy, setBusy] = useState(false);

  const book = async () => {
    setBusy(true);
    try { const b = await api.bookExperience(e.id); addBooking(b); toast(`Booked ${e.name} · ${b.confirmation}`, 'success'); }
    catch (err) { toast((err as Error).message); } finally { setBusy(false); }
  };
  const replace = () => {
    track('REPLACE', 'experience', e.id, e.tags, true);
    askAgent({ action: { type: 'alternatives', key: item.key } }, `Replace ${e.name}`);
  };

  return (
    <div className={cn('group relative flex gap-4 rounded-3xl bg-white p-3 pr-4 ring-1 ring-ink/5 transition sm:gap-5', highlight && 'animate-scale-in ring-2 ring-terra shadow-lift', occasion && 'ring-terra/20')}>
      <button onClick={onOpen} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-40" aria-label={`Details for ${e.name}`}>
        <Photo src={e.image} alt={e.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        {highlight && <span className="absolute left-2 top-2 rounded-full bg-terra px-2 py-0.5 text-[10px] font-semibold text-white">Updated</span>}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-500">
          <b className="font-semibold tabular-nums text-ink">{item.time}</b><span>·</span><span>{item.slotLabel}</span>
          <MatchPill score={item.match.score} className="ml-auto bg-sand-50 shadow-none ring-1 ring-ink/5" />
        </div>
        <button onClick={onOpen} className="mt-1 text-left font-serif text-[18px] font-medium leading-snug hover:text-terra sm:text-[19px]">{e.name}</button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
          <Stars rating={e.rating} /> <span>{dur(e.durationMin)}</span> <span>{item.walkMinutes} min walk</span>
          <span className="font-medium text-ink">{e.price === 0 ? 'Free' : `${eur(e.price)}${e.bookable ? '' : ' · pay at venue'}`}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-olive">✓ {item.match.reasons.slice(0, 2).join(' · ')}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {e.bookable && (item.booked
            ? <span className="inline-flex h-8 items-center rounded-full bg-olive-100 px-3 text-[12.5px] font-medium text-olive">✓ Booked</span>
            : <button onClick={book} disabled={busy} className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[12.5px] font-medium text-sand-50 transition hover:bg-ink-700 disabled:opacity-50">{busy ? 'Booking…' : `Book · ${eur(e.price)}`}</button>)}
          {!item.booked && <button onClick={replace} disabled={!!busyAgent} className="inline-flex h-8 items-center rounded-full px-3.5 text-[12.5px] font-medium ring-1 ring-ink/15 transition hover:ring-ink/40 disabled:opacity-50">↻ Replace</button>}
        </div>
      </div>
    </div>
  );
}
