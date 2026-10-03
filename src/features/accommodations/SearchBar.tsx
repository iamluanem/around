'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { findCity } from '@/data/cities';
import { DestinationInput } from './DestinationInput';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { cn } from '@/lib/format';

export function SearchBar({ compact = false, initialDestination }: { compact?: boolean; initialDestination?: string }) {
  const ok = useHydrated();
  const { profile, setProfile, track } = useAround();
  const router = useRouter();
  const [start, setStart] = useState(profile.startDate);
  const [end, setEnd] = useState(profile.endDate);
  const [guests, setGuests] = useState(profile.travelers);
  const [dest, setDest] = useState(initialDestination ?? profile.destination);

  const go = (destination: string) => {
    const s = useAround.getState();
    const city = findCity(destination);
    if (!city?.available) {
      track('CLICK', 'accommodation', `search:${destination.trim() || 'empty'}`, [], true);
      router.push(`/stays?destination=${encodeURIComponent(destination.trim())}`);
      return;
    }
    const p = s.profile;
    const nextStart = ok ? start : p.startDate, nextEnd = ok ? end : p.endDate;
    // only reset the plan when the trip itself changed
    if (nextStart !== p.startDate || nextEnd !== p.endDate || guests !== p.travelers || p.destination !== city.name) {
      setProfile({ ...p, destination: city.name, startDate: nextStart, endDate: nextEnd, travelers: guests }, s.profileCompleted);
    }
    track('CLICK', 'accommodation', `search:${city.id}`, [], true);
    router.push(s.profileCompleted ? '/stays' : '/profile');
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); go(dest); };

  const field = 'flex flex-col px-5 py-2.5 text-left';
  return (
    <form onSubmit={submit} className={cn('flex w-full flex-col gap-1 rounded-[28px] bg-white p-2 shadow-lift ring-1 ring-ink/5 sm:flex-row sm:items-center sm:rounded-full', compact && 'shadow-soft')}>
      <div className={cn(field, 'sm:flex-1')}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Destination</span>
        <DestinationInput value={dest} onChange={setDest} onPick={() => {}} />
      </div>
      <span className="hidden h-8 w-px bg-ink/10 sm:block" />
      <label className={field}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Check in</span>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="bg-transparent text-[15px] font-medium outline-none" />
      </label>
      <label className={field}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Check out</span>
        <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="bg-transparent text-[15px] font-medium outline-none" />
      </label>
      <span className="hidden h-8 w-px bg-ink/10 sm:block" />
      <label className={field}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Guests</span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="bg-transparent text-[15px] font-medium outline-none">
          {[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g} guest{g > 1 ? 's' : ''}</option>)}
        </select>
      </label>
      <button type="submit" className="m-1 flex h-12 items-center justify-center gap-2 rounded-full bg-terra px-6 text-sm font-semibold text-white transition hover:bg-terra-600 active:scale-[.98]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        Search
      </button>
    </form>
  );
}
