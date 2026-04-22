'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';

import { MapErrorBoundary } from '@/features/map/components/MapErrorBoundary';

const FullMapPage = dynamic(() => import('@/features/map/components/MapPageContent').then(m => ({ default: m.FullMapPage })), { ssr: false });

export function MapWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mount to ensure WebGL context is ready
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-1)]">
        <span className="mono text-[var(--t4)]">Initializing map...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-[var(--bg-1)]">
            <span className="mono text-[var(--t4)]">Loading map...</span>
          </div>
        }>
          <div className="absolute inset-0">
            <FullMapPage embedded />
          </div>
        </Suspense>
      </MapErrorBoundary>
    </div>
  );
}
