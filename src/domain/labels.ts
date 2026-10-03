import type { DiscoveryStyle, ExperienceCategory, Interest, TravelStyle, TripType } from './types';

export const INTEREST_LABEL: Record<Interest, string> = {
  food: 'Food', wine: 'Wine', history: 'History', art: 'Art', nightlife: 'Nightlife', shopping: 'Shopping',
  nature: 'Nature', adventure: 'Adventure', wellness: 'Wellness', music: 'Music', culture: 'Local culture',
  'hidden-gems': 'Hidden gems', luxury: 'Luxury experiences', sports: 'Sports', romantic: 'Romantic moments',
};

/** lower-case phrasing used inside sentences */
export const INTEREST_PHRASE: Record<Interest, string> = {
  food: 'food', wine: 'wine', history: 'history', art: 'art', nightlife: 'nightlife', shopping: 'shopping',
  nature: 'nature', adventure: 'adventure', wellness: 'wellness', music: 'music', culture: 'culture',
  'hidden-gems': 'hidden gems', luxury: 'luxury', sports: 'sports', romantic: 'romantic',
};

export const TRIP_TYPE_LABEL: Record<TripType, string> = {
  romantic: 'Romantic', birthday: 'Birthday', friends: 'Friends', family: 'Family', solo: 'Solo',
  business: 'Business', adventure: 'Adventure', relaxation: 'Relaxation',
};

export const STYLE_LABEL: Record<TravelStyle, string> = {
  'local-explorer': 'Local Explorer', 'food-lover': 'Food Lover', 'culture-seeker': 'Culture Seeker',
  'luxury-traveler': 'Luxury Traveler', 'adventure-seeker': 'Adventure Seeker', 'relaxed-traveler': 'Relaxed Traveler',
  'night-explorer': 'Night Explorer',
};

export const DISCOVERY_LABEL: Record<DiscoveryStyle, string> = {
  highlights: 'Tourist highlights', balanced: 'Balanced', local: 'Hidden / local places',
};

export const CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  experience: 'Experience', tour: 'Tour', restaurant: 'Restaurant', cafe: 'Café', nightlife: 'Nightlife',
  attraction: 'Attraction', event: 'Event', walk: 'Walk',
};

export function paceLabel(pace: number): 'relaxed' | 'balanced' | 'packed' {
  return pace < 35 ? 'relaxed' : pace > 70 ? 'packed' : 'balanced';
}
