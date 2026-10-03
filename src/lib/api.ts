'use client';
import type { AgentAction, AgentResult, GenerateResult } from '@/providers/ai/types';
import type { Booking, Itinerary, ItineraryConstraints, TravelerProfile } from '@/domain/types';
import type { AnalyticsReport } from '@/services/analytics';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
  return res.json();
}

export interface PlanContext {
  profile: TravelerProfile; stayId: string | null; itinerary: Itinerary | null; constraints: ItineraryConstraints;
  bookedIds: string[]; dismissedIds: string[];
}

export const api = {
  generate: (ctx: PlanContext, request?: string) => post<GenerateResult & { provider: string }>('/api/itinerary', { ...ctx, request }),
  agent: (ctx: PlanContext, input: { message?: string; action?: AgentAction }) => post<AgentResult & { provider: string }>('/api/agent', { ...ctx, ...input }),
  bookStay: (stayId: string, nights: number) => post<Booking>('/api/bookings', { kind: 'stay', stayId, nights }),
  bookExperience: (experienceId: string) => post<Booking>('/api/bookings', { kind: 'experience', experienceIds: [experienceId] }),
  bookBundle: (name: string, experienceIds: string[]) => post<Booking>('/api/bookings', { kind: 'bundle', name, experienceIds }),
  analytics: () => fetch('/api/analytics').then((r) => r.json() as Promise<AnalyticsReport>),
};
