import { PrismaClient } from '@prisma/client';
import { ACCOMMODATIONS, EXPERIENCES, PROVIDERS } from '../src/data/rome';
import { CATEGORY_LABEL } from '../src/domain/labels';
import { EXPERIENCE_CATEGORIES } from '../src/domain/types';

const prisma = new PrismaClient();

async function main() {
  for (const id of EXPERIENCE_CATEGORIES) {
    await prisma.experienceCategory.upsert({ where: { id }, update: {}, create: { id, label: CATEGORY_LABEL[id] } });
  }
  for (const p of PROVIDERS) await prisma.experienceProvider.upsert({ where: { id: p.id }, update: p, create: p });
  for (const a of ACCOMMODATIONS) await prisma.accommodation.upsert({ where: { id: a.id }, update: a, create: a });
  for (const { category, ...e } of EXPERIENCES) {
    const data = { ...e, categoryId: category };
    await prisma.experience.upsert({ where: { id: e.id }, update: data, create: data });
  }
  await prisma.user.upsert({ where: { email: 'demo@around.travel' }, update: {}, create: { email: 'demo@around.travel', name: 'Demo traveler' } });
  console.log(`Seeded ${ACCOMMODATIONS.length} stays, ${EXPERIENCES.length} experiences, ${PROVIDERS.length} providers.`);
}

main().finally(() => prisma.$disconnect());
