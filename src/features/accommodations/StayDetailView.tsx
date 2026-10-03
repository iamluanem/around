'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { buildItinerary, EMPTY_CONSTRAINTS } from '@/domain/itinerary/builder';
import { matchStay, rankExperiences } from '@/domain/recommendation/engine';
import type { Accommodation, Experience, Recommendation } from '@/domain/types';
import { LayerToggles, layerOf, RomeMap, type Layer } from '@/components/map/RomeMap';
import { Photo } from '@/components/ui/Photo';
import { MatchRing } from '@/components/ui/MatchRing';
import { SectionTitle, Skeleton, Stars } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { ExperienceCard } from '@/features/experiences/ExperienceCard';
import { ExperienceModal } from '@/features/experiences/ExperienceModal';
import { MatchBreakdown } from '@/features/recommendations/MatchBreakdown';
import { useHydrated } from '@/lib/hydration';
import { useAround } from '@/lib/store';
import { cn, dayLabel, eur } from '@/lib/format';
import { ReserveCard } from './ReserveCard';
import { nearestLandmarks } from './landmarks';

const ICON: Record<Layer, string> = { restaurant: '🍝', experience: '✦', event: '♪', attraction: '🏛', nightlife: '🍸', cafe: '☕', hidden: '◆' };

export function StayDetailView({ stay, experiences }: { stay: Accommodation; experiences: Experience[] }) {
  const ok = useHydrated();
  const { profile, dismissed, selectStay, track } = useAround();
  const [layers, setLayers] = useState<Set<Layer>>(new Set(['restaurant', 'experience', 'event', 'attraction', 'nightlife', 'cafe', 'hidden']));
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (!ok) return;
    selectStay(stay.id);
    track('VIEW', 'accommodation', stay.id, [], true);
  }, [ok, stay.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const match = useMemo(() => matchStay(stay, experiences, profile), [stay, experiences, profile]);
  const ranked = useMemo(() => rankExperiences(experiences, profile, { origin: stay, dismissed }), [experiences, profile, stay, dismissed]);
  const scores = useMemo(() => new Map(ranked.map((r) => [r.experience.id, r.match.score])), [ranked]);
  const preview = useMemo(() => buildItinerary({ profile, stay, experiences, constraints: EMPTY_CONSTRAINTS, dismissedIds: dismissed }), [profile, stay, experiences, dismissed]);

  // "From your door": best matches within 20 min, ordered by walking time, one per subcategory
  const timeline = useMemo(() => {
    const seen = new Set<string>();
    return ranked.filter((r) => r.walkMinutes <= 20 && r.match.score >= 75 && r.experience.category !== 'walk')
      .filter((r) => (seen.has(r.experience.subcategory) ? false : (seen.add(r.experience.subcategory), true)))
      .slice(0, 7)
      .sort((a, b) => a.walkMinutes - b.walkMinutes);
  }, [ranked]);
  const counts = useMemo(() => {
    const c = {} as Record<Layer, number>;
    for (const e of experiences) c[layerOf(e)] = (c[layerOf(e)] ?? 0) + 1;
    return c;
  }, [experiences]);
  const nearby = ranked.filter((r) => r.walkMinutes <= 20 && r.experience.category !== 'walk').slice(0, 6);
  const openExp = (r: Recommendation) => { setOpen(r); track('CLICK', 'experience', r.experience.id, r.experience.tags); };
  const name = (id: string) => experiences.find((e) => e.id === id)?.name ?? '';

  return (
    <div className="wrap py-8">
      <Link href="/stays" className="text-sm text-ink-500 hover:text-ink">← All stays</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{stay.type} · {stay.neighborhood}, Rome</div>
          <h1 className="mt-2 max-w-3xl text-4xl font-medium leading-[1.02] sm:text-5xl">{stay.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <Stars rating={stay.rating} count={stay.reviewCount} /> <span>Hosted by {stay.host}</span>
            <span>{nearestLandmarks(stay, 3).map((l) => `${l.minutes} min to ${l.name}`).join(' · ')}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid h-[260px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[28px] sm:h-[420px]">
        <Photo src={stay.images[0]} alt={stay.title} className="col-span-4 row-span-2 sm:col-span-2" />
        <Photo src={stay.images[1]} alt={`${stay.title} interior`} className="hidden sm:col-span-2 sm:block" />
        <Photo src={stay.images[2]} alt={`${stay.neighborhood} neighbourhood`} label={stay.neighborhood} className="hidden sm:col-span-2 sm:block" />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* ── The wow moment ── */}
          <section className="animate-fade-up">
            <div className="eyebrow mb-3 text-terra">Stay here. Experience this.</div>
            {ok ? (
              <div className="flex flex-col gap-6 rounded-[32px] bg-white p-6 shadow-soft ring-1 ring-ink/5 sm:flex-row sm:p-8">
                <div className="flex flex-col items-center sm:pr-8 sm:border-r hairline">
                  <MatchRing score={match.score} size={132} stroke={9} />
                  <div className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">Experience Match</div>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-2xl font-medium leading-snug sm:text-[28px]">{match.headline}</h2>
                  <div className="mt-1 text-sm text-ink-500">Why this stay matches you</div>
                  <ul className="mt-4 grid gap-2.5 text-[15px]">
                    {match.reasons.map((r, i) => (
                      <li key={r} className="flex animate-fade-up gap-3" style={{ animationDelay: `${300 + i * 90}ms` }}>
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-olive-100 text-[11px] text-olive">✓</span>{r}
                      </li>
                    ))}
                    {match.cautions.map((r) => <li key={r} className="flex gap-3 text-ink-500"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[11px]">!</span>{r}</li>)}
                  </ul>
                </div>
              </div>
            ) : <Skeleton className="h-64" />}
          </section>

          {/* ── Map + walking timeline ── */}
          <section className="mt-14">
            <SectionTitle eyebrow="Around your door" title="What your stay can become" sub="Everything on the map is scored against your Taste Profile. Bigger dots are better matches; dashed lines are your best picks." />
            <LayerToggles layers={layers} counts={counts} onToggle={(l) => setLayers((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n; })} />
            <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_280px]">
              {ok ? <RomeMap stay={stay} experiences={experiences.filter((e) => !dismissed.includes(e.id))} scores={scores} highlight={hover} onHover={setHover} routes={timeline.map((t) => t.experience.id)} layers={layers} /> : <Skeleton className="aspect-[10/7]" />}
              <ol className="relative">
                <li className="flex items-center gap-3 pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sand-50">⌂</span>
                  <span className="font-medium">Your {stay.type.toLowerCase().replace('entire ', '')}</span>
                </li>
                {timeline.map((r, i) => (
                  <li key={r.experience.id} onMouseEnter={() => setHover(r.experience.id)} onMouseLeave={() => setHover(null)} onClick={() => openExp(r)}
                    className={cn('relative flex cursor-pointer gap-3 rounded-2xl py-2.5 pl-1 pr-2 transition animate-fade-up', hover === r.experience.id && 'bg-white shadow-soft')} style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="absolute -top-3 left-[18px] h-4 w-px bg-ink/15" />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-100 text-sm">{ICON[layerOf(r.experience)]}</span>
                    <span className="min-w-0 text-[14px] leading-snug">
                      <b className="font-semibold tabular-nums">{r.walkMinutes} min</b> · {r.experience.name}
                      <span className="block text-[12px] text-ink-500">{r.match.score}% match</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Trip preview ── */}
          {ok && (
            <section className="mt-14">
              <SectionTitle eyebrow="If you stayed here" title={<>Your {preview.days.length} days, <em className="font-light text-terra">at a glance</em></>} sub={`A first draft built from your profile, ${eur(preview.total)} of your ${eur(preview.budget)} experience budget. The AI planner can reshape all of it.`} />
              <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
                {preview.days.map((d) => (
                  <div key={d.date} className={cn('w-[250px] shrink-0 snap-start rounded-3xl p-5', d.isOccasion ? 'bg-terra text-white' : 'bg-white ring-1 ring-ink/5')}>
                    <div className={cn('text-[11px] font-semibold uppercase tracking-widest', d.isOccasion ? 'text-terra-100' : 'text-ink-500')}>{dayLabel(d.date)}</div>
                    <div className="mt-1 font-serif text-xl">{d.isOccasion ? `🎂 ${d.title}` : d.title}</div>
                    <ul className="mt-3 space-y-2 text-[13px]">
                      {d.items.map((it) => <li key={it.key} className="flex gap-2"><span className={cn('w-10 shrink-0 tabular-nums', d.isOccasion ? 'text-terra-100' : 'text-ink-400')}>{it.time}</span><span className="leading-snug">{name(it.experienceId)}</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-5"><ButtonLink href="/trip" variant="dark">Plan it with the AI →</ButtonLink></div>
            </section>
          )}

          {/* ── Nearby ── */}
          <section className="mt-14">
            <SectionTitle eyebrow="Top matches nearby" title="Experiences picked for you" sub="Save, like or dismiss, every signal updates your taste profile and re-ranks the list." />
            <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
              {ok && nearby.map((r) => <ExperienceCard key={r.experience.id} e={r.experience} match={r.match} walk={r.walkMinutes} onOpen={() => openExp(r)} onHover={setHover} />)}
            </div>
          </section>

          <section className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="eyebrow mb-4">Score breakdown</div>
              {ok && <MatchBreakdown match={match} />}
            </div>
            <div>
              <div className="eyebrow mb-3">About this stay</div>
              <p className="text-[15px] leading-relaxed text-ink-700">{stay.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-[14px]">{stay.amenities.map((a) => <span key={a} className="flex items-center gap-2"><span className="text-olive">•</span>{a}</span>)}</div>
              <div className="mt-5 text-sm text-ink-500">{stay.bedrooms ? `${stay.bedrooms} bedroom${stay.bedrooms > 1 ? 's' : ''}` : 'Studio'} · up to {stay.maxGuests} guests</div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">{ok ? <ReserveCard stay={stay} matchScore={match.score} /> : <Skeleton className="h-80" />}</aside>
      </div>

      {open && <ExperienceModal e={open.experience} match={open.match} walk={open.walkMinutes} onClose={() => setOpen(null)} />}
    </div>
  );
}
