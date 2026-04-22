'use client';

import dynamic from 'next/dynamic';

const CesiumMap = dynamic(() => import('./CesiumMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="text-center">
        <div className="text-white text-2xl mb-2">🌍 Loading Morocco 4D Map...</div>
        <div className="text-gray-400 text-sm">Initializing Cesium globe</div>
      </div>
    </div>
  ),
});

export default function MoroccoMapClient() {
  return <CesiumMap />;
}
