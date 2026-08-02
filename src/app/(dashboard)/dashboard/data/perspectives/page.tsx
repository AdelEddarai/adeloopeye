'use client';

import dynamic from 'next/dynamic';

import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const PerspectivesContent = dynamic(
  () => import('@/features/perspectives/components/PerspectivesContent').then(m => ({ default: m.PerspectivesContent })),
  { ssr: false, loading: () => <OverviewScreenSkeleton /> },
);

export default function PerspectivesPage() {
  return <PerspectivesContent />;
}
