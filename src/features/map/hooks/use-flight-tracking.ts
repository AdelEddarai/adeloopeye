'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Asset } from '@/data/map-data';

export type TrackedFlight = {
  icao24: string;
  callsign: string;
  position: [number, number];
  heading: number;
  altitude: number | null;
  velocity: number | null;
};

/**
 * Hook for real-time flight tracking
 * - Polls flight data every 10 seconds
 * - Allows tracking a specific flight
 * - Provides smooth position updates
 */
export function useFlightTracking(conflictId: string) {
  const [flights, setFlights] = useState<Asset[]>([]);
  const [trackedFlight, setTrackedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch flights from API
  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/conflicts/${conflictId}/map/data`);
      if (!response.ok) throw new Error('Failed to fetch flights');
      
      const data = await response.json();
      setFlights(data.assets || []);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch flights:', error);
      setIsLoading(false);
    }
  }, [conflictId]);

  // Start polling
  useEffect(() => {
    fetchFlights(); // Initial fetch

    // Poll every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchFlights();
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFlights]);

  // Track a specific flight
  const trackFlight = useCallback((icao24: string | null) => {
    setTrackedFlight(icao24);
  }, []);

  // Get tracked flight data
  const getTrackedFlightData = useCallback((): Asset | null => {
    if (!trackedFlight) return null;
    return flights.find(f => f.id.includes(trackedFlight)) || null;
  }, [trackedFlight, flights]);

  // Force refresh
  const refresh = useCallback(() => {
    fetchFlights();
  }, [fetchFlights]);

  return {
    flights,
    trackedFlight,
    trackFlight,
    getTrackedFlightData,
    isLoading,
    lastUpdate,
    refresh,
    flightCount: flights.length,
  };
}
