import { ACCOMMODATIONS, EXPERIENCES, PROVIDERS } from '@/data/rome';
import type { Booking, Interaction } from '@/domain/types';
import type { CatalogRepository, EventRepository } from './types';

export class InMemoryCatalogRepository implements CatalogRepository {
  async listAccommodations() { return ACCOMMODATIONS; }
  async getAccommodation(id: string) { return ACCOMMODATIONS.find((a) => a.id === id) ?? null; }
  async listExperiences() { return EXPERIENCES; }
  async getExperience(id: string) { return EXPERIENCES.find((e) => e.id === id) ?? null; }
  async listProviders() { return PROVIDERS; }
  async getCatalog() { return { accommodations: ACCOMMODATIONS, experiences: EXPERIENCES }; }
}

// Survives hot reloads in dev; resets on server restart (demo only).
const g = globalThis as unknown as { __aroundEvents?: { interactions: Interaction[]; bookings: Booking[] } };
const store = (g.__aroundEvents ??= { interactions: [], bookings: [] });

export class InMemoryEventRepository implements EventRepository {
  async recordInteractions(items: Interaction[]) { store.interactions.push(...items); if (store.interactions.length > 5000) store.interactions.splice(0, 1000); }
  async recordBooking(b: Booking) { store.bookings.push(b); }
  async listInteractions() { return store.interactions; }
  async listBookings() { return store.bookings; }
}
