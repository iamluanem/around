import { catalogRepository } from '@/repositories';
import { StaysView } from '@/features/accommodations/StaysView';

export const dynamic = 'force-dynamic';

export default async function StaysPage({ searchParams }: { searchParams: Promise<{ destination?: string }> }) {
  const [{ accommodations, experiences }, { destination }] = await Promise.all([catalogRepository.getCatalog(), searchParams]);
  return <StaysView stays={accommodations} experiences={experiences} destination={destination} />;
}
