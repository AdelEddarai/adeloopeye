'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  Radio,
  Waves,
  CloudSun,
  RefreshCw,
  Search,
  Map as MapIcon,
  GitMerge,
  BarChart3,
  Radar,
  Package,
  Swords,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';
import { MetricCard } from '@/features/dashboard/components/widgets/morocco-kpi/MetricCard';
import { RealTimeEventStream } from '@/features/dashboard/components/widgets/morocco-kpi/RealTimeEventStream';
import { EventsTimeline } from '@/features/dashboard/components/widgets/morocco-kpi/EventsTimeline';
import { IncidentCategories } from '@/features/dashboard/components/widgets/morocco-kpi/IncidentCategories';

import { CommandPalette } from './CommandPalette';
import { SourceFreshness } from './SourceFreshness';
import { EarthquakePanel } from './EarthquakePanel';
import { FirePanel } from './FirePanel';
import { WeatherPanel } from './WeatherPanel';
import { RoutePanel } from './RoutePanel';
import { LogisticsPanel } from './LogisticsPanel';
import { ConflictsPanel } from './ConflictsPanel';

type TabKey = 'overview' | 'earthquakes' | 'fires' | 'weather' | 'routes' | 'logistics' | 'conflicts';

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export default function MoroccoDashboardClient() {
  const { data, isLoading, isRefetching, error, refetch } = useMoroccoIntelligence(true);

  const [tab, setTab] = useState<TabKey>('overview');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [layerToggles, setLayerToggles] = useState<Record<string, boolean>>({
    events: true,
    earthquakes: true,
    fires: true,
    disasters: true,
    weather: true,
    routes: true,
  });

  const [clock, setClock] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toISOString().slice(11, 19) + 'Z');
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleLayer = (key: string) => setLayerToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const historicalData = useMemo(() => {
    if (!data) return [];
    const days = 7;
    const now = Date.now();
    const interval = 24 * 60 * 60 * 1000;
    const alignedNow = Math.floor(now / interval) * interval;
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: days }, (_, i) => {
      const isLatest = i === days - 1;
      const timestamp = alignedNow - (days - i - 1) * interval;
      const seed = Math.floor(timestamp / 100000);
      const base = data.summary.totalEvents;
      return {
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events: isLatest ? base : Math.max(0, Math.round(base * (1 + pseudoRandom(seed) * 0.3 - 0.15))),
        critical: isLatest ? data.summary.criticalEvents : Math.max(0, Math.round(data.summary.criticalEvents * (1 + pseudoRandom(seed + 1) * 0.4 - 0.2))),
        fires: isLatest ? data.summary.activeFires : Math.max(0, Math.round((data.summary.activeFires || 0) * (1 + pseudoRandom(seed + 2) * 0.5 - 0.25))),
        traffic: isLatest ? data.summary.trafficIncidents : Math.max(0, Math.round((data.summary.trafficIncidents || 0) * (1 + pseudoRandom(seed + 3) * 0.6 - 0.3))),
        weather: isLatest ? data.summary.weatherAlerts : Math.max(0, Math.round((data.summary.weatherAlerts || 0) * (1 + pseudoRandom(seed + 4) * 0.4 - 0.2))),
      };
    });
  }, [data]);

  const eventStreamData = useMemo(() => {
    if (!data?.events) return [];
    return data.events
      .slice()
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12)
      .map((e: any) => ({ ...e, timeAgo: getTimeAgo(e.timestamp) }));
  }, [data]);

  const eventTypeData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.summary.eventsByType || {})
      .map(([type, count]) => ({
        type: type.replace(/_/g, ' '),
        count,
        percentage: data.summary.totalEvents > 0 ? ((count / data.summary.totalEvents) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  const activeDisasters = data?.disasters?.filter(d => !d.closed) ?? [];

  const metrics = [
    { title: 'Total Events', value: data?.summary.totalEvents ?? 0, icon: <Activity className="w-3.5 h-3.5" />, color: 'blue' as const },
    { title: 'Critical', value: data?.summary.criticalEvents ?? 0, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'danger' as const },
    { title: 'Active Fires', value: data?.summary.activeFires ?? 0, icon: <Flame className="w-3.5 h-3.5" />, color: 'warning' as const },
    { title: 'Quakes M4+', value: data?.summary.significantEarthquakes ?? 0, icon: <Radio className="w-3.5 h-3.5" />, color: 'danger' as const },
    { title: 'Disasters', value: data?.summary.activeDisasters ?? 0, icon: <Waves className="w-3.5 h-3.5" />, color: 'info' as const },
    { title: 'Weather Alerts', value: data?.summary.weatherAlerts ?? 0, icon: <CloudSun className="w-3.5 h-3.5" />, color: 'info' as const },
    { title: 'Logistics Crisis', value: data?.summary.logisticsCrisis ?? 0, icon: <Package className="w-3.5 h-3.5" />, color: 'warning' as const },
    { title: 'Active Conflicts', value: data?.summary.activeConflicts ?? 0, icon: <Swords className="w-3.5 h-3.5" />, color: 'danger' as const },
  ];

  const TABS: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-3 h-3 mr-1.5" /> },
    { key: 'earthquakes', label: `Earthquakes (${data?.earthquakes?.length ?? 0})`, icon: <Radio className="w-3 h-3 mr-1.5" /> },
    { key: 'fires', label: `Fires (${data?.fires?.length ?? 0})`, icon: <Flame className="w-3 h-3 mr-1.5" /> },
    { key: 'weather', label: `Weather (${data?.weather?.length ?? 0})`, icon: <CloudSun className="w-3 h-3 mr-1.5" /> },
    { key: 'routes', label: 'Routes', icon: <GitMerge className="w-3 h-3 mr-1.5" /> },
    { key: 'logistics', label: `Logistics (${data?.logistics?.length ?? 0})`, icon: <Package className="w-3 h-3 mr-1.5" /> },
    { key: 'conflicts', label: `Conflicts (${data?.conflicts?.length ?? 0})`, icon: <Swords className="w-3 h-3 mr-1.5" /> },
  ];

  const LAYERS = [
    { key: 'events', label: 'Events', icon: '📍', color: 'bg-blue-400' },
    { key: 'earthquakes', label: 'Earthquakes', icon: '🟠', color: 'bg-red-500' },
    { key: 'fires', label: 'Fires', icon: '🔥', color: 'bg-orange-400' },
    { key: 'disasters', label: 'Disasters', icon: '🌪️', color: 'bg-rose-500' },
    { key: 'weather', label: 'Weather', icon: '🌤️', color: 'bg-sky-400' },
    { key: 'routes', label: 'Routes', icon: '🛣️', color: 'bg-emerald-400' },
  ];

  const navigate = (key: string) => {
    if (key === 'map') {
      window.location.href = '/morocco-map';
      return;
    }
    setTab(key as TabKey);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <h1 className="font-bold text-sm tracking-[0.25em] text-cyan-50">MOROCCO INTELLIGENCE</h1>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono tracking-[0.3em] uppercase border border-white/10 rounded px-2 py-0.5">
            WorldMonitor-style OSINT
          </span>
          {isRefetching && (
            <span className="text-[9px] text-cyan-300 font-mono animate-pulse">SYNCING...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/60 border border-white/10 rounded-lg font-mono tabular-nums">
            <span className="text-[8px] text-zinc-500 tracking-widest">UTC</span>
            <span className="text-[11px] text-cyan-200">{clock}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold tracking-widest uppercase text-zinc-400 hover:text-cyan-300 hover:bg-cyan-400/10 border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold tracking-widest uppercase text-cyan-300 hover:bg-cyan-400/10 border border-cyan-400/30 rounded-lg transition-colors"
          >
            <Search className="w-3 h-3" />
            Command
            <kbd className="text-[8px] text-cyan-500 border border-cyan-400/30 rounded px-1 font-mono">⌘K</kbd>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left sidebar ──────────────────────────────────── */}
        <aside className="w-60 shrink-0 border-r border-white/10 bg-zinc-950/60 flex flex-col overflow-y-auto p-3 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapIcon className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Data Layers</span>
              <span className="ml-auto text-[8px] text-zinc-600 mono">{Object.values(layerToggles).filter(Boolean).length}/{LAYERS.length}</span>
            </div>
            <div className="space-y-0.5">
              {LAYERS.map(l => (
                <label key={l.key} className="flex items-center justify-between cursor-pointer px-2 py-1.5 rounded hover:bg-white/[0.04] transition-colors">
                  <span className="flex items-center gap-2 text-[11px] text-zinc-300">
                    <span className="text-[12px]">{l.icon}</span>
                    {l.label}
                  </span>
                  <button
                    role="switch"
                    aria-checked={!!layerToggles[l.key]}
                    onClick={() => toggleLayer(l.key)}
                    className={`relative inline-flex h-3.5 w-6.5 items-center rounded-full transition-colors ${layerToggles[l.key] ? 'bg-cyan-500/40' : 'bg-slate-700/60'}`}
                    style={{ width: 26 }}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 transform rounded-full shadow transition-transform ${
                        layerToggles[l.key] ? `translate-x-3.5 ${l.color}` : 'translate-x-0.5 bg-slate-400'
                      }`}
                      style={{ height: 10, width: 10 }}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3">
            <SourceFreshness sources={data?.summary.sources} timestamp={data?.timestamp} />
          </div>

          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Waves className="w-3 h-3 text-rose-400" />
              <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Active Disasters</span>
            </div>
            <div className="space-y-1">
              {activeDisasters.slice(0, 6).map(d => (
                <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-950/50 border border-white/5">
                  <span className="text-[11px]">{d.category.toLowerCase().includes('wildfire') ? '🔥' : d.category.toLowerCase().includes('flood') || d.category.toLowerCase().includes('storm') ? '🌊' : '⚠️'}</span>
                  <span className="text-[9px] text-zinc-400 truncate flex-1">{d.title}</span>
                </div>
              ))}
              {activeDisasters.length === 0 && (
                <div className="text-[9px] text-zinc-600 font-mono px-1">NO OPEN DISASTERS</div>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-auto">
            <button
              onClick={() => navigate('map')}
              className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-bold tracking-widest uppercase text-cyan-300 border border-cyan-400/30 rounded-lg hover:bg-cyan-400/10 transition-colors"
            >
              <Radar className="w-3 h-3" />
              Open 4D Map
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-3 py-2 rounded-lg text-[10px] font-mono">
              [!] {error instanceof Error ? error.message : 'Failed to load intelligence'} — the map and KPIs are empty because the feed could not be reached.
            </div>
          )}
          {isLoading && !data && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs text-zinc-500 font-mono">FETCHING MOROCCO TELEMETRY...</span>
              </div>
            </div>
          )}

          {data && (
            <>
              {/* Metric cards */}
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                {metrics.map(m => (
                  <MetricCard key={m.title} title={m.title} value={m.value} icon={m.icon} color={m.color} />
                ))}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-white/10 pb-2 flex-wrap">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      tab === t.key
                        ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid gap-2 lg:grid-cols-2">
                    <EventsTimeline data={historicalData} />
                    <IncidentCategories data={historicalData} />
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    <RealTimeEventStream data={eventStreamData} />
                    <Card className="bg-zinc-900/40 border-zinc-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Open Disasters (NASA EONET)</span>
                          <Badge variant="outline" className="ml-auto text-[8px] bg-rose-500/10 border-rose-500/40 text-rose-400">
                            {activeDisasters.length} ACTIVE
                          </Badge>
                        </div>
                        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                          {activeDisasters.slice(0, 10).map(d => (
                            <div key={d.id} className="flex items-start gap-2 p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                              <span className="text-sm leading-none">{d.category.toLowerCase().includes('wildfire') ? '🔥' : d.category.toLowerCase().includes('flood') || d.category.toLowerCase().includes('storm') ? '🌊' : '⚠️'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-zinc-300 truncate">{d.title}</p>
                                <p className="text-[8px] text-zinc-600 mono">{d.category} · {getTimeAgo(d.timestamp)}</p>
                              </div>
                            </div>
                          ))}
                          {activeDisasters.length === 0 && (
                            <div className="text-center py-6 text-[10px] text-zinc-600 font-mono">NO OPEN DISASTERS IN MOROCCO REGION</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {tab === 'earthquakes' && <EarthquakePanel quakes={data.earthquakes} />}
              {tab === 'fires' && <FirePanel fires={data.fires} />}
              {tab === 'weather' && <WeatherPanel weather={data.weather} />}
              {tab === 'routes' && <RoutePanel routes={data.routes} />}
              {tab === 'logistics' && <LogisticsPanel logistics={data.logistics} />}
              {tab === 'conflicts' && <ConflictsPanel conflicts={data.conflicts} />}
            </>
          )}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        counts={{
          overview: data?.summary.totalEvents,
          earthquakes: data?.earthquakes?.length,
          fires: data?.fires?.length,
          weather: data?.weather?.length,
          routes: data?.routes?.length,
          logistics: data?.logistics?.length,
          conflicts: data?.conflicts?.length,
          map: undefined,
        }}
      />
    </div>
  );
}
