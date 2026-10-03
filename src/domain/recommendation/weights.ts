import type { ScoreBreakdown } from '../types';

/** Experience Match weights, must sum to 1. */
export const WEIGHTS: ScoreBreakdown = {
  interest: 0.3,
  budget: 0.2,
  location: 0.2,
  style: 0.15,
  context: 0.1,
  quality: 0.05,
};

export const COMPONENT_LABEL: Record<keyof ScoreBreakdown, string> = {
  interest: 'Interest match',
  budget: 'Budget match',
  location: 'Location match',
  style: 'Travel style match',
  context: 'Trip context match',
  quality: 'Popularity & quality',
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function weightedScore(b: ScoreBreakdown): number {
  const raw =
    b.interest * WEIGHTS.interest +
    b.budget * WEIGHTS.budget +
    b.location * WEIGHTS.location +
    b.style * WEIGHTS.style +
    b.context * WEIGHTS.context +
    b.quality * WEIGHTS.quality;
  return Math.round(clamp01(raw) * 100);
}
