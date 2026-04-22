import { useQuery } from '@tanstack/react-query';

import type { BlacklistIP } from '@/server/lib/api-clients/abuseipdb-client';

type ThreatsResponse = {
  blacklist: BlacklistIP[];
  byCountry: Record<string, BlacklistIP[]>;
  count: number;
  confidence: number;
  fetchedAt: string;
};

export function useLiveThreats(limit: number = 100, confidence: number = 90) {
  return useQuery({
    queryKey: ['live-threats', limit, confidence],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        confidence: String(confidence),
      });

      const res = await fetch(`/api/v1/live/threats?${params}`);
      if (!res.ok) throw new Error('Failed to fetch threats');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as ThreatsResponse;
    },
    refetchInterval: 300_000, // Refetch every 5 minutes
    staleTime: 180_000, // Consider stale after 3 minutes
  });
}
