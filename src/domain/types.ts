// ─── Core domain model ────────────────────────────────────────────────────────
// Pure types. No framework, storage or provider concerns live here.

export const INTERESTS = [
  'food', 'wine', 'history', 'art', 'nightlife', 'shopping', 'nature', 'adventure',
  'wellness', 'music', 'culture', 'hidden-gems', 'luxury', 'sports', 'romantic',
] as const;
export type Interest = (typeof INTERESTS)[number];

export const TRIP_TYPES = ['romantic', 'birthday', 'friends', 'family', 'solo', 'business', 'adventure', 'relaxation'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const TRAVEL_STYLES = [
  'local-explorer', 'food-lover', 'culture-seeker', 'luxury-traveler', 'adventure-seeker', 'relaxed-traveler', 'night-explorer',
] as const;
export type TravelStyle = (typeof TRAVEL_STYLES)[number];

export type DiscoveryStyle = 'highlights' | 'balanced' | 'local';
export type TimeOfDay = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export const EXPERIENCE_CATEGORIES = ['experience', 'tour', 'restaurant', 'cafe', 'nightlife', 'attraction', 'event', 'walk'] as const;
export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number];

export interface GeoPoint { lat: number; lng: number }

export interface ExperienceProvider { id: string; name: string; verified: boolean; since: number }

export interface Experience extends GeoPoint {
  id: string;
  name: string;
  category: ExperienceCategory;
  /** finer grain: museum, class, tasting, sunset, rooftop, breakfast, dinner, lunch, cocktails, jazz, private, spa, walk… */
  subcategory: string;
  tags: Interest[];
  /** EUR for the whole party (up to 2 guests). 0 = free. */
  price: number;
  durationMin: number;
  rating: number;
  reviewCount: number;
  neighborhood: string;
  description: string;
  image: string;
  providerId: string;
  /** 0 = iconic tourist highlight, 1 = deeply local / hidden */
  localness: number;
  contexts: TripType[];
  styles: TravelStyle[];
  times: TimeOfDay[];
  bookable: boolean;
}

export interface Accommodation extends GeoPoint {
  id: string;
  title: string;
  type: string;
  neighborhood: string;
  nightlyPrice: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  images: string[];
  description: string;
  host: string;
  vibes: string[];
  maxGuests: number;
  bedrooms: number;
  /** 0..1, pedestrian friendliness of the block */
  walkability: number;
}

export interface TravelerProfile {
  tripType: TripType;
  travelers: number;
  interests: Interest[];
  style: TravelStyle;
  budgetPerDay: number;
  totalBudget: number;
  /** 0 = relaxed … 100 = packed */
  pace: number;
  discoveryStyle: DiscoveryStyle;
  destination: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  occasion?: string;
  occasionDate?: string;
  /** learned weights per interest (0..2). Selected interests start at 1. */
  affinities: Partial<Record<Interest, number>>;
}

export interface ScoreBreakdown {
  interest: number; budget: number; location: number; style: number; context: number; quality: number;
}

export interface MatchResult {
  score: number; // 0..100
  breakdown: ScoreBreakdown; // each 0..1
  reasons: string[];
  headline?: string;
}

export interface Recommendation { experience: Experience; match: MatchResult; walkMinutes: number }

export interface StayFacts {
  nearbyCount: number;
  highlyRated: number;
  withinBudget: number;
  avgWalk: number;
  byInterest: Partial<Record<Interest, number>>;
}

export interface StayMatch extends MatchResult { facts: StayFacts; cautions: string[] }

export const INTERACTION_TYPES = ['VIEW', 'CLICK', 'SAVE', 'DISMISS', 'BOOK', 'REPLACE', 'LIKE'] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export interface Interaction {
  id: string;
  type: InteractionType;
  targetType: 'experience' | 'accommodation' | 'bundle';
  targetId: string;
  tags: Interest[];
  at: string;
}

export type SlotKind =
  | 'arrival-walk' | 'dinner' | 'morning-culture' | 'lunch' | 'afternoon' | 'rooftop-dinner'
  | 'breakfast' | 'private-culture' | 'sunset' | 'special-dinner' | 'class' | 'hidden-tour' | 'cocktail' | 'nightcap';

export interface ItineraryItem {
  key: string; // `${date}|${slot}` – stable identity of a slot
  date: string;
  time: string;
  slot: SlotKind;
  slotLabel: string;
  experienceId: string;
  walkMinutes: number;
  match: MatchResult;
  booked?: boolean;
}

export interface ItineraryDay { date: string; title: string; isOccasion: boolean; items: ItineraryItem[] }

export interface Itinerary {
  stayId: string;
  days: ItineraryDay[];
  /** bookable experiences, counts against the experience budget */
  total: number;
  /** walk-in dining paid at the venue (informational) */
  diningEstimate: number;
  budget: number;
  overBudget: boolean;
  version: number;
}

export interface ItineraryConstraints {
  excludeSubcategories: string[];
  excludeTags: Interest[];
  romanceBoost: number;
  /** extra weight for romantic/luxury picks on the occasion (birthday) day only */
  occasionBoost: number;
  localBoost: number;
  budgetOverride?: number;
  paceOverride?: number;
  /** slot key → experience id, forced by user choice */
  pinned: Record<string, string>;
  /** experience ids the user replaced away or dismissed */
  banned: string[];
}

export interface BundleLine { experienceId: string; name: string; price: number }
export interface Bundle {
  name: string;
  lines: BundleLine[];
  subtotal: number;
  discountRate: number;
  discount: number;
  total: number;
}

export interface Booking {
  id: string;
  kind: 'stay' | 'experience' | 'bundle';
  refIds: string[];
  label: string;
  amount: number;
  currency: 'EUR';
  confirmation: string;
  createdAt: string;
}

export interface Catalog { accommodations: Accommodation[]; experiences: Experience[] }
