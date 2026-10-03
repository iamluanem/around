import { InMemoryCatalogRepository, InMemoryEventRepository } from './memory';
import { PrismaCatalogRepository, PrismaEventRepository } from './prisma';
import type { CatalogRepository, EventRepository } from './types';

const usePrisma = process.env.DATA_SOURCE === 'prisma' && !!process.env.DATABASE_URL;

export const catalogRepository: CatalogRepository = usePrisma ? new PrismaCatalogRepository() : new InMemoryCatalogRepository();
export const eventRepository: EventRepository = usePrisma ? new PrismaEventRepository() : new InMemoryEventRepository();
export type { CatalogRepository, EventRepository };
