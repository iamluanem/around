import type { Metadata } from 'next';
import { AnalyticsView } from '@/features/analytics/AnalyticsView';

export const metadata: Metadata = { title: 'Demo dashboard | AROUND', robots: { index: false } };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
