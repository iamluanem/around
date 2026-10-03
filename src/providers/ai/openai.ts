import { executeActions } from '@/services/agent/executor';
import { planActions } from '@/services/agent/intent';
import { INTERESTS } from '@/domain/types';
import type { AgentAction, AgentContext } from './types';
import { MockAIProvider } from './mock';

const SYSTEM = `You are AROUND's trip-planning agent. Convert the traveler's message into a JSON object
{"actions": AgentAction[]} where AgentAction is one of:
{"type":"romance","scope":"occasion"|"all"} | {"type":"exclude","subcategories":string[],"tags":Interest[],"label":string}
| {"type":"budget","amount":number} | {"type":"local"} | {"type":"replace","target":"restaurant"|"dinner"|"lunch"|"breakfast"|"class"|"tour"|"walk"|"drinks"|"sunset"|"museum","date"?:"YYYY-MM-DD"|"occasion"}
| {"type":"pace","direction":"up"|"down"} | {"type":"more","tags":Interest[]} | {"type":"summary"} | {"type":"bundle"} | {"type":"reset"} | {"type":"help"}
Interest is one of: ${INTERESTS.join(', ')}. Museum dislikes use subcategories ["museum"]. Return only JSON.`;

const VALID = new Set(['romance', 'exclude', 'budget', 'local', 'replace', 'pace', 'more', 'summary', 'bundle', 'reset', 'help']);

/**
 * OpenAI-backed provider: the LLM plans which tools to use; execution stays deterministic
 * and explainable. Falls back to the rule-based planner on any error.
 */
export class OpenAIProvider extends MockAIProvider {
  readonly name: string = 'openai';
  constructor(private apiKey: string, private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini') { super(); }

  private async plan(message: string, ctx: AgentContext): Promise<AgentAction[]> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Trip: ${ctx.profile.destination}, ${ctx.profile.tripType}, budget €${ctx.profile.totalBudget}.\nMessage: ${message}` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    const actions = (parsed.actions ?? []).filter((a: AgentAction) => a && VALID.has(a.type)) as AgentAction[];
    for (const a of actions) if (a.type === 'exclude') { a.subcategories ??= []; a.tags ??= []; a.label ??= 'those'; }
    if (!actions.length) throw new Error('empty plan');
    return actions;
  }

  async modifyItinerary(ctx: AgentContext, message: string) {
    let actions: AgentAction[];
    try { actions = await this.plan(message, ctx); } catch { actions = planActions(message); }
    return executeActions(ctx, actions);
  }
}
