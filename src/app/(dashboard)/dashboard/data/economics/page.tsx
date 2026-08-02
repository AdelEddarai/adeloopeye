'use client';

import dynamic from 'next/dynamic';

import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const EconomicsContent = dynamic(
  () => import('@/features/economics/components/EconomicsContent').then(m => ({ default: m.EconomicsContent })),
  { ssr: false, loading: () => <OverviewScreenSkeleton /> },
);

export default function EconomicsPage() {
  return <EconomicsContent />;
}
