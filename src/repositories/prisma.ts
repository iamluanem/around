/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Accommodation, Booking, Experience, Interaction } from '@/domain/types';
import type { CatalogRepository, EventRepository } from './types';

// The Prisma client is loaded lazily so the zero-setup demo never needs a database.
let client: any;
async function db() {
  if (!client) {
    const { PrismaClient } = (await import('@prisma/client')) as any;
    client = new PrismaClient();
  }
  return client;
}

const toExperience = (r: any): Experience => ({ ...r, category: r.categoryId });

export class PrismaCatalogRepository implements CatalogRepository {
  async listAccommodations() { return (await (await db()).accommodation.findMany()) as Accommodation[]; }
  async getAccommodation(id: string) { return (await (await db()).accommodation.findUnique({ where: { id } })) as Accommodation | null; }
  async listExperiences() { return ((await (await db()).experience.findMany()) as any[]).map(toExperience); }
  async getExperience(id: string) { const r = await (await db()).experience.findUnique({ where: { id } }); return r ? toExperience(r) : null; }
  async listProviders() { return (await db()).experienceProvider.findMany(); }
  async getCatalog() { const [accommodations, experiences] = await Promise.all([this.listAccommodations(), this.listExperiences()]); return { accommodations, experiences }; }
}

export class PrismaEventRepository implements EventRepository {
  async recordInteractions(items: Interaction[]) {
    await (await db()).interaction.createMany({ data: items.map((i) => ({ type: i.type, targetType: i.targetType, targetId: i.targetId, tags: i.tags, createdAt: new Date(i.at) })) });
  }
  async recordBooking(b: Booking) {
    await (await db()).booking.create({ data: { kind: b.kind, refIds: b.refIds, label: b.label, amount: b.amount, currency: b.currency, confirmation: b.confirmation, createdAt: new Date(b.createdAt) } });
  }
  async listInteractions() {
    const rows = await (await db()).interaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 });
    return rows.map((r: any) => ({ id: r.id, type: r.type, targetType: r.targetType, targetId: r.targetId, tags: r.tags, at: r.createdAt.toISOString() }));
  }
  async listBookings() {
    const rows = await (await db()).booking.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
    return rows.map((r: any) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }
}
