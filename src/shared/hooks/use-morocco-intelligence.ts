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
import type { MoroccoEarthquake } from '@/server/lib/api-clients/usgs-earthquake-client';
import type { MoroccoDisaster } from '@/server/lib/api-clients/eonet-client';
import type { LogisticsEntry } from '@/server/lib/api-clients/morocco-logistics';
import type { ConflictEntry } from '@/server/lib/api-clients/morocco-conflicts';

type MoroccoIntelligenceResponse = {
  events: MoroccoEvent[];
  connections: MoroccoConnection[];
  infrastructure: MoroccoInfrastructure[];
  weather: MoroccoWeather[];
  traffic: MoroccoTraffic[];
  commodities: MoroccoCommodity[];
  fires: MoroccoFire[];
  routes: MoroccoRoute[];
  earthquakes: MoroccoEarthquake[];
  disasters: MoroccoDisaster[];
  logistics: LogisticsEntry[];
  conflicts: ConflictEntry[];
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
    totalEarthquakes: number;
    significantEarthquakes: number;
    activeDisasters: number;
    logisticsCrisis: number;
    activeConflicts: number;
    eventsByType: Record<string, number>;
    sources: {
      rss: number;
      api: number;
      telegram: number;
      earthquakes: number;
      eonet: number;
      gdelt: number;
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const res = await fetch('/api/v1/morocco/intelligence', {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unknown error');
          throw new Error(`Failed to fetch Morocco intelligence: ${res.status}`);
        }
        
        const json = await res.json();
        
        // Unwrap the API response envelope
        if (json.ok && json.data) {
          return json.data;
        }
        
        // If response doesn't have expected structure, return it as-is
        return json;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out - server taking too long to respond');
        }
        throw error;
      }
    },
    enabled,
    retry: 2, // Reduced from 3 to 2 retries
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000), // Faster retries, max 10s
    refetchInterval: enabled ? 60 * 1000 : false, // Increased from 30s to 60s to reduce load
    staleTime: 30 * 1000, // Increased from 15s to 30s
    gcTime: 120 * 1000, // Increased from 60s to 120s
  });
}
