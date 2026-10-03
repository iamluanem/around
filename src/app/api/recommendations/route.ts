import { NextResponse } from 'next/server';
import { matchStay, rankExperiences } from '@/domain/recommendation/engine';
import { contextFromBody } from '@/services/context';

/** POST { profile, stayId? } → explainable stay matches + top experiences. */
export async function POST(req: Request) {
  const ctx = await contextFromBody(await req.json().catch(() => ({})));
  const stays = ctx.catalog.accommodations
    .map((s) => ({ id: s.id, title: s.title, ...matchStay(s, ctx.catalog.experiences, ctx.profile) }))
    .sort((a, b) => b.score - a.score);
  const origin = ctx.catalog.accommodations.find((a) => a.id === ctx.stayId);
  const experiences = rankExperiences(ctx.catalog.experiences, ctx.profile, { origin, dismissed: ctx.dismissedIds })
    .slice(0, 20)
    .map((r) => ({ id: r.experience.id, name: r.experience.name, walkMinutes: r.walkMinutes, ...r.match }));
  return NextResponse.json({ stays, experiences });
}
