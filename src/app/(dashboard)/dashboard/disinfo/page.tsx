'use client';

import { Suspense } from 'react';

import { DisinformationContent } from '@/features/disinformation/components/DisinformationContent';
import { ListDetailScreenSkeleton } from '@/shared/components/loading/screen-skeletons';

export default function DisinfoPage() {
  return (
    <Suspense fallback={<ListDetailScreenSkeleton />}>
      <DisinformationContent />
    </Suspense>
  );
}
