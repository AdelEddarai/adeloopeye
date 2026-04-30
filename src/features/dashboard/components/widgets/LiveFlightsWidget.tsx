'use client';

import { Loader2, Plane, RefreshCw, Navigation2, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLiveFlights } from '@/shared/hooks/use-live-flights';

export function LiveFlightsWidget() {
  // Middle East bounding box: [minLat, minLon, maxLat, maxLon]
  const bbox: [number, number, number, number] = [24, 32, 42, 63];
  const { data, isLoading, error, refetch, isFetching } = useLiveFlights(bbox);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[var(--danger)]">
        <p className="font-semibold">Failed to load flights</p>
        <p className="text-sm text-[var(--t3)] mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd-s)]">
        <Plane size={12} className="text-[var(--blue-l)]" />
        <span className="mono text-[10px] text-[var(--t4)]">
          {data?.count || 0} active • Global • Updates every 10s
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {data?.flights.slice(0, 30).map((flight) => {
          const speedKmh = flight.velocity ? Math.round(flight.velocity * 3.6) : null;
          const altitudeM = flight.baro_altitude ? Math.round(flight.baro_altitude) : null;
          const altitudeFt = altitudeM ? Math.round(altitudeM * 3.281) : null;
          
          return (
            <div
              key={flight.icao24}
              className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--bd)] hover:border-[var(--purple)] transition-colors cursor-pointer group"
              onClick={() => {
                // Dispatch custom event to notify map to track this flight
                window.dispatchEvent(new CustomEvent('track-flight', { 
                  detail: { icao24: flight.icao24 } 
                }));
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-[var(--t1)] font-semibold">
                    {flight.callsign || flight.icao24}
                  </span>
                  <ArrowUpRight size={10} className="text-[var(--t4)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded mono flex items-center gap-1 ${
                  flight.on_ground
                    ? 'bg-[var(--bg-3)] text-[var(--t4)]'
                    : 'bg-[var(--blue-dim)] text-[var(--blue-l)]'
                }`}>
                  {flight.on_ground ? 'GND' : 'AIR'}
                  {flight.true_track !== null && !flight.on_ground && (
                    <Navigation2 size={8} style={{ transform: `rotate(${flight.true_track}deg)` }} />
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[var(--t4)]">Country:</span>
                  <span className="text-[var(--t2)] mono">{flight.origin_country}</span>
                </div>
                
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[var(--t4)]">Speed:</span>
                  <span className="text-[var(--t2)] mono">
                    {speedKmh ? `${speedKmh} km/h` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[var(--t4)]">Altitude:</span>
                  <span className="text-[var(--t2)] mono">
                    {altitudeFt ? `${altitudeFt.toLocaleString()} ft` : 'N/A'}
                  </span>
                </div>
                
                {flight.latitude !== null && flight.longitude !== null && (
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-[var(--t4)]">Position:</span>
                    <span className="text-[var(--t2)] mono">
                      {flight.latitude.toFixed(2)}°, {flight.longitude.toFixed(2)}°
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-1.5 border-t border-[var(--bd-s)] text-[8px] text-[var(--t4)] mono opacity-0 group-hover:opacity-100 transition-opacity">
                Click to track on map →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
