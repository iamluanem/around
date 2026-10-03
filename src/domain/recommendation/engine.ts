import { INTEREST_PHRASE, STYLE_LABEL, TRIP_TYPE_LABEL } from '../labels';
import type {
  Accommodation, Experience, GeoPoint, Interest, ItineraryConstraints, MatchResult, Recommendation,
  ScoreBreakdown, StayMatch, TravelStyle, TravelerProfile,
} from '../types';
import { clamp01, weightedScore } from './weights';
import { maps } from '@/providers/maps';

/**
 * Explainable recommendation engine.
 * Every score is a deterministic function of the traveler profile, the item and geography.
 * score = interest·0.30 + budget·0.20 + location·0.20 + style·0.15 + context·0.10 + quality·0.05
 */

export const CITY_CENTER: GeoPoint = { lat: 41.8986, lng: 12.4769 }; // Pantheon

const RELATED_STYLES: Record<TravelStyle, TravelStyle[]> = {
  'local-explorer': ['food-lover', 'culture-seeker', 'night-explorer'],
  'food-lover': ['local-explorer', 'luxury-traveler'],
  'culture-seeker': ['local-explorer', 'relaxed-traveler'],
  'luxury-traveler': ['relaxed-traveler', 'food-lover'],
  'adventure-seeker': ['local-explorer'],
  'relaxed-traveler': ['luxury-traveler', 'culture-seeker'],
  'night-explorer': ['local-explorer'],
};

export function affinity(profile: TravelerProfile, tag: Interest): number {
  const learned = profile.affinities[tag];
  if (learned !== undefined) return learned;
  return profile.interests.includes(tag) ? 1 : 0;
}

export function tripDays(profile: TravelerProfile): number {
  const d = (Date.parse(profile.endDate) - Date.parse(profile.startDate)) / 86_400_000;
  return Math.max(1, Math.round(d));
}

export function dailyBudget(profile: TravelerProfile): number {
  return Math.max(30, profile.totalBudget / tripDays(profile));
}

// ─── Component scorers ────────────────────────────────────────────────────────
function interestScore(e: Experience, p: TravelerProfile) {
  let pos = 0, neg = 0;
  const matched: Interest[] = [];
  for (const t of e.tags) {
    const a = affinity(p, t);
    if (a > 0) { pos += a; matched.push(t); } else if (a < 0) neg += -a;
  }
  return { value: clamp01(pos / 1.6 - neg * 0.6), matched };
}

function budgetScore(price: number, daily: number) {
  if (price <= 0) return 1;
  const r = price / daily;
  if (r <= 0.5) return 1;
  if (r <= 1) return 1 - (r - 0.5) * 0.6;
  return clamp01(0.7 - (r - 1) * 0.7);
}

function locationScore(minutes: number) {
  if (minutes <= 6) return 1;
  if (minutes <= 30) return 1 - ((minutes - 6) / 24) * 0.8;
  return clamp01(0.2 - (minutes - 30) / 60);
}

function styleScore(e: Experience, p: TravelerProfile, localBoost = 0) {
  const hit = e.styles.includes(p.style) ? 1 : e.styles.some((s) => RELATED_STYLES[p.style].includes(s)) ? 0.55 : 0.15;
  const disc =
    p.discoveryStyle === 'local' ? e.localness
      : p.discoveryStyle === 'highlights' ? 1 - e.localness * 0.7
        : 1 - Math.abs(e.localness - 0.5);
  return clamp01(0.6 * hit + 0.4 * clamp01(disc + localBoost * (e.localness - 0.5)));
}

function contextScore(e: Experience, p: TravelerProfile) {
  let v = e.contexts.includes(p.tripType) ? 1 : 0.3;
  if ((p.tripType === 'birthday' || p.tripType === 'romantic') && e.tags.includes('romantic')) v += 0.2;
  return clamp01(v);
}

function qualityScore(e: { rating: number; reviewCount: number }) {
  const r = clamp01((e.rating - 4.3) / 0.65);
  const volume = clamp01(Math.log10(Math.max(1, e.reviewCount)) / 3);
  return clamp01(r * (0.7 + 0.3 * volume));
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// ─── Experience match ─────────────────────────────────────────────────────────
export interface MatchOptions { origin?: GeoPoint; constraints?: Partial<ItineraryConstraints> }

export function matchExperience(e: Experience, p: TravelerProfile, opts: MatchOptions = {}): MatchResult & { walkMinutes: number } {
  const origin = opts.origin ?? CITY_CENTER;
  const walkMinutes = maps.walkingMinutes(origin, e);
  const daily = opts.constraints?.budgetOverride ? opts.constraints.budgetOverride / tripDays(p) : dailyBudget(p);
  const interest = interestScore(e, p);

  const breakdown: ScoreBreakdown = {
    interest: interest.value,
    budget: budgetScore(e.price, daily),
    location: locationScore(walkMinutes),
    style: styleScore(e, p, opts.constraints?.localBoost ?? 0),
    context: contextScore(e, p),
    quality: qualityScore(e),
  };

  const reasons: string[] = [];
  const liked = interest.matched.filter((t) => t !== 'romantic' && t !== 'hidden-gems');
  if (breakdown.interest >= 0.55 && liked.length) reasons.push(`Matches your love of ${list(liked.slice(0, 2).map((t) => INTEREST_PHRASE[t]))}`);
  if (e.tags.includes('romantic') && affinity(p, 'romantic') > 0) reasons.push('Romantic setting for two');
  if (e.price === 0) reasons.push('Free, so your budget goes to the big moments');
  else if (breakdown.budget >= 0.85) reasons.push(`Within your daily budget (€${e.price} of €${Math.round(daily)})`);
  if (walkMinutes <= 12) reasons.push(`${walkMinutes} min walk from your stay`);
  if (p.discoveryStyle === 'local' && e.localness >= 0.75) reasons.push('A local favourite, off the tourist trail');
  if (e.styles.includes(p.style)) reasons.push(`Fits your ${STYLE_LABEL[p.style]} style`);
  if (e.contexts.includes(p.tripType) && (p.tripType === 'birthday' || p.tripType === 'romantic')) reasons.push(`Great for a ${TRIP_TYPE_LABEL[p.tripType].toLowerCase()} trip`);
  if (breakdown.quality >= 0.8) reasons.push(`Rated ${e.rating.toFixed(2)} by ${e.reviewCount.toLocaleString('en')} guests`);

  return { score: weightedScore(breakdown), breakdown, reasons: reasons.slice(0, 4), walkMinutes };
}

export function rankExperiences(
  experiences: Experience[], p: TravelerProfile, opts: MatchOptions & { dismissed?: string[] } = {},
): Recommendation[] {
  const c = opts.constraints;
  return experiences
    .filter((e) => !opts.dismissed?.includes(e.id))
    .filter((e) => !c?.banned?.includes(e.id))
    .filter((e) => !c?.excludeSubcategories?.includes(e.subcategory))
    .filter((e) => !e.tags.some((t) => c?.excludeTags?.includes(t)))
    .map((e) => {
      const m = matchExperience(e, p, opts);
      return { experience: e, match: m, walkMinutes: m.walkMinutes };
    })
    .sort((a, b) => b.match.score - a.match.score || a.walkMinutes - b.walkMinutes);
}

// ─── Stay match ───────────────────────────────────────────────────────────────
const NEARBY_MIN = 15;

export function matchStay(stay: Accommodation, experiences: Experience[], p: TravelerProfile): StayMatch {
  const ranked = rankExperiences(experiences, p, { origin: stay });
  const top = ranked.slice(0, 10);
  const nearby = ranked.filter((r) => r.walkMinutes <= NEARBY_MIN);
  const avg = (f: (r: Recommendation) => number, xs = top) => xs.reduce((s, r) => s + f(r), 0) / Math.max(1, xs.length);

  // interest coverage: does the neighbourhood serve every interest the traveler cares about?
  const wanted = (Object.keys(INTEREST_PHRASE) as Interest[]).filter((t) => affinity(p, t) > 0);
  const byInterest: Partial<Record<Interest, number>> = {};
  let covW = 0, covS = 0;
  for (const t of wanted) {
    const n = nearby.filter((r) => r.experience.tags.includes(t) && r.experience.rating >= 4.75).length;
    byInterest[t] = n;
    const a = affinity(p, t);
    covW += a;
    covS += a * Math.min(1, n / 3);
  }
  const coverage = covW ? covS / covW : 0;

  const vibeFit = stay.vibes.includes(p.tripType) ? 1
    : (p.tripType === 'birthday' && stay.vibes.includes('romantic')) || (p.tripType === 'romantic' && stay.vibes.includes('birthday')) ? 0.8 : 0.35;

  const breakdown: ScoreBreakdown = {
    interest: clamp01(0.5 * coverage + 0.5 * avg((r) => r.match.breakdown.interest)),
    budget: avg((r) => r.match.breakdown.budget),
    location: clamp01(0.75 * avg((r) => r.match.breakdown.location) + 0.25 * stay.walkability),
    style: avg((r) => r.match.breakdown.style),
    context: clamp01(0.7 * avg((r) => r.match.breakdown.context) + 0.3 * vibeFit),
    quality: clamp01(0.5 * avg((r) => r.match.breakdown.quality) + 0.5 * clamp01((stay.rating - 4.5) / 0.48)),
  };

  const daily = dailyBudget(p);
  const relevant = nearby.filter((r) => r.match.breakdown.interest >= 0.5);
  const facts = {
    nearbyCount: nearby.length,
    highlyRated: nearby.filter((r) => r.experience.rating >= 4.8).length,
    withinBudget: relevant.filter((r) => r.experience.bookable && r.experience.price <= daily).length,
    avgWalk: Math.round(avg((r) => r.walkMinutes)),
    byInterest,
  };

  const reasons: string[] = [];
  const cautions: string[] = [];
  const food = byInterest.food ?? 0;
  if (affinity(p, 'food') > 0 && food >= 4) reasons.push(`Excellent food scene: ${food} top-rated food spots within ${NEARBY_MIN} min`);
  if (facts.highlyRated >= 5) reasons.push(`${facts.highlyRated} highly-rated experiences nearby`);
  if ((p.tripType === 'birthday' || p.tripType === 'romantic') && (byInterest.romantic ?? 0) >= 3) reasons.push('Strong romantic atmosphere');
  if (affinity(p, 'wine') > 0 && (byInterest.wine ?? 0) >= 2) reasons.push(`${byInterest.wine} wine experiences on your doorstep`);
  if (facts.withinBudget >= 4) reasons.push(`${facts.withinBudget} activities within your daily budget`);
  if (facts.avgWalk <= 12) reasons.push(`Walkable: your top picks average ${facts.avgWalk} min on foot`);
  if (p.discoveryStyle === 'local' && (byInterest['hidden-gems'] ?? 0) >= 3) reasons.push(`${byInterest['hidden-gems']} hidden gems & local favourites nearby`);

  for (const t of wanted) if ((byInterest[t] ?? 0) === 0 && t !== 'hidden-gems') cautions.push(`Few ${INTEREST_PHRASE[t]} options within walking distance`);
  if (facts.avgWalk > 18) cautions.push(`Your best matches are ~${facts.avgWalk} min away, expect taxis or transit`);

  const strongest = wanted
    .filter((t) => (byInterest[t] ?? 0) >= 2 && t !== 'hidden-gems')
    .sort((a, b) => affinity(p, b) - affinity(p, a) || p.interests.indexOf(a) - p.interests.indexOf(b))
    .slice(0, 3)
    .map((t) => INTEREST_PHRASE[t]);
  const score = weightedScore(breakdown);
  const headline = strongest.length
    ? `${score >= 85 ? 'Great' : score >= 70 ? 'Good' : 'Partial'} match for ${list(strongest)} experiences.`
    : 'Limited match for your interests.';

  return { score, breakdown, reasons: reasons.slice(0, 6), cautions: cautions.slice(0, 2), headline, facts };
}

// ─── Preference learning ──────────────────────────────────────────────────────
export const INTERACTION_DELTA = { VIEW: 0.02, CLICK: 0.06, SAVE: 0.12, LIKE: 0.15, BOOK: 0.2, REPLACE: -0.12, DISMISS: -0.3 } as const;

export function learnAffinities(
  p: TravelerProfile, type: keyof typeof INTERACTION_DELTA, tags: Interest[],
): { affinities: TravelerProfile['affinities']; changes: { tag: Interest; from: number; to: number }[] } {
  const next = { ...p.affinities };
  const changes: { tag: Interest; from: number; to: number }[] = [];
  const d = INTERACTION_DELTA[type];
  for (const t of tags) {
    const from = affinity(p, t);
    const to = Math.round(Math.max(-1, Math.min(2, from + d)) * 100) / 100;
    if (to !== from) { next[t] = to; changes.push({ tag: t, from, to }); }
  }
  return { affinities: next, changes };
}
