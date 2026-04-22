'use client';

import { useState } from 'react';
import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';
import { useMapFilters } from '@/features/map/hooks/use-map-filters';
import { useCesiumMapBase } from './hooks/useCesiumMapBase';
import { useCesiumData, type CesiumToggles } from './hooks/useCesiumIntelligenceData';

export default function CesiumMap({ embedded = false }: { embedded?: boolean }) {
  const [toggles, setToggles] = useState<CesiumToggles>({
    events: true,
    infrastructure: true,
    connections: true,
    routes: true,
    fires: true,
    weather: true,
    flights: false,
    cyber: true,
  });

  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, title: string, details: string } | null>(null);
  const [selectedFlightInfo, setSelectedFlightInfo] = useState<{ flightObj: any, x: number, y: number, entity: any } | null>(null);

  const toggleLayer = (layer: keyof CesiumToggles) => {
    setToggles(prev => ({ ...prev, [layer]: !prev[layer] }));
  };
  
  // Fetch local Morocco intelligence
  const { data: moroccoData, isLoading: moroccoLoading, error: moroccoError } = useMoroccoIntelligence(true);

  // Fetch Global Intelligence (Flights, assets, targets)
  const f = useMapFilters(true);
  const globalData = f.filtered;
  const globalLoading = f.isLoading;

  const isDataLoading = moroccoLoading || globalLoading;

  // Initialize the clean, perf-focused Cesium Viewer
  const { cesiumContainer, viewer, isInitializing } = useCesiumMapBase();

  // Draw ALL entities (Global + Local) safely without complex callbacks
  useCesiumData({ 
      viewer, 
      moroccoData, 
      globalData, 
      toggles, 
      setHoverInfo,
      onSelectFlight: setSelectedFlightInfo
  });

  const handleFlightAction = (action: 'focus' | 'track' | 'close') => {
      if (!selectedFlightInfo || !viewer) return;
      const entity = selectedFlightInfo.entity;

      if (action === 'focus') {
          viewer.trackedEntity = entity;
      }
      if (action === 'track') {
          // Toggle trailing path visibility natively over time
          entity.path.show = !entity.path.show.getValue();
      }
      if (action === 'close') {
          viewer.trackedEntity = undefined;
      }
      setSelectedFlightInfo(null);
  }

  return (
    <div className={embedded ? "h-full w-full relative" : "h-screen w-full relative"}>
      <div ref={cesiumContainer} className="h-full w-full bg-black" />
      
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white text-xl font-bold tracking-widest">
            INITIALIZING 4D ENGINE...
          </div>
        </div>
      )}

      {/* Map Info Panel - Hide if Embedded */}
      {!embedded && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm border border-gray-800 pointer-events-none">
          <h3 className="font-bold text-lg mb-1">🌍 Global 4D Map</h3>
          <p className="text-sm text-gray-300">Live OSINT Intelligence</p>
        </div>
      )}

      {/* Advanced Toggles Panel - Hide if Embedded */}
      {!embedded && (
        <div className="absolute top-[92px] left-4 z-50 bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm min-w-[240px] border border-gray-800 shadow-2xl">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-400">⚡</span> Data Layers
          </h3>

          {moroccoError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-2 rounded text-xs mb-3">
               Connection Failed
            </div>
          )}
          
          {isDataLoading && !isInitializing && (
            <div className="text-xs text-blue-300 mb-3 animate-pulse">
              Fetching satellite telemetry...
            </div>
          )}

          <div className="space-y-2 mt-2">
            {/* Global Toggles */}
            <div className="text-[10px] text-gray-500 font-bold tracking-widest mt-4 mb-2">WORLD LAYER</div>
            
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">✈️ Flights & Assets</span>
              <input type="checkbox" checked={toggles.flights} onChange={() => toggleLayer('flights')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">💻 Cyber Threats</span>
              <input type="checkbox" checked={toggles.cyber} onChange={() => toggleLayer('cyber')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>

            {/* Morocco Toggles */}
            <div className="text-[10px] text-gray-500 font-bold tracking-widest mt-4 mb-2">MOROCCO LAYER</div>
            
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">📍 Events</span>
              <input type="checkbox" checked={toggles.events} onChange={() => toggleLayer('events')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">🏗️ Infrastructure</span>
              <input type="checkbox" checked={toggles.infrastructure} onChange={() => toggleLayer('infrastructure')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">🔗 Connections</span>
              <input type="checkbox" checked={toggles.connections} onChange={() => toggleLayer('connections')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">🛣️ Routes</span>
              <input type="checkbox" checked={toggles.routes} onChange={() => toggleLayer('routes')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">🔥 Fires</span>
              <input type="checkbox" checked={toggles.fires} onChange={() => toggleLayer('fires')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-1 rounded">
              <span className="text-xs">🌤️ Weather</span>
              <input type="checkbox" checked={toggles.weather} onChange={() => toggleLayer('weather')} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
            </label>
          </div>
        </div>
      )}

      {/* Hover Info Tooltip */}
      {hoverInfo && (
        <div 
          className="absolute z-[100] pointer-events-none backdrop-blur-md bg-slate-900/80 border-l-4 border-cyan-500 border-y border-r border-slate-700 text-white p-4 rounded-r-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] min-w-[200px] max-w-md transition-all duration-75"
          style={{ top: hoverInfo.y + 15, left: hoverInfo.x + 15 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 min-w-2 relative mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <div className="font-bold text-sm text-cyan-50 uppercase tracking-wider">{hoverInfo.title}</div>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-cyan-500/50 to-transparent mb-2.5" />
          <div 
            className="text-xs text-slate-300 leading-relaxed [&>div]:mb-0 [&>p]:mb-1 [&_strong]:text-cyan-200" 
            dangerouslySetInnerHTML={{ __html: hoverInfo.details }} 
          />
        </div>
      )}

      {/* Flight Action Contextual Modal */}
      {selectedFlightInfo && (
          <div 
            className="absolute z-[200] backdrop-blur-md bg-slate-900/90 border border-slate-700 text-white p-3 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.3)] w-48"
            style={{ top: selectedFlightInfo.y - 40, left: selectedFlightInfo.x + 25 }}
          >
              <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-xs text-cyan-400 tracking-widest">{selectedFlightInfo.flightObj.name}</div>
                  <button onClick={() => handleFlightAction('close')} className="text-gray-400 hover:text-white text-xs">✕</button>
              </div>
              <div className="flex flex-col gap-2">
                  <button onClick={() => handleFlightAction('focus')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-left w-full transition-colors flex items-center justify-between">
                      <span>🎯 Lock Camera</span>
                  </button>
                  <button onClick={() => handleFlightAction('track')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-left w-full transition-colors flex items-center justify-between">
                      <span>〽️ Draw Trail</span>
                      {selectedFlightInfo.entity.path?.show && selectedFlightInfo.entity.path.show.getValue() ? <span className="text-cyan-500">ON</span> : ''}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
