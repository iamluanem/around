'use client';
import { useMemo, useState } from 'react';
import { CITY_CENTER, rankExperiences } from '@/domain/recommendation/engine';
import { CATEGORY_LABEL } from '@/domain/labels';
import type { Accommodation, Experience, ExperienceCategory, Recommendation } from '@/domain/types';
import { Chip, Skeleton } from '@/components/ui/misc';
import { AffinityPanel } from '@/features/traveler-profile/AffinityPanel';
import { ProfileBar } from '@/features/traveler-profile/ProfileBar';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { ExperienceCard } from './ExperienceCard';
import { ExperienceModal } from './ExperienceModal';

const FILTERS: (ExperienceCategory | 'all')[] = ['all', 'experience', 'tour', 'restaurant', 'cafe', 'nightlife', 'attraction', 'event'];

export function ExperiencesView({ experiences, stays }: { experiences: Experience[]; stays: Accommodation[] }) {
  const ok = useHydrated();
  const { profile, dismissed, selectedStayId, track, undismiss } = useAround();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [open, setOpen] = useState<Recommendation | null>(null);
  const stay = stays.find((s) => s.id === selectedStayId) ?? null;
  const ranked = useMemo(() => rankExperiences(experiences.filter((e) => e.category !== 'walk'), profile, { origin: stay ?? CITY_CENTER, dismissed }), [experiences, profile, stay, dismissed]);
  const shown = ranked.filter((r) => filter === 'all' || r.experience.category === filter);
  const gone = experiences.filter((e) => dismissed.includes(e.id));

  return (
    <div className="wrap py-10">
      <div className="eyebrow mb-2">{ok ? (stay ? `Ranked from ${stay.title}` : 'Ranked from the centre of Rome, pick a stay for walking times') : ' '}</div>
      <h1 className="text-4xl font-medium sm:text-5xl">Experiences, <em className="font-light text-terra">in order of you</em></h1>
      <div className="mt-4">{ok && <ProfileBar profile={profile} />}</div>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : CATEGORY_LABEL[f]}</Chip>)}
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
          {ok ? shown.map((r) => (
            <ExperienceCard key={r.experience.id} e={r.experience} match={r.match} walk={r.walkMinutes}
              onOpen={() => { setOpen(r); track('CLICK', 'experience', r.experience.id, r.experience.tags); }} />
          )) : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/4]" />)}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          {ok && <AffinityPanel />}
          {ok && gone.length > 0 && (
            <div className="rounded-3xl bg-white p-5 text-[13px] ring-1 ring-ink/5">
              <div className="eyebrow mb-2">Dismissed</div>
              {gone.map((e) => <div key={e.id} className="flex items-center justify-between gap-2 py-1"><span className="truncate">{e.name}</span><button onClick={() => undismiss(e.id)} className="link shrink-0 text-ink-500">Undo</button></div>)}
            </div>
          )}
        </aside>
      </div>
      {open && <ExperienceModal e={open.experience} match={open.match} walk={open.walkMinutes} onClose={() => setOpen(null)} />}
    </div>
  );
}
