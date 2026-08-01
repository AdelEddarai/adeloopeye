import { useQuery } from '@tanstack/react-query';

import type { 
  MoroccoEvent, 
  MoroccoConnection, 
  MoroccoInfrastructure,
  MoroccoWeatherAlert 
} from '@/server/lib/morocco-intelligence-analyzer';
import type {
  MoroccoWeather,
  MoroccoTraffic,
  MoroccoCommodity,
  MoroccoFire
} from '@/server/lib/api-clients/morocco-local-data';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';

type MoroccoIntelligenceResponse = {
  events: MoroccoEvent[];
  connections: MoroccoConnection[];
  infrastructure: MoroccoInfrastructure[];
  weather: MoroccoWeather[];
  traffic: MoroccoTraffic[];
  commodities: MoroccoCommodity[];
  fires: MoroccoFire[];
  routes: MoroccoRoute[];
  weatherAlerts: MoroccoWeatherAlert[];
  summary: {
    totalEvents: number;
    criticalEvents: number;
    activeConnections: number;
    operationalInfrastructure: number;
    activeFires: number;
    weatherAlerts: number;
    trafficIncidents: number;
    totalRoutes: number;
    disruptedRoutes: number;
    eventsByType: Record<string, number>;
    sources: {
      rss: number;
      api: number;
      total: number;
    };
  };
  timestamp: string;
  error?: string;
};

export function useMoroccoIntelligence(enabled: boolean = false) {
  return useQuery({
    queryKey: ['morocco-intelligence'],
    queryFn: async (): Promise<MoroccoIntelligenceResponse> => {
      try {
        const res = await fetch('/api/v1/morocco/intelligence', {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch Morocco intelligence: ${res.status}`);
        }
        
        const json = await res.json();
        
        // Unwrap the API response envelope
        if (json.ok && json.data) {
          return json.data;
        }
        
        // If response doesn't have expected structure, return it as-is
        return json;
      } catch (error) {
        throw error;
      }
    },
    enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: enabled ? 30 * 1000 : false,
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
  });
}
