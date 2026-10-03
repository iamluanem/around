import { NextResponse } from 'next/server';
import { INTERACTION_TYPES, type Interaction } from '@/domain/types';
import { eventRepository } from '@/repositories';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const items = (Array.isArray(body.items) ? body.items : []).filter((i: Interaction) => INTERACTION_TYPES.includes(i?.type)).slice(0, 50);
  await eventRepository.recordInteractions(items);
  return NextResponse.json({ ok: true, recorded: items.length });
}
