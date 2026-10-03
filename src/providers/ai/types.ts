import type { ItineraryChange } from '@/domain/itinerary/builder';
import type {
  Bundle, Catalog, Experience, Interest, Itinerary, ItineraryConstraints, MatchResult, TravelerProfile,
} from '@/domain/types';

export interface AgentContext {
  catalog: Catalog;
  profile: TravelerProfile;
  stayId: string | null;
  itinerary: Itinerary | null;
  constraints: ItineraryConstraints;
  bookedIds: string[];
  dismissedIds: string[];
}

export type AgentAction =
  | { type: 'romance'; scope: 'occasion' | 'all' }
  | { type: 'exclude'; subcategories: string[]; tags: Interest[]; label: string }
  | { type: 'budget'; amount: number }
  | { type: 'local' }
  | { type: 'replace'; target: string; date?: string }
  | { type: 'swap'; key: string; experienceId: string }
  | { type: 'alternatives'; key: string }
  | { type: 'pace'; direction: 'up' | 'down' }
  | { type: 'more'; tags: Interest[] }
  | { type: 'summary' }
  | { type: 'bundle' }
  | { type: 'reset' }
  | { type: 'help' };

export interface ToolCall { tool: string; args: Record<string, unknown>; summary: string }

export interface Alternative { experienceId: string; match: MatchResult; walkMinutes: number; notes: string[] }

export interface AgentResult {
  reply: string;
  toolCalls: ToolCall[];
  itinerary?: Itinerary;
  constraints?: ItineraryConstraints;
  profile?: TravelerProfile;
  changes?: ItineraryChange[];
  alternatives?: { key: string; slotLabel: string; currentId: string; options: Alternative[] };
  bundle?: Bundle;
  suggestions: string[];
}

export interface GenerateResult { itinerary: Itinerary; profile: TravelerProfile; narrative: string; toolCalls: ToolCall[] }

/** Provider-agnostic AI contract. Mock today, OpenAI (or Claude) tomorrow. */
export interface AIProvider {
  readonly name: string;
  generateItinerary(ctx: AgentContext, request?: string): Promise<GenerateResult>;
  modifyItinerary(ctx: AgentContext, message: string): Promise<AgentResult>;
  explainRecommendation(e: Experience, match: MatchResult, profile: TravelerProfile): Promise<string>;
}
