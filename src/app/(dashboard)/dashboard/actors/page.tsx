'use client';

import dynamic from 'next/dynamic';

import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

const ActorsContent = dynamic(
  () => import('@/features/actors/components/ActorsContent').then(m => ({ default: m.ActorsContent })),
  { ssr: false, loading: () => <ListDetailScreenSkeleton /> },
);

export default function ActorsPage() {
  return <ActorsContent />;
}
