import { CITY_CENTER, matchExperience, tripDays } from '../recommendation/engine';
import { INTEREST_PHRASE, paceLabel } from '../labels';
import type {
  Accommodation, Experience, Interest, Itinerary, ItineraryConstraints, ItineraryDay, ItineraryItem, SlotKind, TravelerProfile,
} from '../types';

// ─── Slot catalogue ───────────────────────────────────────────────────────────
export interface SlotSpec {
  label: string;
  optional?: boolean;
  accepts: (e: Experience) => boolean;
  boost?: (e: Experience) => number;
}

const has = (e: Experience, ...t: Interest[]) => t.some((x) => e.tags.includes(x));
const at = (e: Experience, ...t: Experience['times']) => t.some((x) => e.times.includes(x));

export const SLOT_SPECS: Record<SlotKind, SlotSpec> = {
  'arrival-walk': { label: 'Neighborhood walk', accepts: (e) => e.category === 'walk' },
  dinner: { label: 'Local restaurant', accepts: (e) => e.category === 'restaurant' && e.subcategory === 'dinner' && at(e, 'evening'), boost: (e) => e.localness * 0.1 },
  'morning-culture': {
    label: 'Morning culture',
    accepts: (e) => (e.category === 'attraction' || e.category === 'tour') && at(e, 'morning') && e.durationMin >= 45 && has(e, 'history', 'art', 'culture'),
    boost: (e) => (e.durationMin >= 120 ? 0.05 : 0),
  },
  lunch: { label: 'Lunch', optional: true, accepts: (e) => e.category === 'restaurant' && at(e, 'midday') },
  afternoon: {
    label: 'Afternoon experience',
    accepts: (e) => ['experience', 'event', 'tour'].includes(e.category) && at(e, 'afternoon', 'evening') && e.subcategory !== 'sunset',
    boost: (e) => (e.subcategory === 'tasting' ? 0.08 : 0),
  },
  'rooftop-dinner': {
    label: 'Dinner',
    accepts: (e) => e.category === 'restaurant' && at(e, 'evening'),
    boost: (e) => (e.subcategory === 'rooftop' ? 0.25 : 0) + (has(e, 'romantic') ? 0.05 : 0),
  },
  breakfast: {
    label: 'Celebration breakfast',
    accepts: (e) => e.category === 'cafe' && at(e, 'morning'),
    boost: (e) => (e.subcategory === 'breakfast' ? 0.12 : 0) + (has(e, 'luxury') ? 0.12 : 0),
  },
  'private-culture': {
    label: 'Private cultural experience',
    accepts: (e) => ['tour', 'experience'].includes(e.category) && at(e, 'afternoon') && has(e, 'culture', 'history', 'art') &&
      (has(e, 'luxury') || ['private', 'workshop', 'museum'].includes(e.subcategory)),
    boost: (e) => (e.subcategory === 'private' ? 0.25 : 0) + (has(e, 'luxury') ? 0.1 : 0),
  },
  sunset: { label: 'Sunset experience', accepts: (e) => e.subcategory === 'sunset' },
  'special-dinner': {
    label: 'Celebration dinner',
    accepts: (e) => e.category === 'restaurant' && at(e, 'evening'),
    boost: (e) => (has(e, 'romantic') ? 0.2 : 0) + (has(e, 'luxury') ? 0.2 : 0) + (e.contexts.includes('birthday') ? 0.1 : 0),
  },
  class: { label: 'Hands-on experience', accepts: (e) => ['class', 'workshop', 'tasting'].includes(e.subcategory), boost: (e) => (e.subcategory === 'class' ? 0.1 : 0) },
  'hidden-tour': {
    label: 'Hidden Rome',
    optional: true,
    accepts: (e) => ['tour', 'experience', 'attraction'].includes(e.category) && e.localness >= 0.6 && at(e, 'afternoon') && e.subcategory !== 'class',
    boost: (e) => (has(e, 'hidden-gems') ? 0.1 : 0),
  },
  cocktail: { label: 'Evening drinks', accepts: (e) => e.category === 'nightlife' && at(e, 'evening', 'night') },
  nightcap: { label: 'Nightcap', optional: true, accepts: (e) => e.category === 'nightlife' && at(e, 'night') },
};

type Template = [SlotKind, string][];
const ARRIVAL: Template = [['arrival-walk', '17:00'], ['dinner', '19:30']];
const FULL: Template = [['morning-culture', '09:30'], ['lunch', '13:00'], ['afternoon', '17:00'], ['rooftop-dinner', '20:30']];
const OCCASION: Template = [['breakfast', '10:00'], ['private-culture', '14:00'], ['sunset', '18:00'], ['special-dinner', '21:00']];
const LAST: Template = [['class', '11:00'], ['hidden-tour', '16:00'], ['cocktail', '20:00']];

const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10);

function templateFor(i: number, n: number, date: string, p: TravelerProfile, pace: number): Template {
  let t: Template =
    i === 0 ? ARRIVAL
      : date === p.occasionDate || (!p.occasionDate && (p.tripType === 'birthday' || p.tripType === 'romantic') && i === Math.min(2, n - 1)) ? OCCASION
        : i === n - 1 && n > 2 ? LAST
          : FULL;
  const level = paceLabel(pace);
  if (level === 'relaxed') t = t.filter(([k]) => !SLOT_SPECS[k].optional);
  if (level === 'packed' && t === FULL) t = [...t, ['nightcap', '22:30']];
  return t;
}

// ─── Builder ──────────────────────────────────────────────────────────────────
export interface BuildInput {
  profile: TravelerProfile;
  stay: Accommodation | null;
  experiences: Experience[];
  constraints: ItineraryConstraints;
  bookedIds?: string[];
  dismissedIds?: string[];
  version?: number;
}

export const EMPTY_CONSTRAINTS: ItineraryConstraints = { excludeSubcategories: [], excludeTags: [], romanceBoost: 0, occasionBoost: 0, localBoost: 0, pinned: {}, banned: [] };

interface Candidate { e: Experience; sel: number; item: Omit<ItineraryItem, 'key' | 'date' | 'time' | 'slot' | 'slotLabel'> }

function allowed(e: Experience, c: ItineraryConstraints, dismissed: string[]) {
  return !c.banned.includes(e.id) && !dismissed.includes(e.id) && !c.excludeSubcategories.includes(e.subcategory) && !e.tags.some((t) => c.excludeTags.includes(t));
}

export function candidatesFor(slot: SlotKind, isOccasion: boolean, input: BuildInput): Candidate[] {
  const { profile, stay, experiences, constraints: c } = input;
  const spec = SLOT_SPECS[slot];
  const origin = stay ?? CITY_CENTER;
  return experiences
    .filter((e) => spec.accepts(e) && allowed(e, c, input.dismissedIds ?? []))
    .map((e) => {
      const m = matchExperience(e, profile, { origin, constraints: c });
      const romance = (has(e, 'romantic') ? c.romanceBoost * (isOccasion ? 1 : 0.5) : 0) +
        (isOccasion ? (c.occasionBoost ?? 0) * ((has(e, 'romantic') ? 1 : 0) + (has(e, 'luxury') ? 0.5 : 0)) : 0);
      const local = c.localBoost * (e.localness - 0.5);
      const walkBias = slot === 'arrival-walk' ? -m.walkMinutes / 30 : -Math.max(0, m.walkMinutes - 15) / (slot === 'morning-culture' ? 120 : 50);
      const sel = m.score / 100 + (spec.boost?.(e) ?? 0) + romance + local + walkBias;
      return { e, sel, item: { experienceId: e.id, walkMinutes: m.walkMinutes, match: { score: m.score, breakdown: m.breakdown, reasons: m.reasons } } };
    })
    .sort((a, b) => b.sel - a.sel);
}

/** What a stop costs against the experience budget (walk-in dining is paid at the venue). */
export const cost = (e: Experience) => (e.bookable ? e.price : 0);

interface SlotPlan { date: string; time: string; slot: SlotKind; key: string; isOccasion: boolean; pool: Candidate[] }

/**
 * Value-weighted assembly. Each slot picks the candidate maximising
 *   selection − λ · price/100 (λ is softened ×0.1 on the occasion day, so it is the last place we economise)
 * and λ is found by bisection: the smallest price-sensitivity that fits the budget.
 * Deterministic, explainable ("we traded the least match per euro saved") and budget-aware.
 */
export function buildItinerary(input: BuildInput): Itinerary {
  const { profile, constraints: c } = input;
  const n = tripDays(profile);
  const pace = c.paceOverride ?? profile.pace;
  const booked = new Set(input.bookedIds ?? []);
  const budget = c.budgetOverride ?? profile.totalBudget;

  const plans: SlotPlan[] = [];
  const dayMeta: { date: string; isOccasion: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(profile.startDate, i);
    const tpl = templateFor(i, n, date, profile, pace);
    const isOccasion = tpl[0]?.[0] === 'breakfast';
    dayMeta.push({ date, isOccasion });
    for (const [slot, time] of tpl) plans.push({ date, time, slot, key: `${date}|${slot}`, isOccasion, pool: candidatesFor(slot, isOccasion, input) });
  }
  // Fill the occasion day and the evenings first so they get first pick of the best venues.
  const order = [...plans].sort((a, b) => Number(b.isOccasion) - Number(a.isOccasion));

  const assemble = (lambda: number, dropped: Set<string>) => {
    const used = new Set<string>(Object.values(c.pinned));
    const chosen = new Map<string, Candidate>();
    const subsByDay = new Map<string, Set<string>>();
    for (const p of order) {
      if (dropped.has(p.key)) continue;
      const subs = subsByDay.get(p.date) ?? new Set<string>();
      const pinnedId = c.pinned[p.key];
      let pick = pinnedId ? p.pool.find((x) => x.e.id === pinnedId) : undefined;
      if (!pick) {
        let best = -Infinity;
        for (const x of p.pool) {
          if (used.has(x.e.id)) continue;
          const v = x.sel - (subs.has(x.e.subcategory) ? 0.15 : 0) - lambda * (p.isOccasion ? 0.1 : 1) * (cost(x.e) / 100);
          if (v > best) { best = v; pick = x; }
        }
      }
      if (!pick) continue;
      used.add(pick.e.id);
      subs.add(pick.e.subcategory);
      subsByDay.set(p.date, subs);
      chosen.set(p.key, pick);
    }
    const total = [...chosen.values()].reduce((s, x) => s + cost(x.e), 0);
    return { chosen, total };
  };

  const dropped = new Set<string>();
  let result = assemble(0, dropped);
  if (result.total > budget) {
    // drop optional slots if even maximum thrift cannot fit
    const optional = plans.filter((p) => SLOT_SPECS[p.slot].optional && !c.pinned[p.key]);
    while (assemble(8, dropped).total > budget && optional.length) dropped.add(optional.shift()!.key);
    let lo = 0, hi = 8;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (assemble(mid, dropped).total > budget) lo = mid; else hi = mid;
    }
    result = assemble(hi, dropped);
  }

  const days: ItineraryDay[] = dayMeta.map(({ date, isOccasion }) => ({
    date, title: '', isOccasion,
    items: plans
      .filter((p) => p.date === date && result.chosen.has(p.key))
      .map((p) => {
        const x = result.chosen.get(p.key)!;
        return { key: p.key, date, time: p.time, slot: p.slot, slotLabel: SLOT_SPECS[p.slot].label, ...x.item, booked: booked.has(x.e.id) };
      }),
  }));

  days.forEach((d, i) => (d.title = dayTitle(d, input.experiences, profile, i)));
  const diningEstimate = [...result.chosen.values()].reduce((s, x) => s + (x.e.bookable ? 0 : x.e.price), 0);
  return { stayId: input.stay?.id ?? '', days, total: result.total, diningEstimate, budget, overBudget: result.total > budget, version: input.version ?? 1 };
}

function dayTitle(d: ItineraryDay, exps: Experience[], p: TravelerProfile, i: number) {
  if (i === 0) return 'Arrival';
  if (d.isOccasion) return p.tripType === 'birthday' ? 'Birthday experience' : 'The big day';
  const counts = new Map<Interest, number>();
  for (const it of d.items) for (const t of exps.find((e) => e.id === it.experienceId)?.tags ?? []) {
    if (t === 'romantic' || t === 'hidden-gems' || t === 'culture') continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => INTEREST_PHRASE[t]);
  return top.length ? top.map((s) => s[0].toUpperCase() + s.slice(1)).join(' & ') : 'Explore';
}

// ─── Alternatives & diffs ─────────────────────────────────────────────────────
export function alternativesFor(itinerary: Itinerary, key: string, input: BuildInput, count = 3) {
  const item = itinerary.days.flatMap((d) => d.items).find((it) => it.key === key);
  if (!item) return [];
  const day = itinerary.days.find((d) => d.items.includes(item))!;
  const inUse = new Set(itinerary.days.flatMap((d) => d.items.map((i) => i.experienceId)));
  const current = input.experiences.find((e) => e.id === item.experienceId)!;
  return candidatesFor(item.slot, day.isOccasion, input)
    .filter((x) => !inUse.has(x.e.id))
    .slice(0, count)
    .map((x) => {
      const notes: string[] = [];
      const d = cost(current) - cost(x.e);
      if (d > 0) notes.push(`€${d} cheaper`);
      if (d < 0) notes.push(`€${-d} more`);
      if (x.e.localness - current.localness >= 0.2) notes.push('more local');
      if (has(x.e, 'romantic') && !has(current, 'romantic')) notes.push('more romantic');
      if (item.walkMinutes - x.item.walkMinutes >= 3) notes.push(`${item.walkMinutes - x.item.walkMinutes} min closer`);
      if (x.e.rating > current.rating) notes.push(`higher rated (${x.e.rating})`);
      return { experienceId: x.e.id, match: x.item.match, walkMinutes: x.item.walkMinutes, notes };
    });
}

export interface ItineraryChange { date: string; time: string; slotLabel: string; from?: string; to?: string }

export function diffItineraries(a: Itinerary | null, b: Itinerary): ItineraryChange[] {
  if (!a) return [];
  const before = new Map(a.days.flatMap((d) => d.items).map((i) => [i.key, i]));
  const after = new Map(b.days.flatMap((d) => d.items).map((i) => [i.key, i]));
  const changes: ItineraryChange[] = [];
  for (const [key, it] of after) {
    const prev = before.get(key);
    if (!prev || prev.experienceId !== it.experienceId) changes.push({ date: it.date, time: it.time, slotLabel: it.slotLabel, from: prev?.experienceId, to: it.experienceId });
  }
  for (const [key, it] of before) if (!after.has(key)) changes.push({ date: it.date, time: it.time, slotLabel: it.slotLabel, from: it.experienceId });
  return changes.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
}
