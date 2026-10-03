import type { Accommodation, Booking, Catalog, Experience, ExperienceProvider, Interaction } from '@/domain/types';

/** Read side of the marketplace catalogue. */
export interface CatalogRepository {
  listAccommodations(): Promise<Accommodation[]>;
  getAccommodation(id: string): Promise<Accommodation | null>;
  listExperiences(): Promise<Experience[]>;
  getExperience(id: string): Promise<Experience | null>;
  listProviders(): Promise<ExperienceProvider[]>;
  getCatalog(): Promise<Catalog>;
}

/** Write side: behavioural events and bookings. */
export interface EventRepository {
  recordInteractions(items: Interaction[]): Promise<void>;
  recordBooking(b: Booking): Promise<void>;
  listInteractions(): Promise<Interaction[]>;
  listBookings(): Promise<Booking[]>;
}
