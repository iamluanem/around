import { NextResponse } from 'next/server';
import { getAIProvider } from '@/providers/ai';
import { contextFromBody } from '@/services/context';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ctx = await contextFromBody(body);
  const ai = getAIProvider();
  const result = await ai.generateItinerary({ ...ctx, itinerary: null }, typeof body.request === 'string' ? body.request : undefined);
  return NextResponse.json({ ...result, provider: ai.name });
}
