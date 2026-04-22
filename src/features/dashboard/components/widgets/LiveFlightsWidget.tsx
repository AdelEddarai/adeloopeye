'use client';

import { Loader2, Plane, RefreshCw } from 'lucide-react';

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
          {data?.count || 0} active • Updates every 10s
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
        {data?.flights.slice(0, 30).map((flight) => (
          <div
            key={flight.icao24}
            className="p-2 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="mono text-xs text-[var(--t1)] font-semibold">
                {flight.callsign || flight.icao24}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded mono ${
                flight.on_ground
                  ? 'bg-[var(--bg-3)] text-[var(--t4)]'
                  : 'bg-[var(--blue-dim)] text-[var(--blue-l)]'
              }`}>
                {flight.on_ground ? 'GND' : 'AIR'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              <div>
                <span className="text-[var(--t4)]">Country:</span>
                <span className="text-[var(--t2)] ml-1">{flight.origin_country}</span>
              </div>
              {flight.velocity !== null && (
                <div>
                  <span className="text-[var(--t4)]">Speed:</span>
                  <span className="text-[var(--t2)] ml-1 mono">
                    {Math.round(flight.velocity * 3.6)} km/h
                  </span>
                </div>
              )}
              {flight.baro_altitude !== null && (
                <div>
                  <span className="text-[var(--t4)]">Alt:</span>
                  <span className="text-[var(--t2)] ml-1 mono">
                    {Math.round(flight.baro_altitude)} m
                  </span>
                </div>
              )}
              {flight.latitude !== null && flight.longitude !== null && (
                <div className="col-span-2">
                  <span className="text-[var(--t4)]">Pos:</span>
                  <span className="text-[var(--t2)] ml-1 mono">
                    {flight.latitude.toFixed(2)}, {flight.longitude.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
