import { DEMO_PROFILE } from '@/domain/persona';
import { matchStay, rankExperiences } from '@/domain/recommendation/engine';
import {
  INTERESTS, TRAVEL_STYLES, TRIP_TYPES, type Booking, type Catalog, type DiscoveryStyle, type Experience, type Interaction,
  type Interest, type TravelerProfile,
} from '@/domain/types';

/**
 * Simulated cohort for the demo dashboard.
 * Travelers are synthetic but every Experience Match is computed by the real engine.
 * The behavioural response curves below are HYPOTHESES to be validated by A/B testing, not observed data.
 */
export const HYPOTHESES = {
  stayConversion: 'P(book stay) = 4% + 20% · ((match − 55) / 45)^1.5',
  attach: 'P(attach experiences | booked) = 15% + 50% · (match / 100)^3',
  ctr: 'CTR = 3% + 12% · (avg top-12 match / 100)^2',
  bundle: 'P(bundle | ≥2 experiences) = 35%',
};

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bucketOf = (score: number) => { const lo = Math.max(50, Math.min(90, Math.floor(score / 10) * 10)); return `${lo}–${lo + 10}`; };
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

export interface AnalyticsReport {
  cohortSize: number;
  kpis: {
    stayConversion: number; stayConversionControl: number; attachRate: number; avgExperienceOrderValue: number;
    bundleConversion: number; recommendationCTR: number; gmvPerTraveler: number; gmvPerTravelerControl: number;
  };
  matchVsConversion: { bucket: string; views: number; bookings: number; rate: number }[];
  topInterests: { label: Interest; count: number }[];
  topCategories: { label: string; count: number }[];
  neighborhoods: { label: string; bookings: number; views: number }[];
  hypotheses: typeof HYPOTHESES;
  live: { interactions: Record<string, number>; bookings: number; gmv: number };
}

let cache: { key: string; report: Omit<AnalyticsReport, 'live'> } | null = null;

export function simulateCohort(catalog: Catalog, n = 360): Omit<AnalyticsReport, 'live'> {
  const key = `${catalog.accommodations.length}:${catalog.experiences.length}:${n}`;
  if (cache?.key === key) return cache.report;
  const r = rng(20261020);
  const discovery: DiscoveryStyle[] = ['highlights', 'balanced', 'local'];
  const budgets = [50, 100, 150, 250];

  let stayBookings = 0, stayBookingsControl = 0, attached = 0, expRevenue = 0, expOrders = 0, multi = 0, bundles = 0;
  let impressions = 0, clicks = 0, gmv = 0, gmvControl = 0;
  const buckets = new Map<string, { views: number; bookings: number }>();
  const interestCount = new Map<Interest, number>();
  const categoryCount = new Map<string, number>();
  const hoods = new Map<string, { bookings: number; views: number }>();

  for (let i = 0; i < n; i++) {
    const interests = [...new Set(Array.from({ length: 2 + Math.floor(r() * 3) }, () => pick(r, INTERESTS)))];
    interests.forEach((t) => interestCount.set(t, (interestCount.get(t) ?? 0) + 1));
    const perDay = pick(r, budgets);
    const p: TravelerProfile = {
      ...DEMO_PROFILE, tripType: pick(r, TRIP_TYPES), interests, style: pick(r, TRAVEL_STYLES), discoveryStyle: pick(r, discovery),
      budgetPerDay: perDay, totalBudget: perDay * 4, pace: Math.floor(r() * 100), affinities: {}, occasionDate: undefined,
    };
    const scored = catalog.accommodations.map((s) => ({ s, m: matchStay(s, catalog.experiences, p) }));

    const book = (list: typeof scored) => {
      for (const { s, m } of list.slice(0, 3)) {
        if (r() < 0.04 + 0.2 * Math.pow(Math.max(0, (m.score - 55) / 45), 1.5)) return { s, m, b: bucketOf(m.score), hit: true };
      }
      return null;
    };

    // Treatment: stays ranked by Experience Match. Control: ranked by rating only.
    const treatment = [...scored].sort((a, b) => b.m.score - a.m.score);
    const control = [...scored].sort((a, b) => b.s.rating - a.s.rating);
    for (const { s, m } of treatment.slice(0, 3)) {
      const b = bucketOf(m.score);
      const row = buckets.get(b) ?? { views: 0, bookings: 0 };
      row.views++; buckets.set(b, row);
      const h = hoods.get(s.neighborhood) ?? { bookings: 0, views: 0 };
      h.views++; hoods.set(s.neighborhood, h);
    }
    const t = book(treatment);
    const c = book(control);
    if (c?.hit) { stayBookingsControl++; gmvControl += c.s.nightlyPrice * 4; }

    if (t?.hit) {
      stayBookings++;
      buckets.get(t.b)!.bookings++;
      hoods.get(t.s.neighborhood)!.bookings++;
      gmv += t.s.nightlyPrice * 4;
      if (r() < 0.15 + 0.5 * Math.pow(t.m.score / 100, 3)) {
        attached++;
        const recs = rankExperiences(catalog.experiences, p, { origin: t.s }).filter((x) => x.experience.bookable).slice(0, 6);
        const k = 1 + Math.floor(r() * 4);
        const chosen: Experience[] = recs.slice(0, k).map((x) => x.experience);
        let order = chosen.reduce((s, e) => s + e.price, 0);
        chosen.forEach((e) => categoryCount.set(e.category, (categoryCount.get(e.category) ?? 0) + 1));
        if (k >= 2) { multi++; if (r() < 0.35) { bundles++; order = Math.round(order * 0.88); } }
        expRevenue += order; expOrders++; gmv += order;
      }
    }

    const top = rankExperiences(catalog.experiences, p, { origin: (t ?? treatment[0]).s }).slice(0, 12);
    const avg = top.reduce((s, x) => s + x.match.score, 0) / top.length;
    impressions += 12;
    clicks += 12 * (0.03 + 0.12 * Math.pow(avg / 100, 2));
  }

  const report = {
    cohortSize: n,
    kpis: {
      stayConversion: stayBookings / n,
      stayConversionControl: stayBookingsControl / n,
      attachRate: stayBookings ? attached / stayBookings : 0,
      avgExperienceOrderValue: expOrders ? Math.round(expRevenue / expOrders) : 0,
      bundleConversion: multi ? bundles / multi : 0,
      recommendationCTR: clicks / impressions,
      gmvPerTraveler: Math.round(gmv / n),
      gmvPerTravelerControl: Math.round(gmvControl / n),
    },
    matchVsConversion: [...buckets.entries()]
      .map(([bucket, v]) => ({ bucket, ...v, rate: v.views ? v.bookings / v.views : 0 }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket)),
    topInterests: [...interestCount.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    topCategories: [...categoryCount.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    neighborhoods: [...hoods.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.bookings - a.bookings),
    hypotheses: HYPOTHESES,
  };
  cache = { key, report };
  return report;
}

export function liveSummary(interactions: Interaction[], bookings: Booking[]): AnalyticsReport['live'] {
  const counts: Record<string, number> = {};
  for (const i of interactions) counts[i.type] = (counts[i.type] ?? 0) + 1;
  return { interactions: counts, bookings: bookings.length, gmv: bookings.reduce((s, b) => s + b.amount, 0) };
}
