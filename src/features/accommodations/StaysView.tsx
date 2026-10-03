'use client';
import { useMemo, useState } from 'react';
import { matchStay } from '@/domain/recommendation/engine';
import type { Accommodation, Experience } from '@/domain/types';
import { Chip, Skeleton } from '@/components/ui/misc';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { dayLabel, nightsBetween } from '@/lib/format';
import { ProfileBar } from '@/features/traveler-profile/ProfileBar';
import { StayCard } from './StayCard';
import { SearchBar } from './SearchBar';
import { ComingSoon } from './ComingSoon';
import { findCity } from '@/data/cities';

type Sort = 'match' | 'price' | 'rating';

export function StaysView({ stays, experiences, destination }: { stays: Accommodation[]; experiences: Experience[]; destination?: string }) {
  const ok = useHydrated();
  const profile = useAround((s) => s.profile);
  const [sort, setSort] = useState<Sort>('match');
  const matches = useMemo(() => new Map(stays.map((s) => [s.id, matchStay(s, experiences, profile)])), [stays, experiences, profile]);
  const nights = nightsBetween(profile.startDate, profile.endDate);
  const sorted = [...stays].filter((s) => s.maxGuests >= profile.travelers).sort((a, b) =>
    sort === 'match' ? matches.get(b.id)!.score - matches.get(a.id)!.score : sort === 'price' ? a.nightlyPrice - b.nightlyPrice : b.rating - a.rating);

  const unsupported = destination !== undefined && !findCity(destination)?.available;
  if (unsupported) {
    return (
      <div className="wrap py-10">
        <div className="mb-4 max-w-4xl"><SearchBar compact initialDestination={destination} /></div>
        <ComingSoon query={destination} />
      </div>
    );
  }

  return (
    <div className="wrap py-10">
      <div className="mb-8 max-w-4xl"><SearchBar compact initialDestination="Rome" /></div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow mb-2">{sorted.length} stays · {ok ? `${dayLabel(profile.startDate, { day: 'numeric', month: 'short' })} – ${dayLabel(profile.endDate, { day: 'numeric', month: 'short' })} · ${profile.travelers} guests` : ''}</div>
          <h1 className="text-4xl font-medium sm:text-5xl">Stays in Rome, <em className="font-light text-terra">ranked by the trip around them</em></h1>
        </div>
        <div className="flex gap-2">
          {(['match', 'price', 'rating'] as Sort[]).map((s) => <Chip key={s} active={sort === s} onClick={() => setSort(s)}>{s === 'match' ? 'Experience Match' : s === 'price' ? 'Lowest price' : 'Top rated'}</Chip>)}
        </div>
      </div>
      <div className="mt-5">{ok && <ProfileBar profile={profile} />}</div>
      <div className="mt-10 grid gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {ok ? sorted.map((s, i) => <StayCard key={s.id} stay={s} match={matches.get(s.id)!} rank={i} best={sort === 'match' && i === 0} nights={nights} />)
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
      </div>
    </div>
  );
}
