'use client';

import { useQuery } from '@tanstack/react-query';
import type { MaritimeVessel } from '@/data/map-data';

export type LiveVesselsResponse = {
  vessels: MaritimeVessel[];
  count: number;
  fetchedAt: string;
};

export function useLiveVessels(
  enabled: boolean = true,
  scope?: string,
  category?: string,
  pollIntervalMs: number = 8000
) {
  return useQuery<LiveVesselsResponse>({
    queryKey: ['live-vessels', scope, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (scope) params.set('scope', scope);
      if (category) params.set('category', category);

      const url = `/api/v1/live/vessels${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch live vessels: ${res.statusText}`);
      }
      const json = await res.json();
      return json.data || json;
    },
    enabled,
    refetchInterval: pollIntervalMs,
    staleTime: 5000,
  });
}
