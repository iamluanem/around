import { catalogRepository } from '@/repositories';
import { BundleView } from '@/features/bundles/BundleView';

export const dynamic = 'force-dynamic';

export default async function BundlePage() {
  return <BundleView experiences={await catalogRepository.listExperiences()} />;
}
