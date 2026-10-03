import { COMPONENT_LABEL, WEIGHTS } from '@/domain/recommendation/weights';
import type { Experience, MatchResult, ScoreBreakdown, TravelerProfile } from '@/domain/types';
import { executeActions } from '@/services/agent/executor';
import { parseTripRequest, planActions } from '@/services/agent/intent';
import { AgentToolkit } from '@/services/agent/tools';
import type { AgentContext, AIProvider, GenerateResult } from './types';

const fmt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Works with zero API keys: deterministic planner + the same tools an LLM would call. */
export class MockAIProvider implements AIProvider {
  readonly name: string = 'mock';

  async generateItinerary(ctx: AgentContext, request?: string): Promise<GenerateResult> {
    let profile = ctx.profile;
    let understood: string[] = [];
    if (request?.trim()) ({ profile, understood } = parseTripRequest(request, ctx.profile));
    const tk = new AgentToolkit({ ...ctx, profile });
    tk.getTravelerProfile();
    const itinerary = tk.buildItinerary(ctx.constraints, profile);
    tk.checkBudget(itinerary);
    const stay = tk.stay;
    const occ = itinerary.days.find((d) => d.isOccasion);
    const narrative = [
      understood.length ? `Understood: ${understood.join(' · ')}.` : '',
      `Your ${itinerary.days.length}-day ${profile.destination} plan${stay ? `, built around your stay in ${stay.neighborhood}` : ''}.`,
      occ ? `${fmt(occ.date)} is your ${profile.occasion ?? 'big day'}: breakfast, a private moment of culture, sunset and a celebration dinner.` : '',
      `Experiences total €${itinerary.total} of your €${itinerary.budget} budget.`,
    ].filter(Boolean).join(' ');
    return { itinerary, profile, narrative, toolCalls: tk.calls };
  }

  async modifyItinerary(ctx: AgentContext, message: string) {
    return executeActions(ctx, planActions(message));
  }

  async explainRecommendation(e: Experience, match: MatchResult, p: TravelerProfile) {
    const top = (Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[])
      .map((k) => ({ k, contrib: match.breakdown[k] * WEIGHTS[k] }))
      .sort((a, b) => b.contrib - a.contrib)
      .slice(0, 2)
      .map(({ k }) => COMPONENT_LABEL[k].toLowerCase());
    return `${e.name} scores ${match.score}% for your ${p.tripType} trip, driven mostly by ${top.join(' and ')}. ${match.reasons.join('. ')}.`;
  }
}
