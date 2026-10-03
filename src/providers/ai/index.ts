import { MockAIProvider } from './mock';
import { OpenAIProvider } from './openai';
import type { AIProvider } from './types';

export function getAIProvider(): AIProvider {
  const key = process.env.OPENAI_API_KEY;
  if (process.env.AI_PROVIDER === 'openai' && key) return new OpenAIProvider(key);
  return new MockAIProvider();
}
export type * from './types';
