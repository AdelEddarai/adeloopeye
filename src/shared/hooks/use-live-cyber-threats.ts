import { useQuery } from '@tanstack/react-query';

export type CyberThreat = {
  id: string;
  type: 'DDOS' | 'MALWARE' | 'INTRUSION' | 'PHISHING' | 'RANSOMWARE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  target: string;
  source: string;
  location: string;
  timestamp: string;
  position?: [number, number]; // For map display
};

export type CyberThreatsResponse = {
  threats: CyberThreat[];
  stats: {
    total: number;
    ddos: number;
    malware: number;
    intrusion: number;
    phishing: number;
    ransomware: number;
  };
  timestamp: string;
  sources: Array<{ name: string; url: string }>;
};

export function useLiveCyberThreats(enabled: boolean = true) {
  const query = useQuery({
    queryKey: ['live-cyber-threats'],
    queryFn: async (): Promise<CyberThreatsResponse> => {
      const response = await fetch('/api/v1/live/cyber-threats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cyber threats');
      const json = await response.json();
      
      // Unwrap the { ok: true, data: {...} } envelope
      const data = json.ok ? json.data : json;
      return data;
    },
    enabled, // Only fetch when enabled
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: enabled ? 15000 : false, // Only refetch when enabled
    refetchIntervalInBackground: enabled,
    refetchOnMount: enabled,
    refetchOnWindowFocus: enabled,
    retry: 3,
  });

  return {
    ...query,
    lastUpdate: query.data?.timestamp,
  };
}
