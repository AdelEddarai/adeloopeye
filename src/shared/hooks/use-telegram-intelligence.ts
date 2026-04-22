import { useQuery } from '@tanstack/react-query';
import type { TelegramIntelligenceResponse } from '@/server/lib/telegram-intelligence-analyzer';

/**
 * Hook for Morocco Telegram intelligence
 */
export function useTelegramMoroccoIntelligence(enabled: boolean = true) {
  return useQuery({
    queryKey: ['telegram-morocco-intelligence'],
    queryFn: async (): Promise<TelegramIntelligenceResponse> => {
      const res = await fetch('/api/v1/telegram/morocco');
      if (!res.ok) throw new Error('Failed to fetch Morocco Telegram intelligence');
      
      const json = await res.json();
      
      // Unwrap the API response envelope
      if (json.ok && json.data) {
        return json.data;
      }
      
      return json;
    },
    enabled,
    refetchInterval: enabled ? 2 * 60 * 1000 : false, // Refetch every 2 minutes when enabled
    staleTime: 60 * 1000, // Consider stale after 1 minute
  });
}

/**
 * Hook for global Telegram intelligence
 */
export function useTelegramGlobalIntelligence(enabled: boolean = true) {
  return useQuery({
    queryKey: ['telegram-global-intelligence'],
    queryFn: async (): Promise<TelegramIntelligenceResponse> => {
      const res = await fetch('/api/v1/telegram/global');
      if (!res.ok) throw new Error('Failed to fetch global Telegram intelligence');
      
      const json = await res.json();
      
      // Unwrap the API response envelope
      if (json.ok && json.data) {
        return json.data;
      }
      
      return json;
    },
    enabled,
    refetchInterval: enabled ? 3 * 60 * 1000 : false, // Refetch every 3 minutes when enabled
    staleTime: 90 * 1000, // Consider stale after 90 seconds
  });
}