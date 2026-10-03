import { alternativesFor, buildItinerary, type BuildInput } from '@/domain/itinerary/builder';
import { createBundle as priceBundle } from '@/domain/bundles/pricing';
import { CITY_CENTER, rankExperiences as rank } from '@/domain/recommendation/engine';
import type { Experience, ExperienceCategory, Interest, Itinerary, ItineraryConstraints, TravelerProfile } from '@/domain/types';
import { maps } from '@/providers/maps';
import type { AgentContext, ToolCall } from '@/providers/ai/types';

/**
 * The agent's tool belt. Each tool is a plain, deterministic function over the domain,
 * so an LLM can call them via function-calling and every call can later be backed by
 * a real API (inventory, availability, maps, payments) without touching the UI.
 */
export class AgentToolkit {
  readonly calls: ToolCall[] = [];
  constructor(private ctx: AgentContext) {}

  private log(tool: string, args: Record<string, unknown>, summary: string) { this.calls.push({ tool, args, summary }); }

  get stay() { return this.ctx.catalog.accommodations.find((a) => a.id === this.ctx.stayId) ?? null; }
  experience(id: string) { return this.ctx.catalog.experiences.find((e) => e.id === id); }

  getTravelerProfile(): TravelerProfile {
    const p = this.ctx.profile;
    this.log('getTravelerProfile', {}, `${p.tripType} · ${p.travelers} travelers · ${p.interests.join(', ')} · €${p.totalBudget}`);
    return p;
  }

  searchExperiences(q: { categories?: ExperienceCategory[]; tags?: Interest[]; maxPrice?: number; text?: string }): Experience[] {
    const text = q.text?.toLowerCase();
    const res = this.ctx.catalog.experiences.filter((e) =>
      (!q.categories?.length || q.categories.includes(e.category)) &&
      (!q.tags?.length || q.tags.some((t) => e.tags.includes(t))) &&
      (q.maxPrice === undefined || e.price <= q.maxPrice) &&
      (!text || e.name.toLowerCase().includes(text) || e.subcategory.includes(text)));
    this.log('searchExperiences', q, `${res.length} results`);
    return res;
  }

  rankExperiences(items: Experience[], constraints?: ItineraryConstraints) {
    const ranked = rank(items, this.ctx.profile, { origin: this.stay ?? CITY_CENTER, constraints, dismissed: this.ctx.dismissedIds });
    this.log('rankExperiences', { n: items.length }, ranked[0] ? `top: ${ranked[0].experience.name} (${ranked[0].match.score}%)` : 'no candidates');
    return ranked;
  }

  calculateDistance(fromId: string, toId: string) {
    const from = this.ctx.catalog.accommodations.find((a) => a.id === fromId) ?? this.experience(fromId);
    const to = this.experience(toId);
    if (!from || !to) return null;
    const minutes = maps.walkingMinutes(from, to);
    this.log('calculateDistance', { fromId, toId }, `${minutes} min walk`);
    return { km: Math.round(maps.distanceKm(from, to) * 10) / 10, minutes };
  }

  checkBudget(it: Itinerary) {
    const remaining = it.budget - it.total;
    this.log('checkBudget', { budget: it.budget }, `€${it.total} of €${it.budget} (${remaining >= 0 ? `€${remaining} left` : `€${-remaining} over`})`);
    return { total: it.total, budget: it.budget, remaining };
  }

  private input(constraints: ItineraryConstraints, profile = this.ctx.profile): BuildInput {
    return {
      profile, stay: this.stay, experiences: this.ctx.catalog.experiences, constraints,
      bookedIds: this.ctx.bookedIds, dismissedIds: this.ctx.dismissedIds, version: (this.ctx.itinerary?.version ?? 0) + 1,
    };
  }

  buildItinerary(constraints: ItineraryConstraints, profile = this.ctx.profile): Itinerary {
    // Booked experiences are locked into their current slots.
    const pinned = { ...constraints.pinned };
    for (const it of this.ctx.itinerary?.days.flatMap((d) => d.items) ?? []) if (this.ctx.bookedIds.includes(it.experienceId)) pinned[it.key] = it.experienceId;
    const itinerary = buildItinerary(this.input({ ...constraints, pinned }, profile));
    const n = itinerary.days.reduce((s, d) => s + d.items.length, 0);
    this.log('buildItinerary', { budget: itinerary.budget, romanceBoost: constraints.romanceBoost, localBoost: constraints.localBoost, exclude: [...constraints.excludeSubcategories, ...constraints.excludeTags] }, `${itinerary.days.length} days · ${n} stops · €${itinerary.total}`);
    return itinerary;
  }

  replaceExperience(it: Itinerary, key: string, constraints: ItineraryConstraints) {
    const options = alternativesFor(it, key, this.input(constraints));
    this.log('replaceExperience', { slot: key }, `${options.length} alternatives`);
    return options;
  }

  createBundle(it: Itinerary, name: string) {
    const exps = it.days.flatMap((d) => d.items).map((i) => this.experience(i.experienceId)).filter((e): e is Experience => !!e && e.bookable && !this.ctx.bookedIds.includes(e.id));
    const bundle = priceBundle(name, exps.map((e) => ({ experienceId: e.id, name: e.name, price: e.price })), new Set(exps.map((e) => e.category)).size);
    this.log('createBundle', { items: bundle.lines.length }, `€${bundle.subtotal} → €${bundle.total} (−${Math.round(bundle.discountRate * 100)}%)`);
    return bundle;
  }
}
