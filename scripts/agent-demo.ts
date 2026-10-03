import { ACCOMMODATIONS, EXPERIENCES } from '../src/data/rome';
import { DEMO_PROFILE, DEMO_REQUEST } from '../src/domain/persona';
import { EMPTY_CONSTRAINTS } from '../src/domain/itinerary/builder';
import { MockAIProvider } from '../src/providers/ai/mock';
import type { AgentContext } from '../src/providers/ai/types';
import type { Itinerary } from '../src/domain/types';

const name = (id: string) => EXPERIENCES.find((e) => e.id === id)!;
const print = (it: Itinerary) => {
  for (const d of it.days) {
    console.log(`  ${d.date} — ${d.title}`);
    for (const i of d.items) { const e = name(i.experienceId); console.log(`    ${i.time} ${i.slotLabel.padEnd(28)} ${e.name} €${e.price} (${i.match.score}%, ${i.walkMinutes}m)`); }
  }
  console.log(`  total €${it.total} / €${it.budget}`);
};

(async () => {
  const ai = new MockAIProvider();
  let ctx: AgentContext = { catalog: { accommodations: ACCOMMODATIONS, experiences: EXPERIENCES }, profile: DEMO_PROFILE, stayId: 'stay-monti-loft', itinerary: null, constraints: EMPTY_CONSTRAINTS, bookedIds: [], dismissedIds: [] };
  const g = await ai.generateItinerary(ctx, DEMO_REQUEST);
  console.log(g.narrative); print(g.itinerary);
  ctx = { ...ctx, itinerary: g.itinerary, profile: g.profile };
  for (const msg of ['Make my birthday more romantic.', "I don't like museums.", 'I want to spend less than €400.', 'Give me more local experiences.', 'Replace the restaurant.', 'book it all as a bundle']) {
    const r = await ai.modifyItinerary(ctx, msg);
    console.log('\n>', msg, '\n ', r.reply);
    console.log('  tools:', r.toolCalls.map((t) => t.tool).join(' → '));
    r.changes?.forEach((c) => console.log(`   Δ ${c.date} ${c.time} ${c.from ? name(c.from).name : '—'} → ${c.to ? name(c.to).name : '—'}`));
    r.alternatives?.options.forEach((o) => console.log(`   alt: ${name(o.experienceId).name} ${o.match.score}% ${o.notes.join(', ')}`));
    if (r.bundle) console.log('   bundle', r.bundle.subtotal, r.bundle.total, r.bundle.discountRate);
    ctx = { ...ctx, itinerary: r.itinerary ?? ctx.itinerary, constraints: r.constraints ?? ctx.constraints, profile: r.profile ?? ctx.profile };
  }
})();
