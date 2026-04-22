import { useQuery } from '@tanstack/react-query';

import type { NewsArticle } from '@/server/lib/api-clients/newsapi-client';

type NewsResponse = {
  articles: NewsArticle[];
  query: string;
  count: number;
  fetchedAt: string;
};

export function useLiveNews(query: string = 'iran israel conflict', limit: number = 20) {
  return useQuery({
    queryKey: ['live-news', query, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        limit: String(limit),
      });

      const res = await fetch(`/api/v1/live/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch news');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as NewsResponse;
    },
    refetchInterval: 60_000, // Refetch every 60 seconds
    staleTime: 30_000, // Consider stale after 30 seconds
  });
}
