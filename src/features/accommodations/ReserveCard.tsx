'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Accommodation } from '@/domain/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { useAround } from '@/lib/store';
import { toast } from '@/lib/toast';
import { dayLabel, eur, nightsBetween } from '@/lib/format';

const FEE = 0.08;

export function ReserveCard({ stay, matchScore }: { stay: Accommodation; matchScore: number }) {
  const { profile, stayBooking, addBooking } = useAround();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const nights = nightsBetween(profile.startDate, profile.endDate);
  const sub = stay.nightlyPrice * nights;
  const total = Math.round(sub * (1 + FEE));
  const bookedHere = stayBooking?.refIds.includes(stay.id);

  const pay = async () => {
    setBusy(true);
    try {
      const b = await api.bookStay(stay.id, nights);
      addBooking(b);
      toast(`Stay confirmed · ${b.confirmation}`, 'success');
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-lift ring-1 ring-ink/5">
      <div className="flex items-baseline justify-between">
        <div><span className="font-serif text-3xl">{eur(stay.nightlyPrice)}</span> <span className="text-ink-500">/ night</span></div>
        <span className="rounded-full bg-olive-100 px-2.5 py-1 text-xs font-semibold text-olive">{matchScore}% match</span>
      </div>
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-2xl ring-1 ring-ink/15 text-[13px]">
        <div className="border-r border-ink/15 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Check-in</div>{dayLabel(profile.startDate)}</div>
        <div className="p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Check-out</div>{dayLabel(profile.endDate)}</div>
        <div className="col-span-2 border-t border-ink/15 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Guests</div>{profile.travelers} guests</div>
      </div>
      {bookedHere ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-olive-100 p-4 text-sm text-olive"><b>✓ Reserved</b> · confirmation {stayBooking!.confirmation}</div>
          <ButtonLink href="/trip" className="w-full" size="lg">Build my trip around this stay →</ButtonLink>
        </div>
      ) : (
        <>
          <Button className="mt-5 w-full" size="lg" onClick={() => setOpen(true)}>Reserve</Button>
          <ButtonLink href="/trip" variant="secondary" className="mt-2.5 w-full">Plan my trip here first</ButtonLink>
        </>
      )}
      <div className="mt-5 space-y-1.5 text-[14px] text-ink-700">
        <div className="flex justify-between"><span>{eur(stay.nightlyPrice)} × {nights} nights</span><span>{eur(sub)}</span></div>
        <div className="flex justify-between"><span>Service fee</span><span>{eur(total - sub)}</span></div>
        <div className="flex justify-between border-t hairline pt-2 font-semibold"><span>Total</span><span>{eur(total)}</span></div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        {bookedHere ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive text-2xl text-white">✓</div>
            <h3 className="mt-4 text-3xl font-medium">You’re going to Rome</h3>
            <p className="mt-2 text-ink-500">Confirmation <b className="text-ink">{stayBooking!.confirmation}</b>. Now let’s plan what your stay can become.</p>
            <ButtonLink href="/trip" size="lg" className="mt-6 w-full">Build my trip around this stay →</ButtonLink>
            <Link href="#" onClick={() => setOpen(false)} className="mt-3 block text-sm text-ink-500">Back to the stay</Link>
          </div>
        ) : (
          <>
            <div className="eyebrow">Confirm and pay · demo</div>
            <h3 className="mt-2 text-2xl font-medium">{stay.title}</h3>
            <p className="mt-1 text-sm text-ink-500">{dayLabel(profile.startDate)} → {dayLabel(profile.endDate)} · {profile.travelers} guests</p>
            <div className="mt-5 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/10">
              <div className="flex justify-between"><span>Total (EUR)</span><b>{eur(total)}</b></div>
              <div className="mt-2 text-ink-500">Paid with a mock payment provider: no card needed, nothing is charged.</div>
            </div>
            <Button className="mt-6 w-full" size="lg" disabled={busy} onClick={pay}>{busy ? 'Confirming…' : `Confirm and pay ${eur(total)}`}</Button>
          </>
        )}
      </Modal>
    </div>
  );
}
