import { diffItineraries, EMPTY_CONSTRAINTS, type ItineraryChange } from '@/domain/itinerary/builder';
import { affinity, learnAffinities } from '@/domain/recommendation/engine';
import type { Bundle, Itinerary, ItineraryConstraints, TravelerProfile } from '@/domain/types';
import type { AgentAction, AgentContext, AgentResult } from '@/providers/ai/types';
import { replaceTargetMatches } from './intent';
import { AgentToolkit } from './tools';

const SUGGESTIONS = [
  'Make my birthday more romantic',
  "I don't like museums",
  'I want to spend less than €400',
  'Give me more local experiences',
  'Replace the restaurant',
];

const fmtDate = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const MUTATING = new Set<AgentAction['type']>(['romance', 'exclude', 'budget', 'local', 'more', 'pace', 'reset', 'swap']);

/** Runs a plan of actions against the toolkit and composes a grounded reply. */
export function executeActions(ctx: AgentContext, actions: AgentAction[]): AgentResult {
  const tk = new AgentToolkit(ctx);
  let constraints: ItineraryConstraints = structuredClone(ctx.constraints);
  let profile: TravelerProfile = ctx.profile;
  tk.getTravelerProfile();

  let current: Itinerary = ctx.itinerary ?? tk.buildItinerary(constraints);
  const before = ctx.itinerary;
  const lines: string[] = [];
  let rebuild = false;

  // 1. state-changing intents
  for (const a of actions.filter((x) => MUTATING.has(x.type))) {
    switch (a.type) {
      case 'romance':
        if (a.scope === 'occasion') constraints.occasionBoost = Math.min(1.2, (constraints.occasionBoost ?? 0) + 0.45);
        else constraints.romanceBoost = Math.min(0.7, constraints.romanceBoost + 0.35);
        lines.push(a.scope === 'occasion' ? 'I leaned your birthday into romance: intimate settings, golden-hour moments and a celebration table.' : 'I dialled up the romance across your trip.');
        break;
      case 'exclude': {
        constraints.excludeSubcategories = [...new Set([...constraints.excludeSubcategories, ...a.subcategories])];
        constraints.excludeTags = [...new Set([...constraints.excludeTags, ...a.tags])];
        if (a.tags.length) profile = { ...profile, affinities: learnAffinities(profile, 'DISMISS', a.tags).affinities };
        lines.push(`Got it, no more ${a.label}. I removed them and re-ranked everything else.`);
        break;
      }
      case 'budget': {
        const amount = a.amount < 0 ? Math.round((current.budget * -a.amount) / 10) * 10 : a.amount;
        constraints.budgetOverride = amount;
        lines.push(`Recalculated for a €${amount} experience budget, swapping in the best-value options with the smallest drop in match.`);
        break;
      }
      case 'local':
        constraints.localBoost = Math.min(0.8, constraints.localBoost + 0.45);
        profile = { ...profile, discoveryStyle: 'local' };
        lines.push('Prioritised hidden and local places, the spots Romans actually go to.');
        break;
      case 'more': {
        const learned = learnAffinities(profile, 'LIKE', a.tags);
        const boosted = Object.fromEntries(a.tags.map((t) => [t, Math.min(2, affinity(profile, t) + 0.45)]));
        profile = { ...profile, interests: [...new Set([...profile.interests, ...a.tags])], affinities: { ...learned.affinities, ...boosted } };
        lines.push(`Added more ${a.tags.join(' & ')} to your plan.`);
        break;
      }
      case 'pace': {
        const base = constraints.paceOverride ?? profile.pace;
        constraints.paceOverride = Math.max(0, Math.min(100, base + (a.direction === 'down' ? -35 : 35)));
        lines.push(a.direction === 'down' ? 'Slowed things down: fewer stops, more time to linger.' : 'Packed in more: extra stops where your days had room.');
        break;
      }
      case 'swap': {
        const old = current.days.flatMap((d) => d.items).find((i) => i.key === a.key);
        constraints.pinned = { ...constraints.pinned, [a.key]: a.experienceId };
        if (old) {
          constraints.banned = [...new Set([...constraints.banned, old.experienceId])];
          const tags = tk.experience(old.experienceId)?.tags ?? [];
          profile = { ...profile, affinities: learnAffinities(profile, 'REPLACE', tags).affinities };
        }
        lines.push(`Swapped in ${tk.experience(a.experienceId)?.name}.`);
        break;
      }
      case 'reset':
        constraints = structuredClone(EMPTY_CONSTRAINTS);
        lines.push('Back to your original plan.');
        break;
    }
    rebuild = true;
  }

  let changes: ItineraryChange[] = [];
  if (rebuild) {
    const next = tk.buildItinerary(constraints, profile);
    changes = diffItineraries(current, next);
    current = next;
    const b = tk.checkBudget(current);
    if (actions.some((a) => a.type === 'budget')) {
      lines.push(current.overBudget
        ? `Even with the leanest options the plan comes to €${b.total}, booked items are locked in. Want me to drop a paid activity?`
        : `Your plan now totals €${b.total}, leaving €${b.remaining} spare.`);
    }
    if (!changes.length && !actions.some((a) => a.type === 'reset')) {
      lines.push(actions.some((a) => a.type === 'exclude')
        ? 'There were none in your plan, so nothing moved, they will stay out of every future suggestion.'
        : 'Your current picks already fit this best, so nothing needed to move, future suggestions will follow it.');
    } else if (changes.length && actions.some((a) => a.type === 'romance') && current.days.some((d) => !d.isOccasion && d.items.some((i) => changes.some((c) => c.date === d.date && c.time === i.time)))) {
      lines.push('To keep you within budget I rebalanced a few stops on other days.');
    }
  }

  // 2. informational / commerce intents
  let alternatives: AgentResult['alternatives'];
  let bundle: Bundle | undefined;
  for (const a of actions.filter((x) => !MUTATING.has(x.type))) {
    if (a.type === 'replace') {
      const items = current.days.flatMap((d) => d.items.map((it) => ({ it, d })));
      const target = items.find(({ it, d }) => {
        const e = tk.experience(it.experienceId);
        if (!e || it.booked) return false;
        if (a.date === 'occasion' && !d.isOccasion) return false;
        if (a.date && a.date !== 'occasion' && it.date !== a.date) return false;
        return replaceTargetMatches(a.target, it.slot, e.category, e.subcategory);
      });
      if (!target) { lines.push(`I couldn't find a ${a.target} to replace that isn't already booked.`); continue; }
      const options = tk.replaceExperience(current, target.it.key, constraints);
      alternatives = { key: target.it.key, slotLabel: target.it.slotLabel, currentId: target.it.experienceId, options };
      lines.push(`Here are ${options.length} alternatives to ${tk.experience(target.it.experienceId)?.name} (${fmtDate(target.it.date)}, ${target.it.time}). Tap one to swap it in.`);
    }
    if (a.type === 'alternatives') {
      const it = current.days.flatMap((d) => d.items).find((i) => i.key === a.key);
      if (!it) continue;
      const options = tk.replaceExperience(current, it.key, constraints);
      alternatives = { key: it.key, slotLabel: it.slotLabel, currentId: it.experienceId, options };
      lines.push(`${options.length} alternatives for ${it.slotLabel.toLowerCase()} on ${fmtDate(it.date)}, ranked for you:`);
    }
    if (a.type === 'summary') {
      const b = tk.checkBudget(current);
      const stops = current.days.reduce((s, d) => s + d.items.length, 0);
      lines.push(`${current.days.length} days, ${stops} stops. Experiences total €${b.total} of your €${b.budget} budget${b.remaining >= 0 ? `, €${b.remaining} to spare` : `, €${-b.remaining} over`}.`);
    }
    if (a.type === 'bundle') {
      bundle = tk.createBundle(current, `${profile.destination} ${profile.tripType === 'birthday' ? 'Birthday' : ''} Experience`.replace(/\s+/g, ' '));
      lines.push(`I bundled ${bundle.lines.length} experiences: €${bundle.subtotal} individually, €${bundle.total} as a bundle, you save €${bundle.discount}.`);
    }
    if (a.type === 'help') {
      lines.push("I can reshape your trip: make a day more romantic, drop things you don't enjoy, fit a budget, go more local, change the pace, or swap any stop. Try one of these:");
    }
  }

  return {
    reply: lines.join(' '),
    toolCalls: tk.calls,
    itinerary: rebuild || !before ? current : undefined,
    constraints: rebuild ? constraints : undefined,
    profile: profile !== ctx.profile ? profile : undefined,
    changes,
    alternatives,
    bundle,
    suggestions: SUGGESTIONS.filter((s) => !actions.some((a) => s.toLowerCase().includes(a.type))).slice(0, 4),
  };
}
