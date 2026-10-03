'use client';
import { useState } from 'react';
import { createBundle } from '@/domain/bundles/pricing';
import type { Booking, Experience } from '@/domain/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { Skeleton } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { useHydrated } from '@/lib/hydration';
import { bookedExperienceIds, useAround } from '@/lib/store';
import { toast } from '@/lib/toast';
import { cn, dayLabel, eur } from '@/lib/format';

export function BundleView({ experiences }: { experiences: Experience[] }) {
  const ok = useHydrated();
  const { profile, itinerary, bookings, bundleExcluded, toggleBundleItem, addBooking } = useAround();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  if (!ok) return <div className="wrap py-10"><Skeleton className="h-96" /></div>;

  if (!itinerary) {
    return (
      <div className="wrap max-w-2xl py-20 text-center">
        <h1 className="text-4xl font-medium">Build your itinerary first</h1>
        <p className="mt-3 text-ink-500">Bundles are assembled from the experiences in your personalised plan.</p>
        <ButtonLink href="/trip" size="lg" className="mt-8">Open the AI planner →</ButtonLink>
      </div>
    );
  }

  const booked = bookedExperienceIds(bookings);
  const name = `${profile.destination} ${profile.tripType === 'birthday' ? 'Birthday' : profile.tripType === 'romantic' ? 'Romance' : 'Signature'} Experience`;
  const items = itinerary.days.flatMap((d) => d.items.map((it) => ({ it, d, e: experiences.find((x) => x.id === it.experienceId)! })))
    .filter(({ e }) => e?.bookable && !booked.includes(e.id));
  const chosen = items.filter(({ e }) => !bundleExcluded.includes(e.id));
  const bundle = createBundle(name, chosen.map(({ e }) => ({ experienceId: e.id, name: e.name, price: e.price })), new Set(chosen.map(({ e }) => e.category)).size);

  const book = async () => {
    setBusy(true);
    try {
      const b = await api.bookBundle(name, bundle.lines.map((l) => l.experienceId));
      addBooking(b); setDone(b); toast(`Bundle booked · ${b.confirmation}`, 'success');
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  if (done) {
    const total = useAround.getState().bookings.reduce((s, b) => s + b.amount, 0);
    return (
      <div className="wrap max-w-2xl py-16">
        <div className="mx-auto flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-olive text-3xl text-white">✓</div>
        <h1 className="mt-6 text-center text-5xl font-medium">Your Rome is booked</h1>
        <p className="mt-3 text-center text-ink-500">{done.label} · confirmation <b className="text-ink">{done.confirmation}</b></p>
        <div className="mt-10 rounded-[28px] bg-white p-6 ring-1 ring-ink/5">
          <div className="eyebrow mb-4">Everything on this trip</div>
          {useAround.getState().bookings.map((b) => (
            <div key={b.id} className="flex justify-between gap-4 border-b hairline py-3 text-[14px] last:border-0">
              <span><span className="mr-2 rounded-full bg-sand-100 px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-500">{b.kind}</span>{b.label}</span><b>{eur(b.amount)}</b>
            </div>
          ))}
          <div className="mt-3 flex justify-between font-serif text-2xl"><span>Marketplace GMV</span><span>{eur(total)}</span></div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><ButtonLink href="/trip">Back to my trip</ButtonLink><ButtonLink href="/admin/analytics" variant="secondary">See the business view →</ButtonLink></div>
      </div>
    );
  }

  return (
    <div className="wrap py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="eyebrow mb-2 text-terra">Experience bundle</div>
          <h1 className="text-5xl font-medium leading-none">{name}</h1>
          <p className="mt-3 max-w-xl text-ink-500">Everything bookable in your plan, in one checkout. The more you bundle, the more you save — untick anything you’d rather book later.</p>
          <ul className="mt-8 space-y-3">
            {items.map(({ it, d, e }) => {
              const on = !bundleExcluded.includes(e.id);
              return (
                <li key={it.key}>
                  <label className={cn('flex cursor-pointer items-center gap-4 rounded-3xl bg-white p-3 pr-5 ring-1 transition', on ? 'ring-ink/10' : 'opacity-50 ring-transparent')}>
                    <input type="checkbox" checked={on} onChange={() => toggleBundleItem(e.id)} className="ml-2 h-5 w-5 accent-[#C2532B]" />
                    <Photo src={e.image} alt={e.name} className="h-16 w-20 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-ink-500">{d.isOccasion && '🎂 '}{dayLabel(d.date)} · {it.time} · {it.slotLabel}</div>
                      <div className="truncate font-serif text-lg">{e.name}</div>
                    </div>
                    <b className="tabular-nums">{eur(e.price)}</b>
                  </label>
                </li>
              );
            })}
            {items.length === 0 && <li className="rounded-3xl bg-white p-6 text-ink-500">Everything bookable is already booked. 🎉</li>}
          </ul>
          {booked.length > 0 && <p className="mt-4 text-[13px] text-ink-500">{booked.length} experience{booked.length > 1 ? 's' : ''} already booked separately.</p>}
        </div>
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[28px] bg-ink p-7 text-sand-50 shadow-lift">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-terra-100">{bundle.lines.length} experiences</div>
            <div className="mt-5 space-y-2 text-[14px]">
              <div className="flex justify-between text-sand-200"><span>Individual total</span><span className="tabular-nums">{eur(bundle.subtotal)}</span></div>
              <div className="flex justify-between text-sand-200"><span>Bundle discount ({Math.round(bundle.discountRate * 100)}%)</span><span className="tabular-nums">−{eur(bundle.discount)}</span></div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4">
              <span className="text-sand-200">Bundle</span><span className="font-serif text-5xl">{eur(bundle.total)}</span>
            </div>
            {bundle.discount > 0 && <div className="mt-3 rounded-full bg-terra px-3 py-1.5 text-center text-sm font-semibold">You save {eur(bundle.discount)}</div>}
            <Button size="lg" className="mt-6 w-full" disabled={busy || bundle.lines.length < 2} onClick={book}>{busy ? 'Booking…' : 'Book experience bundle'}</Button>
            {bundle.lines.length < 2 && <p className="mt-2 text-center text-[12px] text-sand-300">Select at least 2 experiences</p>}
            <p className="mt-4 text-[11.5px] leading-snug text-sand-300">Discount = 4% + 2% per experience, +2% when mixing 3+ categories, capped at 15%. Priced server-side. Demo payment — nothing is charged.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
