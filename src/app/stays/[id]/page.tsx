import { notFound } from 'next/navigation';
import { catalogRepository } from '@/repositories';
import { StayDetailView } from '@/features/accommodations/StayDetailView';

export const dynamic = 'force-dynamic';

export default async function StayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [stay, experiences] = await Promise.all([catalogRepository.getAccommodation(id), catalogRepository.listExperiences()]);
  if (!stay) notFound();
  return <StayDetailView stay={stay} experiences={experiences} />;
}
