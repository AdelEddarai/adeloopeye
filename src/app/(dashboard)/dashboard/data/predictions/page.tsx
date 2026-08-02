'use client';

import dynamic from 'next/dynamic';

import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const PredictionsDataContent = dynamic(
  () => import('@/features/predictions/components/PredictionsDataContent').then(m => ({ default: m.PredictionsDataContent })),
  { ssr: false, loading: () => <OverviewScreenSkeleton /> },
);

export default function PredictionsDataPage() {
  return <PredictionsDataContent />;
}
