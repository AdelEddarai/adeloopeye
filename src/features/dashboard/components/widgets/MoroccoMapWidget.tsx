'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Maximize2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamically import the Cesium Map with SSR disabled
const CesiumMap = dynamic(() => import('@/components/morocco/CesiumMap'), { ssr: false });

export function MoroccoMapWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay mount slightly to ensure parent grid is ready for WebGL context
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-1)]">
        <span className="mono text-[var(--t4)] text-xs">Initializing 4D Engine...</span>
      </div>
    );
  }

  return (
    <Card className="h-full w-full relative overflow-hidden border-[var(--bd)] bg-[var(--bg-1)]">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
           <span className="text-[var(--blue)] font-bold text-xs mono drop-shadow-md">🇲🇦 MOROCCO 4D MAP</span>
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        </div>
      </div>
      
      {/* Bottom Overlay Action Bar */}
      <div className="absolute bottom-2 right-2 z-10">
        <Link href="/morocco-map">
          <Button size="sm" className="bg-black/60 hover:bg-black/90 text-cyan-400 border border-cyan-900/50 backdrop-blur-sm text-[10px] h-7 px-3 mono font-bold group">
            <Maximize2 className="w-3 h-3 mr-1.5 group-hover:scale-110 transition-transform" />
            FULL MAP ⤢
          </Button>
        </Link>
      </div>

      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-[var(--bg-1)]">
            <span className="mono text-[var(--blue)] text-xs animate-pulse">Loading WebGL Context...</span>
          </div>
        }>
          <CesiumMap embedded={true} />
        </Suspense>
      </div>
    </Card>
  );
}
