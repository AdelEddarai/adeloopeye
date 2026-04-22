'use client';

import { useCallback } from 'react';

import { Plane, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { Asset } from '@/data/map-data';

type Props = {
  trackedFlight: Asset | null;
  onClearTracking: () => void;
  onFocusFlight: () => void;
};

export function FlightTrackingPanel({ trackedFlight, onClearTracking, onFocusFlight }: Props) {
  if (!trackedFlight) return null;

  const handleFocus = useCallback(() => {
    onFocusFlight();
  }, [onFocusFlight]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(28,33,39,0.95)',
        border: '1px solid var(--bd)',
        borderRadius: 4,
        padding: '12px 16px',
        minWidth: 280,
        maxWidth: 320,
        zIndex: 15,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plane size={16} className="text-[var(--info)]" />
          <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">
            TRACKING FLIGHT
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearTracking}
          className="h-5 w-5 p-0"
          title="Stop tracking"
        >
          <X size={12} strokeWidth={2} />
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">CALLSIGN</span>
          <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--info)]">
            {trackedFlight.name}
          </span>
        </div>

        {trackedFlight.altitude !== undefined && trackedFlight.altitude !== null && (
          <div className="flex items-center justify-between">
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">ALTITUDE</span>
            <span className="mono text-[length:var(--text-label)] text-[var(--t2)]">
              {Math.round(trackedFlight.altitude)}m
            </span>
          </div>
        )}

        {trackedFlight.velocity !== undefined && trackedFlight.velocity !== null && (
          <div className="flex items-center justify-between">
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">SPEED</span>
            <span className="mono text-[length:var(--text-label)] text-[var(--t2)]">
              {Math.round(trackedFlight.velocity)} m/s
            </span>
          </div>
        )}

        {trackedFlight.heading !== undefined && (
          <div className="flex items-center justify-between">
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">HEADING</span>
            <span className="mono text-[length:var(--text-label)] text-[var(--t2)]">
              {Math.round(trackedFlight.heading)}°
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">POSITION</span>
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)]">
            {trackedFlight.position[1].toFixed(4)}, {trackedFlight.position[0].toFixed(4)}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleFocus}
        className="w-full mt-3 mono text-[length:var(--text-tiny)] font-bold"
        style={{
          borderColor: 'var(--info)',
          background: 'var(--info-dim)',
          color: 'var(--info)',
        }}
      >
        FOCUS ON MAP
      </Button>
    </div>
  );
}
