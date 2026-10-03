import { NextResponse } from 'next/server';
import { createBundle } from '@/domain/bundles/pricing';
import type { Booking } from '@/domain/types';
import { payments } from '@/providers/payments';
import { catalogRepository, eventRepository } from '@/repositories';

const SERVICE_FEE = 0.08;

/** Prices are always recomputed server-side from the catalogue, the client only sends ids. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let amount = 0, label = '', refIds: string[] = [];
  const kind = body.kind as Booking['kind'];

  if (kind === 'stay') {
    const stay = await catalogRepository.getAccommodation(String(body.stayId));
    const nights = Math.max(1, Math.min(30, Number(body.nights) || 1));
    if (!stay) return NextResponse.json({ error: 'Unknown stay' }, { status: 404 });
    amount = Math.round(stay.nightlyPrice * nights * (1 + SERVICE_FEE));
    label = `${stay.title} · ${nights} nights`;
    refIds = [stay.id];
  } else if (kind === 'experience' || kind === 'bundle') {
    const ids: string[] = Array.isArray(body.experienceIds) ? body.experienceIds.map(String) : [];
    const exps = (await Promise.all(ids.map((id) => catalogRepository.getExperience(id)))).filter((e) => e && e.bookable);
    if (!exps.length) return NextResponse.json({ error: 'Nothing bookable' }, { status: 400 });
    refIds = exps.map((e) => e!.id);
    if (kind === 'bundle') {
      const b = createBundle(String(body.name ?? 'Experience bundle'), exps.map((e) => ({ experienceId: e!.id, name: e!.name, price: e!.price })), new Set(exps.map((e) => e!.category)).size);
      amount = b.total;
      label = `${b.name} · ${b.lines.length} experiences (−${Math.round(b.discountRate * 100)}%)`;
    } else {
      amount = exps[0]!.price;
      label = exps[0]!.name;
    }
  } else {
    return NextResponse.json({ error: 'Unknown booking kind' }, { status: 400 });
  }

  const pay = await payments.charge({ amount, currency: 'EUR', description: label });
  if (pay.status !== 'succeeded') return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
  const booking: Booking = { id: pay.id, kind, refIds, label, amount, currency: 'EUR', confirmation: pay.confirmation, createdAt: new Date().toISOString() };
  await eventRepository.recordBooking(booking);
  return NextResponse.json(booking);
}
