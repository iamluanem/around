import { catalogRepository } from '@/repositories';
import { StaysView } from '@/features/accommodations/StaysView';

export const dynamic = 'force-dynamic';

export default async function StaysPage() {
  const { accommodations, experiences } = await catalogRepository.getCatalog();
  return <StaysView stays={accommodations} experiences={experiences} />;
}
