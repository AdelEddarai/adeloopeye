'use client';

import dynamic from 'next/dynamic';

import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const TimelineContent = dynamic(
  () => import('@/features/news/components/TimelineContent').then(m => ({ default: m.TimelineContent })),
  { ssr: false, loading: () => <OverviewScreenSkeleton /> },
);

export default function TimelinePage() {
  return <TimelineContent />;
}
