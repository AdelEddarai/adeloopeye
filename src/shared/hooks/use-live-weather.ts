import { useQuery } from '@tanstack/react-query';

import type { WeatherData } from '@/server/lib/api-clients/zyla-client';

type WeatherResponse = {
  weather: WeatherData;
  location: string;
  coordinates: { lat: number; lon: number };
  fetchedAt: string;
};

export function useLiveWeather(preset?: string, coords?: { lat: number; lon: number }) {
  return useQuery({
    queryKey: ['live-weather', preset, coords],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (preset) {
        params.set('preset', preset);
      } else if (coords) {
        params.set('lat', String(coords.lat));
        params.set('lon', String(coords.lon));
      } else {
        params.set('preset', 'tehran'); // Default
      }

      const res = await fetch(`/api/v1/live/weather?${params}`);
      if (!res.ok) throw new Error('Failed to fetch weather');

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || 'API error');

      return json.data as WeatherResponse;
    },
    refetchInterval: 600_000, // Refetch every 10 minutes
    staleTime: 300_000, // Consider stale after 5 minutes
    enabled: !!(preset || coords), // Only run if we have location
  });
}
