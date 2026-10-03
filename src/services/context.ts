import { EMPTY_CONSTRAINTS } from '@/domain/itinerary/builder';
import { DEMO_PROFILE } from '@/domain/persona';
import type { AgentContext } from '@/providers/ai/types';
import { catalogRepository } from '@/repositories';

/** Builds a server-side agent context from an untrusted request body. */
export async function contextFromBody(body: Record<string, unknown>): Promise<AgentContext> {
  const catalog = await catalogRepository.getCatalog();
  const profile = { ...DEMO_PROFILE, ...(body.profile as object) };
  const stayId = typeof body.stayId === 'string' && catalog.accommodations.some((a) => a.id === body.stayId) ? body.stayId : null;
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  return {
    catalog,
    profile,
    stayId,
    itinerary: (body.itinerary as AgentContext['itinerary']) ?? null,
    constraints: { ...EMPTY_CONSTRAINTS, ...(body.constraints as object) },
    bookedIds: arr(body.bookedIds),
    dismissedIds: arr(body.dismissedIds),
  };
}
