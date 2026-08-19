'use client';

import { useEffect, useRef, useState } from 'react';
import type { OpenSkyFlight } from '@/server/lib/api-clients/adsbfi-client';

export type InterpolatedFlight = OpenSkyFlight & {
  currentPosition: [number, number]; // [lon, lat] smoothly animated
  contrailPath: [number, number][]; // Last N positions for vapor trail
  category?: string;
  model?: string;
  speedKnots?: number;
  altitudeFt?: number;
  flightLevel?: string;
};

const MAX_CONTRAIL_POINTS = 20;

/**
 * High-performance 60 FPS dead-reckoning flight interpolator.
 * Smoothly advances aircraft coordinates along their true heading and velocity vectors
 * between network polling cycles.
 */
export function useInterpolatedFlights(
  rawFlights: OpenSkyFlight[] = [],
  enabled: boolean = true
): InterpolatedFlight[] {
  const [flights, setFlights] = useState<InterpolatedFlight[]>([]);
  const stateRef = useRef<Map<string, {
    flight: OpenSkyFlight;
    lastPos: [number, number];
    basePos: [number, number];
    headingDeg: number;
    speedKnots: number;
    updatedAt: number;
    contrail: [number, number][];
  }>>(new Map());

  // Ingest new network flights and initialize / update reference states
  useEffect(() => {
    if (!enabled || !rawFlights.length) return;

    const now = performance.now();
    const map = stateRef.current;
    const currentHexes = new Set<string>();

    for (const raw of rawFlights) {
      if (raw.latitude === null || raw.longitude === null) continue;
      const id = raw.icao24.toLowerCase();
      currentHexes.add(id);

      const targetPos: [number, number] = [raw.longitude, raw.latitude];
      const speedKnots = raw.velocity || 450;
      const headingDeg = raw.true_track || 0;

      const existing = map.get(id);
      if (existing) {
        // Calculate distance from previous position to detect resets
        const dLon = Math.abs(existing.lastPos[0] - targetPos[0]);
        const dLat = Math.abs(existing.lastPos[1] - targetPos[1]);

        let newContrail = existing.contrail;
        if (dLon > 0.001 || dLat > 0.001) {
          newContrail = [...existing.contrail, existing.lastPos].slice(-MAX_CONTRAIL_POINTS);
        }

        map.set(id, {
          flight: raw,
          lastPos: targetPos,
          basePos: targetPos,
          headingDeg,
          speedKnots,
          updatedAt: now,
          contrail: newContrail,
        });
      } else {
        map.set(id, {
          flight: raw,
          lastPos: targetPos,
          basePos: targetPos,
          headingDeg,
          speedKnots,
          updatedAt: now,
          contrail: [targetPos],
        });
      }
    }

    // Clean up stale flights
    for (const id of Array.from(map.keys())) {
      if (!currentHexes.has(id)) {
        map.delete(id);
      }
    }
  }, [rawFlights, enabled]);

  // 60 FPS requestAnimationFrame loop for continuous dead reckoning
  useEffect(() => {
    if (!enabled) return;

    let animId: number;
    let lastFrameTime = performance.now();

    const renderLoop = (frameTime: number) => {
      const dt = (frameTime - lastFrameTime) / 1000;
      lastFrameTime = frameTime;

      const map = stateRef.current;
      if (map.size === 0) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const updatedList: InterpolatedFlight[] = [];

      for (const [id, state] of map.entries()) {
        const elapsedSec = (frameTime - state.updatedAt) / 1000;
        // Nautical miles traveled since last API update
        const nm = (state.speedKnots * elapsedSec) / 3600;
        const headingRad = (state.headingDeg * Math.PI) / 180;

        const baseLat = state.basePos[1];
        const baseLon = state.basePos[0];

        const deltaLat = (nm * Math.cos(headingRad)) / 60;
        const deltaLon = (nm * Math.sin(headingRad)) / (60 * Math.cos((baseLat * Math.PI) / 180));

        const currentLon = baseLon + deltaLon;
        const currentLat = baseLat + deltaLat;
        const currentPos: [number, number] = [currentLon, currentLat];
        state.lastPos = currentPos;

        const altFt = state.flight.baro_altitude ? Math.round(state.flight.baro_altitude * 3.28084) : undefined;
        const fl = altFt ? `FL${Math.round(altFt / 100)}` : undefined;

        updatedList.push({
          ...state.flight,
          longitude: currentLon,
          latitude: currentLat,
          currentPosition: currentPos,
          contrailPath: [...state.contrail, currentPos],
          altitudeFt: altFt,
          flightLevel: fl,
          speedKnots: state.speedKnots,
        } as InterpolatedFlight);
      }

      setFlights(updatedList);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [enabled]);

  return flights;
}
