import { catalogRepository } from '@/repositories';
import { ExperiencesView } from '@/features/experiences/ExperiencesView';

export const dynamic = 'force-dynamic';

export default async function ExperiencesPage() {
  const { accommodations, experiences } = await catalogRepository.getCatalog();
  return <ExperiencesView experiences={experiences} stays={accommodations} />;
}
