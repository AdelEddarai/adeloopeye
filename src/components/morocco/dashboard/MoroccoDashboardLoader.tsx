'use client';

import dynamic from 'next/dynamic';

const MoroccoDashboardClient = dynamic(() => import('./MoroccoDashboardClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-zinc-200 text-sm font-bold tracking-[0.3em]">LOADING MOROCCO INTEL</div>
        <div className="text-zinc-600 text-xs mt-2 font-mono">Aggregating OSINT telemetry...</div>
      </div>
    </div>
  ),
});

export default function MoroccoDashboardLoader() {
  return <MoroccoDashboardClient />;
}
