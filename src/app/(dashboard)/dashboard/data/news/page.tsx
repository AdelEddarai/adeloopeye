'use client';

import dynamic from 'next/dynamic';

import { OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const NewsContent = dynamic(
  () => import('@/features/news/components/NewsContent').then(m => ({ default: m.NewsContent })),
  { ssr: false, loading: () => <OverviewScreenSkeleton /> },
);

export default function NewsPage() {
  return <NewsContent />;
}
