import { NextResponse } from 'next/server';
import { catalogRepository, eventRepository } from '@/repositories';
import { liveSummary, simulateCohort } from '@/services/analytics';

export async function GET() {
  const [catalog, interactions, bookings] = await Promise.all([catalogRepository.getCatalog(), eventRepository.listInteractions(), eventRepository.listBookings()]);
  return NextResponse.json({ ...simulateCohort(catalog), live: liveSummary(interactions, bookings) });
}
