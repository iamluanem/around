'use client';
import { create } from 'zustand';
import type { AgentAction } from '@/providers/ai/types';
import { api, type PlanContext } from '@/lib/api';
import { bookedExperienceIds, uid, useAround } from '@/lib/store';
import { toast } from '@/lib/toast';

/** Transient UI state for the planner (not persisted). */
export const usePlannerUI = create<{ busy: false | 'generate' | 'agent'; highlight: string[]; provider: string }>(() => ({ busy: false, highlight: [], provider: 'mock' }));

function context(): PlanContext {
  const s = useAround.getState();
  return {
    profile: s.profile, stayId: s.selectedStayId, itinerary: s.itinerary, constraints: s.constraints,
    bookedIds: bookedExperienceIds(s.bookings), dismissedIds: s.dismissed,
  };
}

function flash(keys: string[]) {
  usePlannerUI.setState({ highlight: keys });
  setTimeout(() => usePlannerUI.setState({ highlight: [] }), 3500);
}

export async function generatePlan(request?: string) {
  usePlannerUI.setState({ busy: 'generate' });
  try {
    const r = await api.generate(context(), request);
    useAround.getState().setPlan({ itinerary: r.itinerary, profile: r.profile, narrative: r.narrative });
    useAround.getState().pushChat({ id: uid(), role: 'agent', text: r.narrative, toolCalls: r.toolCalls, suggestions: ['Make my birthday more romantic', "I don't like museums", 'I want to spend less than €400', 'Give me more local experiences'] });
    usePlannerUI.setState({ provider: r.provider });
  } catch (e) {
    toast((e as Error).message);
  } finally {
    usePlannerUI.setState({ busy: false });
  }
}

export async function askAgent(input: { message?: string; action?: AgentAction }, echo?: string) {
  const store = useAround.getState();
  if (input.message || echo) store.pushChat({ id: uid(), role: 'user', text: input.message ?? echo! });
  usePlannerUI.setState({ busy: 'agent' });
  try {
    const r = await api.agent(context(), input);
    useAround.getState().setPlan({ itinerary: r.itinerary, constraints: r.constraints, profile: r.profile });
    useAround.getState().pushChat({
      id: uid(), role: 'agent', text: r.reply, toolCalls: r.toolCalls, changes: r.changes, alternatives: r.alternatives, bundle: r.bundle, suggestions: r.suggestions,
    });
    if (r.changes?.length) flash(r.changes.map((c) => `${c.date}|${c.time}`));
    usePlannerUI.setState({ provider: r.provider });
    return r;
  } catch (e) {
    toast((e as Error).message);
  } finally {
    usePlannerUI.setState({ busy: false });
  }
}
