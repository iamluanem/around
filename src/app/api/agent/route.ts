import { NextResponse } from 'next/server';
import { getAIProvider } from '@/providers/ai';
import type { AgentAction } from '@/providers/ai/types';
import { executeActions } from '@/services/agent/executor';
import { contextFromBody } from '@/services/context';

const DIRECT: AgentAction['type'][] = ['swap', 'alternatives', 'bundle', 'summary', 'reset'];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ctx = await contextFromBody(body);
  const ai = getAIProvider();
  // UI buttons send structured actions; free text goes through the AI planner.
  if (body.action && DIRECT.includes(body.action.type)) return NextResponse.json({ ...executeActions(ctx, [body.action]), provider: 'direct' });
  if (typeof body.message !== 'string' || !body.message.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });
  const result = await ai.modifyItinerary(ctx, body.message.slice(0, 500));
  return NextResponse.json({ ...result, provider: ai.name });
}
