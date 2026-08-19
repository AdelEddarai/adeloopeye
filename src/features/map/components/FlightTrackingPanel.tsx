'use client';

import { useMemo } from 'react';
import {
  Plane, X, Navigation, Compass, Gauge,
  Radio, MapPin, ArrowRight, ShieldCheck, Crosshair
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/data/map-data';
import { resolveFlightRoute } from '@/features/map/lib/flight-route-resolver';

type Props = {
  trackedFlight: Asset | null;
  onClearTracking: () => void;
  onFocusFlight: () => void;
};

export function FlightTrackingPanel({ trackedFlight, onClearTracking, onFocusFlight }: Props) {
  if (!trackedFlight) return null;

  const info = useMemo(() => resolveFlightRoute(trackedFlight), [trackedFlight]);

  return (
    <div
      className="absolute top-3 right-3 md:right-16 z-30 font-mono bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/90 rounded-sm shadow-2xl p-3.5 w-[330px] text-zinc-300 space-y-3 pointer-events-auto"
      style={{
        boxShadow: '0 0 35px rgba(0,0,0,0.65), 0 0 15px rgba(168,85,247,0.15)',
      }}
    >
      {/* Corner brackets */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-purple-500/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-purple-500/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-purple-500/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-purple-500/80 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xs bg-purple-500/15 border border-purple-500/40 flex items-center justify-center">
            <Plane size={13} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-100 tracking-wider">
                {info.callsign}
              </span>
              <Badge variant="outline" className="text-[8px] px-1 py-0 bg-purple-500/10 border-purple-500/40 text-purple-300">
                {info.aircraftType}
              </Badge>
            </div>
            <p className="text-[8.5px] text-zinc-500 truncate max-w-[190px]">
              {info.operator}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearTracking}
          className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-200"
          title="Dismiss flight tracking"
        >
          <X size={13} />
        </Button>
      </div>

      {/* Origin -> Destination Route Corridor */}
      <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="text-left">
            <span className="text-cyan-400 text-[13px]">{info.origin.iata}</span>
            <p className="text-[8.5px] text-zinc-400 font-medium truncate max-w-[100px]">
              {info.origin.city}
            </p>
          </div>

          <div className="flex flex-col items-center flex-1 px-3">
            <div className="flex items-center gap-1 text-[8.5px] text-purple-400">
              <span>{info.progressPct}%</span>
              <Plane size={10} className="transform rotate-90" />
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${info.progressPct}%` }}
              />
            </div>
            <span className="text-[7.5px] text-zinc-500 mt-0.5">{info.distanceKm} km ROUTE</span>
          </div>

          <div className="text-right">
            <span className="text-purple-400 text-[13px]">{info.destination.iata}</span>
            <p className="text-[8.5px] text-zinc-400 font-medium truncate max-w-[100px]">
              {info.destination.city}
            </p>
          </div>
        </div>

        <div className="text-[8px] text-zinc-500 flex justify-between border-t border-zinc-800/60 pt-1">
          <span>ORIGIN: {info.origin.name} ({info.origin.country})</span>
        </div>
      </div>

      {/* Real-time Avionics Telemetry */}
      <div className="grid grid-cols-3 gap-1.5 text-[8.5px]">
        <div className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-zinc-500 text-[7.5px] block">ALTITUDE</span>
          <span className="font-bold text-zinc-200 text-[10px]">
            {info.altitudeFt > 0 ? `FL${Math.round(info.altitudeFt / 100)}` : 'GND'}
          </span>
          <span className="text-[7.5px] text-zinc-500 block">{info.altitudeFt.toLocaleString()} ft</span>
        </div>

        <div className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-zinc-500 text-[7.5px] block">GROUNDSPEED</span>
          <span className="font-bold text-cyan-300 text-[10px]">{info.speedKnots} kn</span>
          <span className="text-[7.5px] text-zinc-500 block">{Math.round(info.speedKnots * 1.852)} km/h</span>
        </div>

        <div className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800/60">
          <span className="text-zinc-500 text-[7.5px] block">HEADING</span>
          <span className="font-bold text-zinc-200 text-[10px]">{info.headingDeg}°</span>
          <span className="text-[7.5px] text-zinc-500 block">SQUAWK {info.squawk}</span>
        </div>
      </div>

      {/* Model Spec */}
      <div className="text-[8.5px] text-zinc-400 flex items-center justify-between px-1">
        <span>AIRFRAME: <strong className="text-zinc-200">{info.aircraftModel}</strong></span>
        <span>ICAO: <strong className="text-zinc-400">{info.icao24}</strong></span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onFocusFlight}
          className="h-7 text-[9px] font-bold bg-purple-500/10 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 rounded-xs"
        >
          <Crosshair size={11} className="mr-1 text-purple-400" />
          LOCK CAMERA
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClearTracking}
          className="h-7 text-[9px] font-bold bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xs"
        >
          DISMISS HUD
        </Button>
      </div>
    </div>
  );
}
