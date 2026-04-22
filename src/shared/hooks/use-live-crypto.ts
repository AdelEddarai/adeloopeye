import { useQuery } from '@tanstack/react-query';

import type { CryptoQuote } from '@/server/lib/api-clients/crypto-client';

type CryptoResponse = {
  quotes: CryptoQuote[];
  totalMarketCap: number;
  count: number;
  fetchedAt: string;
};

export function useLiveCrypto(symbols?: string[]) {
  return useQuery({
    queryKey: ['live-crypto', symbols],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (symbols && symbols.length > 0) {
        params.set('symbols', symbols.join(','));
      }

      const res = await fetch(`/api/v1/live/crypto?${params}`);
      if (!res.ok) throw new Error('Failed to fetch crypto');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as CryptoResponse;
    },
    refetchInterval: 30_000, // Refetch every 30 seconds
    staleTime: 15_000, // Consider stale after 15 seconds
  });
}
