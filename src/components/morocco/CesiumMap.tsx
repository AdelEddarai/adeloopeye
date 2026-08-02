'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';
import { useAlertNotifications } from '@/shared/hooks/use-alert-notifications';
import { useMapFilters } from '@/features/map/hooks/use-map-filters';
import { useCesiumMapBase } from './hooks/useCesiumMapBase';
import { useCesiumData, type CesiumToggles } from './hooks/useCesiumIntelligenceData';

type LayerToggleConfig = {
  key: keyof CesiumToggles;
  label: string;
  icon: string;
  accent: string;
  section: 'WORLD LAYER' | 'MOROCCO LAYER';
};

const LAYER_CONFIG: LayerToggleConfig[] = [
  { key: 'flights', label: 'Flights & Assets', icon: '✈️', accent: 'bg-cyan-400', section: 'WORLD LAYER' },
  { key: 'cyber', label: 'Cyber Threats', icon: '💻', accent: 'bg-fuchsia-400', section: 'WORLD LAYER' },
  { key: 'events', label: 'Events', icon: '📍', accent: 'bg-blue-400', section: 'MOROCCO LAYER' },
  { key: 'infrastructure', label: 'Infrastructure', icon: '🏗️', accent: 'bg-amber-400', section: 'MOROCCO LAYER' },
  { key: 'connections', label: 'Connections', icon: '🔗', accent: 'bg-violet-400', section: 'MOROCCO LAYER' },
  { key: 'routes', label: 'Routes', icon: '🛣️', accent: 'bg-emerald-400', section: 'MOROCCO LAYER' },
  { key: 'fires', label: 'Fires', icon: '🔥', accent: 'bg-orange-400', section: 'MOROCCO LAYER' },
  { key: 'weather', label: 'Weather', icon: '🌤️', accent: 'bg-sky-400', section: 'MOROCCO LAYER' },
];

function ModernToggle({ on, accent, onChange }: { on: boolean; accent: string; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
        on ? 'bg-cyan-500/40' : 'bg-slate-700/60'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full shadow transition-transform duration-200 ${
          on ? `translate-x-3.5 ${accent}` : 'translate-x-0.5 bg-slate-400'
        }`}
      />
    </button>
  );
}

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

  const [hoverInfo, setHoverInfoState] = useState<{ x: number, y: number, title: string, details: string } | null>(null);
  const hoverInfoRef = useRef<{ x: number, y: number, title: string, details: string } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setHoverInfo = useCallback((info: { x: number, y: number, title: string, details: string } | null) => {
    if (info) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      hoverInfoRef.current = info;
      setHoverInfoState(info);
    } else {
      if (hoverInfoRef.current && !hoverTimeoutRef.current) {
        hoverTimeoutRef.current = setTimeout(() => {
          hoverInfoRef.current = null;
          setHoverInfoState(null);
          hoverTimeoutRef.current = null;
        }, 500);
      }
    }
  }, []);
  const [selectedFlightInfo, setSelectedFlightInfo] = useState<{ flightObj: any, x: number, y: number, entity: any } | null>(null);

  const toggleLayer = (layer: keyof CesiumToggles) => {
    setToggles(prev => ({ ...prev, [layer]: !prev[layer] }));
  };
  
  // Fetch local Morocco intelligence
  const { data: moroccoData, isLoading: moroccoLoading, error: moroccoError } = useMoroccoIntelligence(true);

  // Alert notification system - monitors new critical/alert events
  const { alerts, totalAlerts, criticalAlerts } = useAlertNotifications(
    moroccoData?.events || [],
    true // enabled
  );

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

  // ── Camera telemetry HUD ─────────────────────────────────────────
  const [cameraHud, setCameraHud] = useState<{ lat: number; lon: number; height: number } | null>(null);
  useEffect(() => {
    if (!viewer) return;
    let frame = 0;
    const update = () => {
      try {
        const carto = viewer.camera.positionCartographic;
        setCameraHud({
          lat: (carto.latitude * 180) / Math.PI,
          lon: (carto.longitude * 180) / Math.PI,
          height: carto.height,
        });
      } catch (e) { /* noop */ }
    };
    const tick = () => {
      update();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [viewer]);

  // ── Live clock ───────────────────────────────────────────────────
  const [clock, setClock] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toISOString().slice(11, 19) + 'Z');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const worldLayer = LAYER_CONFIG.filter(l => l.section === 'WORLD LAYER');
  const moroccoLayer = LAYER_CONFIG.filter(l => l.section === 'MOROCCO LAYER');

  const entityCounts = {
    events: moroccoData?.events?.length ?? 0,
    fires: moroccoData?.fires?.length ?? 0,
    infra: moroccoData?.infrastructure?.length ?? 0,
    conns: moroccoData?.connections?.length ?? 0,
    routes: moroccoData?.routes?.length ?? 0,
    weather: moroccoData?.weather?.length ?? 0,
    flights: globalData?.assets?.length ?? 0,
  };

  return (
    <div className={embedded ? "h-full w-full relative overflow-hidden bg-black" : "h-screen w-full relative overflow-hidden bg-black"}>
      {/* Scanline / grid atmosphere overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 3px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 60%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      <div ref={cesiumContainer} className="h-full w-full bg-black" />
      
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <div className="w-12 h-12 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white text-lg font-bold tracking-[0.3em] text-cyan-100">
            INITIALIZING 4D ENGINE
          </div>
          <div className="text-cyan-500/60 text-[10px] font-mono tracking-[0.4em] mt-2">ADELOOP OSINT</div>
        </div>
      )}

      {/* ── Top-left Command Header ─────────────────────────────── */}
      {!embedded && (
        <div className="absolute top-4 left-4 z-30">
          <div className="rounded-xl border border-cyan-400/20 bg-slate-950/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="px-4 py-3 flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                  <h3 className="font-bold text-sm tracking-[0.25em] text-cyan-50">ADELOOP OSINT</h3>
                </div>
                <p className="text-[9px] text-cyan-400/80 font-mono tracking-[0.3em] mt-1">MOROCCO · 4D INTELLIGENCE</p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-md">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-[8px] text-emerald-300 font-mono tracking-widest uppercase">Stream Active</span>
                </div>
                {totalAlerts > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-400/10 border border-red-400/40 rounded-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    <span className="text-[8px] text-red-300 font-mono tracking-widest uppercase">
                      {criticalAlerts} Critical · {totalAlerts} Alerts
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Gradient hairline */}
            <div className="h-px bg-gradient-to-r from-cyan-400/60 via-transparent to-transparent" />
            <div className="px-4 py-2 flex items-center gap-3">
              <span className="text-[8px] text-slate-500 font-mono tracking-widest">UTC</span>
              <span className="text-[10px] text-cyan-200 font-mono tabular-nums">{clock}</span>
              <span className="h-3 w-px bg-white/10" />
              <span className="text-[8px] text-slate-500 font-mono tracking-widest">ENGINE</span>
              <span className="text-[10px] text-cyan-200 font-mono">CESIUM · 4K</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Layer Controls ───────────────────────────────────────── */}
      {!embedded && (
        <div className="absolute top-[132px] left-4 z-30 w-[248px] rounded-xl border border-cyan-400/15 bg-slate-950/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-white/5">
            <span className="text-cyan-400 text-[11px]">◈</span>
            <h4 className="font-bold text-[10px] tracking-[0.3em] text-slate-200">DATA LAYERS</h4>
            <span className="ml-auto font-mono text-[8px] text-slate-500">
              {Object.values(toggles).filter(Boolean).length}/{LAYER_CONFIG.length}
            </span>
          </div>

          {moroccoError && (
            <div className="mx-3 mt-2 bg-red-400/10 border border-red-400/40 text-red-300 p-2 rounded-md text-[10px] font-mono">
              [!] CONNECTION FAILED
            </div>
          )}
          
          {isDataLoading && !isInitializing && (
            <div className="flex items-center gap-2 text-[9px] text-cyan-300 mt-2 px-4 font-mono">
              <span className="inline-block w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              FETCHING TELEMETRY...
            </div>
          )}

          {[
            { title: 'WORLD LAYER', items: worldLayer },
            { title: 'MOROCCO LAYER', items: moroccoLayer },
          ].map(group => (
            <div key={group.title}>
              <div className="text-[8px] text-slate-500 font-bold tracking-[0.3em] mt-3 mb-1 px-4">{group.title}</div>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between cursor-pointer px-4 py-[7px] hover:bg-white/[0.04] transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-[11px] text-slate-300 group-hover:text-cyan-100 transition-colors">
                      <span className="text-[12px] leading-none">{item.icon}</span>
                      {item.label}
                    </span>
                    <ModernToggle
                      on={toggles[item.key]}
                      accent={item.accent}
                      onChange={() => toggleLayer(item.key)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="px-4 py-2.5 mt-1 border-t border-white/5 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
            </span>
            <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Aggregated in real time</span>
          </div>
        </div>
      )}

      {/* ── Bottom-left Entity Legend / Counts ───────────────────── */}
      {!embedded && (
        <div className="absolute bottom-4 left-4 z-30">
          <div className="rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] px-4 py-3">
            <div className="text-[8px] text-slate-500 font-bold tracking-[0.3em] mb-2">LIVE TELEMETRY</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                { label: 'EVENTS', value: entityCounts.events, dot: 'bg-blue-400' },
                { label: 'FIRES', value: entityCounts.fires, dot: 'bg-orange-400' },
                { label: 'INFRA', value: entityCounts.infra, dot: 'bg-amber-400' },
                { label: 'LINKS', value: entityCounts.conns, dot: 'bg-violet-400' },
                { label: 'ROUTES', value: entityCounts.routes, dot: 'bg-emerald-400' },
                { label: 'FLIGHTS', value: entityCounts.flights, dot: 'bg-cyan-400' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
                  <span className="text-[8px] text-slate-500 font-mono tracking-wider">{stat.label}</span>
                  <span className="text-[10px] text-cyan-100 font-mono tabular-nums">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom-right Camera HUD ──────────────────────────────── */}
      {!embedded && cameraHud && (
        <div className="absolute bottom-4 right-4 z-30 rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] px-4 py-3 font-mono">
          <div className="text-[8px] text-slate-500 font-bold tracking-[0.3em] mb-2">CAMERA · GEODESIC</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] tabular-nums">
            <span className="text-slate-500 tracking-wider">LAT</span>
            <span className="text-cyan-200 text-right">{cameraHud.lat.toFixed(4)}°</span>
            <span className="text-slate-500 tracking-wider">LON</span>
            <span className="text-cyan-200 text-right">{cameraHud.lon.toFixed(4)}°</span>
            <span className="text-slate-500 tracking-wider">ALT</span>
            <span className="text-cyan-200 text-right">
              {cameraHud.height >= 1000 ? `${(cameraHud.height / 1000).toFixed(1)} km` : `${Math.round(cameraHud.height)} m`}
            </span>
            <span className="text-slate-500 tracking-wider">ZOOM</span>
            <span className="text-cyan-200 text-right">
              {cameraHud.height > 2000000 ? 'GLOBAL' : cameraHud.height > 300000 ? 'REGIONAL' : cameraHud.height > 25000 ? 'LOCAL' : 'STREET'}
            </span>
          </div>
        </div>
      )}

      {/* Hover Info Tooltip */}
      {hoverInfo && (
        <div 
          className="absolute z-[100] rounded-xl border-l-2 border-cyan-400 bg-slate-950/90 backdrop-blur-xl border-y border-r border-white/10 text-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.7)] min-w-[220px] max-w-md transition-all duration-75"
          style={{ top: hoverInfo.y + 15, left: hoverInfo.x + 15 }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            hoverTimeoutRef.current = setTimeout(() => {
              hoverInfoRef.current = null;
              setHoverInfoState(null);
              hoverTimeoutRef.current = null;
            }, 500);
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-1.5 w-1.5 min-w-1.5 relative mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
            </span>
            <div className="font-bold text-[10px] text-cyan-50 uppercase tracking-[0.15em]">{hoverInfo.title}</div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-cyan-400/70 to-transparent mb-3" />
          <div 
            className="text-xs text-slate-300 leading-relaxed [&>div]:mb-0 [&>p]:mb-1 [&_strong]:text-cyan-300" 
            dangerouslySetInnerHTML={{ __html: hoverInfo.details }} 
          />
          <div className="mt-3 pt-2 border-t border-dashed border-white/15 text-[8px] text-cyan-400/70 text-center tracking-[0.25em] font-mono animate-pulse">
            CLICK TO EXPAND INTELLIGENCE
          </div>
        </div>
      )}

      {/* Flight Action Contextual Modal */}
      {selectedFlightInfo && (
          <div 
            className="absolute z-[200] backdrop-blur-md bg-slate-950/90 border border-white/15 text-white p-3 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] w-48"
            style={{ top: selectedFlightInfo.y - 40, left: selectedFlightInfo.x + 25 }}
          >
              <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-[10px] text-cyan-300 tracking-[0.15em]">{selectedFlightInfo.flightObj.name}</div>
                  <button onClick={() => handleFlightAction('close')} className="text-slate-500 hover:text-white text-xs">✕</button>
              </div>
              <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleFlightAction('focus')} className="bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-md px-2 py-1.5 text-[10px] text-left w-full transition-colors flex items-center justify-between">
                      <span>🎯 Lock Camera</span>
                  </button>
                  <button onClick={() => handleFlightAction('track')} className="bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-md px-2 py-1.5 text-[10px] text-left w-full transition-colors flex items-center justify-between">
                      <span>〽️ Draw Trail</span>
                      {selectedFlightInfo.entity.path?.show && selectedFlightInfo.entity.path.show.getValue() ? <span className="text-cyan-400">ON</span> : ''}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
