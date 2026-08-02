'use client';

import dynamic from 'next/dynamic';

import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const FeedContent = dynamic(
  () => import('@/features/events/components/FeedContent').then(m => ({ default: m.FeedContent })),
  { ssr: false, loading: () => <ListDetailScreenSkeleton /> },
);

export default function IntelFeedPage() {
  return <FeedContent />;
}
