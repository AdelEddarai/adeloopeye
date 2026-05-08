import { useQuery } from '@tanstack/react-query';
import type { LiveAlert } from '@/app/api/v1/live/alerts/route';

type LiveAlertsResponse = {
  alerts: LiveAlert[];
  count: number;
  fetchedAt: string;
  error?: string;
};

/**
 * Hook for fetching real-time breaking news alerts
 * Focuses on Morocco and global critical events
 */
export function useLiveAlerts(enabled: boolean = true) {
  return useQuery({
    queryKey: ['live-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/live/alerts');
      if (!res.ok) throw new Error('Failed to fetch live alerts');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as LiveAlertsResponse;
    },
    enabled,
    refetchInterval: enabled ? 60_000 : false, // Refetch every 60 seconds
    staleTime: 30_000, // Consider stale after 30 seconds
  });
}
