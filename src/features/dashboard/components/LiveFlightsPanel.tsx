'use client';

import { Loader2, Plane, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveFlights } from '@/shared/hooks/use-live-flights';

type Props = {
  bbox?: [number, number, number, number];
};

export function LiveFlightsPanel({ bbox }: Props) {
  const { data, isLoading, error, refetch, isFetching } = useLiveFlights(bbox);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2 flex-1">
          <Plane size={14} className="text-[var(--blue-l)]" />
          <span className="section-title">LIVE FLIGHTS</span>
          {data && (
            <span className="mono text-[var(--t4)]">
              {data.count} active
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
          </div>
        )}

        {error && (
          <div className="p-4 text-[var(--danger)]">
            <p className="font-semibold">Failed to load flights</p>
            <p className="text-sm text-[var(--t3)] mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {data && (
          <div className="p-3 space-y-2">
            {data.flights.slice(0, 50).map((flight) => (
              <div
                key={flight.icao24}
                className="p-2 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-sm text-[var(--t1)] font-semibold">
                    {flight.callsign || flight.icao24}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    flight.on_ground
                      ? 'bg-[var(--bg-3)] text-[var(--t4)]'
                      : 'bg-[var(--blue-dim)] text-[var(--blue-l)]'
                  }`}>
                    {flight.on_ground ? 'GROUND' : 'AIRBORNE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
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
                      <span className="text-[var(--t4)]">Altitude:</span>
                      <span className="text-[var(--t2)] ml-1 mono">
                        {Math.round(flight.baro_altitude)} m
                      </span>
                    </div>
                  )}
                  {flight.latitude !== null && flight.longitude !== null && (
                    <div>
                      <span className="text-[var(--t4)]">Position:</span>
                      <span className="text-[var(--t2)] ml-1 mono">
                        {flight.latitude.toFixed(2)}, {flight.longitude.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {data && (
        <div className="px-3 py-2 border-t border-[var(--bd-s)] text-[10px] text-[var(--t4)] mono">
          Last updated: {new Date(data.fetchedAt).toLocaleTimeString()} • Updates every 10s
        </div>
      )}
    </div>
  );
}
