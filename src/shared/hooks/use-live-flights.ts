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

export function useLiveFlights(bbox?: [number, number, number, number], enabled: boolean = true, global: boolean = true) {
  return useQuery({
    queryKey: ['live-flights', bbox, global],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bbox) {
        params.set('bbox', bbox.join(','));
      }
      if (global) {
        params.set('global', 'true');
      }

      const res = await fetch(`/api/v1/live/flights?${params}`);
      if (!res.ok) throw new Error('Failed to fetch flights');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as FlightsResponse;
    },
    enabled, // Only fetch when enabled
    refetchInterval: enabled ? 10_000 : false, // Only refetch when enabled
    staleTime: 5_000, // Consider stale after 5 seconds
  });
}
