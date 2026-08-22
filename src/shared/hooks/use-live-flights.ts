import { useQuery } from '@tanstack/react-query';

import type { OpenSkyFlight } from '@/server/lib/api-clients/adsbfi-client';

type FlightsResponse = {
  flights: OpenSkyFlight[];
  bbox: [number, number, number, number];
  count: number;
  fetchedAt: string;
  source?: string;
  scope?: string;
  error?: string;
};

export function useLiveFlights(bbox?: [number, number, number, number], enabled: boolean = true, global: boolean = true, scope?: 'morocco') {
  return useQuery({
    queryKey: ['live-flights', bbox, global, scope],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bbox) {
        params.set('bbox', bbox.join(','));
      }
      if (global) {
        params.set('global', 'true');
      }
      if (scope) {
        params.set('scope', scope);
      }

      try {
        const res = await fetch(`/api/v1/live/flights?${params}`);
        if (!res.ok) {
          return { flights: [], count: 0, fetchedAt: new Date().toISOString(), bbox: bbox || [0, 0, 0, 0] } as FlightsResponse;
        }

        const json = await res.json();
        if (!json.ok || !json.data) {
          return { flights: [], count: 0, fetchedAt: new Date().toISOString(), bbox: bbox || [0, 0, 0, 0] } as FlightsResponse;
        }

        return json.data as FlightsResponse;
      } catch {
        return { flights: [], count: 0, fetchedAt: new Date().toISOString(), bbox: bbox || [0, 0, 0, 0] } as FlightsResponse;
      }
    },
    enabled, // Only fetch when enabled
    refetchInterval: enabled ? 15_000 : false, // Refetch every 15s when enabled
    staleTime: 10_000,
    retry: 1,
  });
}
