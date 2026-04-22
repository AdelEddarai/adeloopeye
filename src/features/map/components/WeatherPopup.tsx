'use client';

import { useQuery } from '@tanstack/react-query';
import { Cloud, CloudRain, CloudSnow, Droplets, Eye, Gauge, Sun, Wind } from 'lucide-react';

import { api } from '@/shared/lib/query/client';

import type { WeatherData } from '@/server/lib/api-clients/openweather-client';

type Props = {
  cityName: string;
  lat: number;
  lon: number;
};

export function WeatherPopup({ cityName, lat, lon }: Props) {
  const { data: weather, isLoading } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => api.get<WeatherData>(`/live/weather?lat=${lat}&lon=${lon}`),
    staleTime: 1800000, // 30 minutes
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-[var(--bg-app)] border border-[var(--bd)] rounded" style={{ minWidth: 280 }}>
        <div className="text-[var(--t3)] text-sm mono">Loading weather...</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = () => {
    const main = weather.weather.main.toLowerCase();
    if (main.includes('rain')) return <CloudRain className="w-12 h-12 text-[var(--info)]" />;
    if (main.includes('snow')) return <CloudSnow className="w-12 h-12 text-[var(--blue-l)]" />;
    if (main.includes('cloud')) return <Cloud className="w-12 h-12 text-[var(--t3)]" />;
    return <Sun className="w-12 h-12 text-[var(--warning)]" />;
  };

  const getWeatherEmoji = () => {
    const main = weather.weather.main;
    if (main === 'Clear') return '☀️';
    if (main === 'Clouds') return '☁️';
    if (main === 'Rain') return '🌧️';
    if (main === 'Drizzle') return '🌦️';
    if (main === 'Thunderstorm') return '⛈️';
    if (main === 'Snow') return '❄️';
    if (main === 'Mist' || main === 'Fog') return '🌫️';
    return '🌡️';
  };

  return (
    <div className="bg-[var(--bg-app)] border border-[var(--bd)] rounded overflow-hidden" style={{ minWidth: 320, maxWidth: 360 }}>
      {/* Header */}
      <div className="bg-[var(--bg-1)] border-b border-[var(--bd)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[var(--t1)] font-bold text-base mono">{cityName}</h3>
            <p className="text-[var(--t4)] text-xs mono">{weather.country}</p>
          </div>
          <div className="text-4xl">{getWeatherEmoji()}</div>
        </div>
      </div>

      {/* Main Weather */}
      <div className="p-4 bg-[var(--bg-2)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-[var(--t1)] mono">{weather.temperature}°</div>
            <div className="text-[var(--t3)] text-sm mt-1 capitalize">{weather.weather.description}</div>
            <div className="text-[var(--t4)] text-xs mono mt-1">
              Feels like {weather.feelsLike}°
            </div>
          </div>
          {getWeatherIcon()}
        </div>

        {/* Min/Max */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[var(--t4)] mono">H:</span>
            <span className="text-[var(--t2)] font-bold mono">{weather.tempMax}°</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[var(--t4)] mono">L:</span>
            <span className="text-[var(--t2)] font-bold mono">{weather.tempMin}°</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-px bg-[var(--bd)]">
        <WeatherDetail
          icon={<Wind className="w-4 h-4" />}
          label="Wind"
          value={`${weather.windSpeed} m/s`}
        />
        <WeatherDetail
          icon={<Droplets className="w-4 h-4" />}
          label="Humidity"
          value={`${weather.humidity}%`}
        />
        <WeatherDetail
          icon={<Gauge className="w-4 h-4" />}
          label="Pressure"
          value={`${weather.pressure} hPa`}
        />
        <WeatherDetail
          icon={<Eye className="w-4 h-4" />}
          label="Visibility"
          value={`${(weather.visibility / 1000).toFixed(1)} km`}
        />
        <WeatherDetail
          icon={<Cloud className="w-4 h-4" />}
          label="Cloudiness"
          value={`${weather.cloudiness}%`}
        />
        {weather.rain && (
          <WeatherDetail
            icon={<CloudRain className="w-4 h-4" />}
            label="Rain (1h)"
            value={`${weather.rain['1h'] || 0} mm`}
          />
        )}
        {weather.snow && (
          <WeatherDetail
            icon={<CloudSnow className="w-4 h-4" />}
            label="Snow (1h)"
            value={`${weather.snow['1h'] || 0} mm`}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-[var(--bg-1)] border-t border-[var(--bd)] text-xs text-[var(--t4)] mono">
        Updated: {new Date(weather.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function WeatherDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-app)] p-3">
      <div className="flex items-center gap-2 mb-1 text-[var(--t4)]">
        {icon}
        <span className="text-xs mono">{label}</span>
      </div>
      <div className="text-[var(--t2)] font-bold text-sm mono">{value}</div>
    </div>
  );
}
