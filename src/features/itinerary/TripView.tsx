'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createBundle } from '@/domain/bundles/pricing';
import { DEMO_REQUEST } from '@/domain/persona';
import { matchExperience, matchStay } from '@/domain/recommendation/engine';
import type { Accommodation, Experience, ItineraryItem } from '@/domain/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { MatchRing } from '@/components/ui/MatchRing';
import { Dots, Skeleton } from '@/components/ui/misc';
import { Photo } from '@/components/ui/Photo';
import { AgentPanel } from '@/features/agent/AgentPanel';
import { ExperienceModal } from '@/features/experiences/ExperienceModal';
import { useHydrated } from '@/lib/hydration';
import { bookedExperienceIds, useAround } from '@/lib/store';
import { cn, dayLabel, eur } from '@/lib/format';
import { ItineraryItemCard } from './ItineraryItemCard';
import { generatePlan, usePlannerUI } from './usePlanner';

const THINKING = ['Reading your Travel Taste Profile', 'Searching 60+ experiences around your stay', 'Ranking by Experience Match', 'Fitting your budget', 'Designing your birthday'];

function PlannerIntro({ stay }: { stay: Accommodation }) {
  const profile = useAround((s) => s.profile);
  const busy = usePlannerUI((s) => s.busy === 'generate');
  const [req, setReq] = useState(profile.tripType === 'birthday' ? DEMO_REQUEST : `I'm staying in ${profile.destination} from ${dayLabel(profile.startDate, { month: 'long', day: 'numeric' })}–${new Date(profile.endDate).getUTCDate()}. Budget around €${profile.totalBudget} for experiences.`);
  const [step, setStep] = useState(0);
  useEffect(() => { if (!busy) return; setStep(0); const t = setInterval(() => setStep((s) => Math.min(THINKING.length - 1, s + 1)), 380); return () => clearInterval(t); }, [busy]);

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="eyebrow mb-3 text-terra">AI trip planner</div>
      <h1 className="text-4xl font-medium leading-[1.02] sm:text-6xl">Tell me about the trip. <em className="font-light text-terra">I’ll design the days.</em></h1>
      <p className="mt-4 text-ink-500">Planning around <b className="text-ink">{stay.title}</b> in {stay.neighborhood}. <Link className="link" href="/stays">Change stay</Link></p>
      <div className="mt-8 rounded-[28px] bg-white p-3 shadow-lift ring-1 ring-ink/5">
        <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={5} className="w-full resize-none rounded-2xl bg-transparent p-4 text-[16px] leading-relaxed outline-none" />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <span className="text-[12px] text-ink-400">Uses your taste profile + this request</span>
          <Button size="lg" onClick={() => generatePlan(req)} disabled={busy}>{busy ? <>Planning <Dots /></> : 'Build my trip ✦'}</Button>
        </div>
      </div>
      {busy && (
        <ol className="mt-8 space-y-2.5">
          {THINKING.slice(0, step + 1).map((t, i) => (
            <li key={t} className="flex animate-fade-up items-center gap-3 text-[14px]">
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]', i < step ? 'bg-olive text-white' : 'bg-terra-50 text-terra')}>{i < step ? '✓' : <Dots />}</span>{t}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function BudgetMeter({ total, budget, dining }: { total: number; budget: number; dining: number }) {
  const pct = Math.min(100, (total / budget) * 100);
  const over = total > budget;
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
      <div className="flex items-baseline justify-between">
        <div className="eyebrow">Experience budget</div>
        <div className="text-[13px] text-ink-500"><b className={cn('font-serif text-2xl font-medium', over ? 'text-terra' : 'text-ink')}>{eur(total)}</b> / {eur(budget)}</div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/5"><div className={cn('h-full rounded-full transition-all duration-700', over ? 'bg-terra' : 'bg-olive')} style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 flex justify-between text-[12px] text-ink-500"><span>{over ? `${eur(total - budget)} over` : `${eur(budget - total)} left`}</span><span>+ ~{eur(dining)} walk-in dining, paid at venues</span></div>
    </div>
  );
}

export function TripView({ experiences, stays }: { experiences: Experience[]; stays: Accommodation[] }) {
  const ok = useHydrated();
  const { profile, selectedStayId, itinerary, narrative, bookings, selectStay, track } = useAround();
  const [open, setOpen] = useState<{ e: Experience; item: ItineraryItem } | null>(null);
  const stay = stays.find((s) => s.id === selectedStayId) ?? null;
  const byId = useMemo(() => new Map(experiences.map((e) => [e.id, e])), [experiences]);
  const best = useMemo(() => [...stays].map((s) => ({ s, m: matchStay(s, experiences, profile) })).sort((a, b) => b.m.score - a.m.score)[0], [stays, experiences, profile]);

  if (!ok) return <div className="wrap py-10"><Skeleton className="h-[60vh]" /></div>;

  if (!stay) {
    return (
      <div className="wrap max-w-3xl py-14">
        <div className="eyebrow mb-3 text-terra">AI trip planner</div>
        <h1 className="text-4xl font-medium sm:text-5xl">First, where will you stay?</h1>
        <p className="mt-3 text-ink-500">Your itinerary is built around walking distance from your door.</p>
        <div className="mt-8 flex items-center gap-5 rounded-[28px] bg-white p-4 shadow-soft ring-1 ring-ink/5">
          <Photo src={best.s.images[0]} alt={best.s.title} className="h-24 w-28 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1"><div className="text-[13px] text-ink-500">Your best match · {best.s.neighborhood}</div><div className="font-serif text-xl">{best.s.title}</div></div>
          <MatchRing score={best.m.score} size={56} />
        </div>
        <div className="mt-5 flex gap-3"><Button onClick={() => selectStay(best.s.id)}>Plan around this stay</Button><ButtonLink href="/stays" variant="secondary">Browse stays</ButtonLink></div>
      </div>
    );
  }

  if (!itinerary) return <div className="wrap"><PlannerIntro stay={stay} /></div>;

  const booked = bookedExperienceIds(bookings);
  const unbooked = itinerary.days.flatMap((d) => d.items).map((i) => byId.get(i.experienceId)!).filter((e) => e?.bookable && !booked.includes(e.id));
  const preview = createBundle('bundle', unbooked.map((e) => ({ experienceId: e.id, name: e.name, price: e.price })), new Set(unbooked.map((e) => e.category)).size);

  return (
    <div className="wrap py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <div className="eyebrow mb-2 text-terra">Your {profile.destination} experience · v{itinerary.version}</div>
          <h1 className="text-4xl font-medium leading-[1.02] sm:text-5xl">{profile.occasion ? <>A {profile.occasion} <em className="font-light text-terra">in {profile.destination}</em></> : <>{itinerary.days.length} days in {profile.destination}</>}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">{narrative}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <BudgetMeter total={itinerary.total} budget={itinerary.budget} dining={itinerary.diningEstimate} />
            {preview.lines.length >= 2 && (
              <Link href="/bundle" className="lift flex flex-col justify-between rounded-3xl bg-ink p-5 text-sand-50 sm:w-60">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-terra-100">Bundle & save</div>
                <div className="mt-2 text-[13px] text-sand-200">{preview.lines.length} experiences · <span className="line-through">{eur(preview.subtotal)}</span></div>
                <div className="flex items-end justify-between"><span className="font-serif text-3xl">{eur(preview.total)}</span><span className="text-[13px]">Save {eur(preview.discount)} →</span></div>
              </Link>
            )}
          </div>

          <div className="no-scrollbar sticky top-[104px] z-10 -mx-4 mt-8 flex gap-2 overflow-x-auto bg-sand-50/90 px-4 py-2 backdrop-blur">
            {itinerary.days.map((d) => (
              <a key={d.date} href={`#d-${d.date}`} className={cn('shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ring-1', d.isOccasion ? 'bg-terra text-white ring-terra' : 'bg-white ring-ink/10 hover:ring-ink/30')}>
                {d.isOccasion && '🎂 '}{dayLabel(d.date, { day: 'numeric', month: 'short' }).toUpperCase()}
              </a>
            ))}
          </div>

          <div className="mt-4 space-y-12">
            {itinerary.days.map((d) => (
              <section key={d.date} id={`d-${d.date}`} className="scroll-mt-40">
                <div className={cn('mb-4 flex items-end justify-between gap-3 border-b pb-3', d.isOccasion ? 'border-terra/40' : 'hairline')}>
                  <div>
                    <div className={cn('text-[12px] font-semibold uppercase tracking-[0.18em]', d.isOccasion ? 'text-terra' : 'text-ink-500')}>{dayLabel(d.date, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                    <h2 className="mt-1 text-3xl font-medium">{d.isOccasion ? <>🎂 {d.title}</> : d.title}</h2>
                  </div>
                  <span className="text-[13px] text-ink-500">{d.items.length} stops</span>
                </div>
                <div className="space-y-3">
                  {d.items.map((it) => {
                    const e = byId.get(it.experienceId);
                    return e ? <ItineraryItemCard key={it.key} item={it} e={e} occasion={d.isOccasion} onOpen={() => { setOpen({ e, item: it }); track('CLICK', 'experience', e.id, e.tags); }} /> : null;
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/bundle" size="lg">Book experience bundle →</ButtonLink>
            <Button variant="secondary" size="lg" onClick={() => { if (confirm('Rebuild the itinerary from scratch?')) generatePlan(); }}>Rebuild from profile</Button>
          </div>
        </div>
        <aside className="lg:sticky lg:top-[120px] lg:self-start">
          <AgentPanel experiences={experiences} className="h-[min(78vh,760px)]" />
        </aside>
      </div>
      {open && <ExperienceModal e={open.e} match={matchExperience(open.e, profile, { origin: stay })} walk={open.item.walkMinutes} onClose={() => setOpen(null)} />}
    </div>
  );
}
