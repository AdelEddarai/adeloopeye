'use client';

import { useQuery } from '@tanstack/react-query';

export type CommodityPrice = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  category: 'Energy' | 'Metals';
  timestamp: string;
};

type CommodityPricesResponse = {
  commodities: CommodityPrice[];
  timestamp: string;
};

async function fetchCommodityPrices(): Promise<CommodityPricesResponse> {
  const res = await fetch('/api/v1/live/commodity-prices', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch commodity prices');
  const json = await res.json();
  
  // Unwrap the { ok: true, data: {...} } envelope
  return json.ok ? json.data : json;
}

export function useCommodityPrices() {
  return useQuery({
    queryKey: ['commodity-prices'],
    queryFn: fetchCommodityPrices,
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
