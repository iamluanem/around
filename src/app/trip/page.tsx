import { catalogRepository } from '@/repositories';
import { TripView } from '@/features/itinerary/TripView';

export const dynamic = 'force-dynamic';

export default async function TripPage() {
  const { accommodations, experiences } = await catalogRepository.getCatalog();
  return <TripView experiences={experiences} stays={accommodations} />;
}
