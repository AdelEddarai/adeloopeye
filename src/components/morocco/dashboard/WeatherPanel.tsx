'use client';

import { useMemo } from 'react';
import { CloudSun, Droplets, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MoroccoWeather } from '@/server/lib/api-clients/morocco-local-data';

type WeatherPanelProps = {
  weather?: MoroccoWeather[];
};

export function WeatherPanel({ weather = [] }: WeatherPanelProps) {
  const alerts = useMemo(() => weather.filter(w => w.alert), [weather]);

  const alertColor = (type: string) => {
    switch (type) {
      case 'HEAT': return 'bg-red-500/10 border-red-500/40 text-red-400';
      case 'WIND': return 'bg-amber-500/10 border-amber-500/40 text-amber-400';
      case 'STORM': return 'bg-sky-500/10 border-sky-500/40 text-sky-400';
      default: return 'bg-zinc-500/10 border-zinc-500/40 text-zinc-400';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CloudSun className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Open-Meteo · {weather.length} cities</span>
        {alerts.length > 0 && (
          <Badge variant="outline" className="text-[8px] bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse">
            ⚠ {alerts.length} ACTIVE ALERTS
          </Badge>
        )}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
        {weather.map(w => (
          <Card key={w.city} className={`bg-zinc-900/40 border-zinc-800 ${w.alert ? 'border-amber-500/40' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-zinc-300 truncate">{w.city}</span>
                {w.alert && (
                  <Badge variant="outline" className={`text-[7px] px-1 ${alertColor(w.alert.type)}`}>{w.alert.type}</Badge>
                )}
              </div>
              <div className="flex items-end gap-1 mb-1.5">
                <span className="text-2xl font-bold mono text-white leading-none">{w.temperature}°</span>
                <span className="text-[10px] text-zinc-500">{w.condition}</span>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-zinc-500 mono">
                <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" />{w.humidity}%</span>
                <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-cyan-400" />{w.windSpeed} km/h</span>
              </div>
              {w.alert && (
                <p className="text-[8px] text-amber-400/90 mt-1.5 mono">{w.alert.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {weather.length === 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6 text-center text-[10px] text-zinc-600 font-mono">WEATHER UNAVAILABLE</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
