import type { TravelerProfile } from './types';

/** The single demo persona the whole product story is told through. */
export const DEMO_PROFILE: TravelerProfile = {
  tripType: 'birthday',
  travelers: 2,
  interests: ['food', 'wine', 'culture', 'romantic', 'hidden-gems'],
  style: 'food-lover',
  budgetPerDay: 125,
  totalBudget: 500,
  pace: 50,
  discoveryStyle: 'local',
  destination: 'Rome',
  startDate: '2026-10-20',
  endDate: '2026-10-24',
  occasion: '30th birthday',
  occasionDate: '2026-10-22',
  affinities: {},
};

export const DEMO_REQUEST =
  "I'm staying in Rome from October 20–24. It's my 30th birthday. I'm traveling with my partner. I love good food, wine and beautiful places. I want my birthday to be special. Budget around €500 for experiences.";
