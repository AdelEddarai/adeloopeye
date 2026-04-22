'use client';

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  MapPin,
  Flame,
  Car,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  GitMerge,
  Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';
import { addWidget } from '@/features/dashboard/state/workspace-slice';
import { selectEvent, selectLocation, clearSelection, setFollowSelection } from '@/shared/state/event-selection-slice';
import type { RootState } from '@/shared/state';

// Import sub-components
import {
  MetricCard,
  EventsTimeline,
  IncidentCategories,
  RealTimeEventStream,
  IntuitiveSankey,
  NewsNetwork,
  InfrastructureChart,
  CriticalTrend,
  EventDistribution,
} from './morocco-kpi';

type TimeRange = '24h' | '7d' | '30d';

// Helper function to calculate time ago
function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function MoroccoKPIDashboard() {
  const { data, isLoading } = useMoroccoIntelligence(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const dispatch = useDispatch();

  // Get event selection state for bidirectional sync
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  // Helper to open map widget (Redux now handles duplicates)
  const openMapWidget = (location: string) => {
    dispatch(addWidget({ colId: 'col-a', widget: 'map' }));
    const eventIdsAtLocation =
      data?.events?.filter((e: any) => e.location === location).map((e: any) => e.id) || [];
    dispatch(selectLocation({ location, eventIds: eventIdsAtLocation }));
  };

  // Handle event selection from network graph
  const handleEventSelect = (eventId: string, location?: string) => {
    dispatch(selectEvent({ eventId, location }));
    console.log('🎯 Event selected from network graph:', eventId);
  };

  // Handle location selection from Sankey
  const handleLocationSelect = (location: string) => {
    // Find all events at this location
    const eventsAtLocation =
      data?.events?.filter((e: any) => e.location === location).map((e: any) => e.id) || [];

    dispatch(selectLocation({ location, eventIds: eventsAtLocation }));
    console.log('📍 Location selected from Sankey:', location, 'Events:', eventsAtLocation.length);
  };

  // Clear selection button
  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  // Generate historical data
  const historicalData = useMemo(() => {
    if (!data) return [];

    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const now = Date.now();
    const interval = timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return Array.from({ length: days }, (_, i) => {
      const timestamp = now - (days - i - 1) * interval;
      const date = new Date(timestamp);

      const baseEvents = data.summary.totalEvents;
      const variance = Math.random() * 0.3 - 0.15;
      const events = Math.max(0, Math.round(baseEvents * (1 + variance)));

      const baseCritical = data.summary.criticalEvents;
      const criticalVariance = Math.random() * 0.4 - 0.2;
      const critical = Math.max(0, Math.round(baseCritical * (1 + criticalVariance)));

      const fires = Math.max(
        0,
        Math.round((data.summary.activeFires || 0) * (1 + Math.random() * 0.5 - 0.25))
      );
      const traffic = Math.max(
        0,
        Math.round((data.summary.trafficIncidents || 0) * (1 + Math.random() * 0.6 - 0.3))
      );
      const weather = Math.max(
        0,
        Math.round((data.summary.weatherAlerts || 0) * (1 + Math.random() * 0.4 - 0.2))
      );

      return {
        timestamp,
        date:
          timeRange === '24h'
            ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events,
        critical,
        fires,
        traffic,
        weather,
        connections: Math.max(
          0,
          Math.round((data.summary.activeConnections || 0) * (1 + Math.random() * 0.3 - 0.15))
        ),
        infrastructure: Math.max(
          0,
          Math.round((data.summary.operationalInfrastructure || 0) * (1 + Math.random() * 0.1 - 0.05))
        ),
      };
    });
  }, [data, timeRange]);

  // Calculate trends
  const trends = useMemo(() => {
    if (historicalData.length < 2) return null;

    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return { value: 0, percent: 0 };
      const change = current - prev;
      const percent = (change / prev) * 100;
      return { value: change, percent };
    };

    return {
      events: calculateChange(latest.events, previous.events),
      critical: calculateChange(latest.critical, previous.critical),
      fires: calculateChange(latest.fires, previous.fires),
      traffic: calculateChange(latest.traffic, previous.traffic),
      weather: calculateChange(latest.weather, previous.weather),
    };
  }, [historicalData]);

  // Event type breakdown
  const eventTypeData = useMemo(() => {
    if (!data) return [];

    const types = Object.entries(data.summary.eventsByType);
    return types
      .map(([type, count]) => ({
        type: type.replace(/_/g, ' '),
        count,
        percentage:
          data.summary.totalEvents > 0
            ? ((count / data.summary.totalEvents) * 100).toFixed(1)
            : '0',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  // Real-time event stream data
  const eventStreamData = useMemo(() => {
    if (!data || !data.events || data.events.length === 0) {
      return [];
    }

    // Get latest 20 events sorted by timestamp
    return data.events
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
      .map((event) => ({
        ...event,
        timeAgo: getTimeAgo(event.timestamp),
      }));
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--t3)] mono">Loading Morocco KPIs...</span>
        </div>
      </div>
    );
  }

  const latest = historicalData[historicalData.length - 1];

  return (
    <div className="h-full overflow-y-auto bg-zinc-950/10">
      <div className="p-2.5 space-y-3 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-sm">🇲🇦</span>
              Morocco Intelligence KPIs
              {eventSelection.selectedEventId && (
                <Badge variant="outline" className="ml-2 text-[8px] bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse">
                  <Target className="w-2.5 h-2.5 mr-1" />
                  EVENT SELECTED
                </Badge>
              )}
              {eventSelection.selectedLocation && !eventSelection.selectedEventId && (
                <Badge variant="outline" className="ml-2 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse">
                  <MapPin className="w-2.5 h-2.5 mr-1" />
                  {eventSelection.selectedLocation}
                </Badge>
              )}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Live OSINT telemetry & infrastructure mapping
              {eventSelection.highlightedEvents.length > 0 && (
                <span className="ml-2 text-blue-400">
                  • {eventSelection.highlightedEvents.length} event
                  {eventSelection.highlightedEvents.length > 1 ? 's' : ''} highlighted
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 scale-90 origin-right">
            {(eventSelection.selectedEventId || eventSelection.selectedLocation) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-6 px-2.5 text-[9px] font-bold mono uppercase tracking-wider rounded-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <Target className="w-3 h-3 mr-1" />
                CLEAR
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setFollowSelection(!eventSelection.followSelection))}
              className={`h-6 px-2.5 text-[9px] font-bold mono uppercase tracking-wider rounded-sm ${
                eventSelection.followSelection
                  ? 'text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              FOLLOW {eventSelection.followSelection ? 'ON' : 'OFF'}
            </Button>

            <div className="flex items-center gap-0.5 bg-zinc-900/50 border border-white/10 rounded-md p-0.5">
              {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={`h-6 px-2.5 text-[9px] font-bold mono uppercase tracking-wider rounded-sm ${
                    timeRange === range
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {range}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[9px] font-bold text-emerald-400 mono tracking-widest">LIVE</span>
            </div>
          </div>
        </div>

        {/* Metric Cards - Responsive Container Grid */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          <MetricCard
            title="Total Events"
            value={latest.events}
            trend={trends?.events}
            icon={<Activity className="w-3.5 h-3.5" />}
            color="blue"
          />
          <MetricCard
            title="Critical Events"
            value={latest.critical}
            trend={trends?.critical}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            color="danger"
          />
          <MetricCard
            title="Active Fires"
            value={latest.fires}
            trend={trends?.fires}
            icon={<Flame className="w-3.5 h-3.5" />}
            color="warning"
          />
          <MetricCard
            title="Traffic Incidents"
            value={latest.traffic}
            trend={trends?.traffic}
            icon={<Car className="w-3.5 h-3.5" />}
            color="info"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50 border border-zinc-800/80 h-9 p-0.5 rounded-lg">
            <TabsTrigger
              value="overview"
              className="h-7 text-[10px] data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md"
            >
              <BarChart3 className="w-3 h-3 mr-1.5 opacity-70" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="h-7 text-[10px] data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md"
            >
              <LineChartIcon className="w-3 h-3 mr-1.5 opacity-70" />
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              className="h-7 text-[10px] data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-md"
            >
              <MapPin className="w-3 h-3 mr-1.5 opacity-70" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger
              value="flow"
              className="h-7 text-[10px] data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 rounded-md"
            >
              <GitMerge className="w-3 h-3 mr-1.5 rotate-90 opacity-70" />
              Flows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-2 mt-2">
            <EventsTimeline data={historicalData} />
            <IncidentCategories data={historicalData} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-2 mt-2">
            <InfrastructureChart data={historicalData} />
            <CriticalTrend data={historicalData} />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-2 mt-2">
            <EventDistribution data={eventTypeData} />

            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="p-3 pb-1 border-b border-zinc-800/50">
                  <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/50">
                    <span className="text-[10px] text-zinc-400">RSS Feeds</span>
                    <span className="text-[11px] font-bold text-blue-400 mono">
                      {data.summary.sources.rss}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/50">
                    <span className="text-[10px] text-zinc-400">API Sources</span>
                    <span className="text-[11px] font-bold text-emerald-400 mono">
                      {data.summary.sources.api}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                      Total
                    </span>
                    <span className="text-xs font-bold text-white mono">
                      {data.summary.sources.total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader className="p-3 pb-1 border-b border-zinc-800/50">
                  <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/50">
                    <span className="text-[10px] text-zinc-400">Operational</span>
                    <span className="text-[11px] font-bold text-emerald-400 mono">
                      {data.summary.operationalInfrastructure}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/50">
                    <span className="text-[10px] text-zinc-400">Routes</span>
                    <span className="text-[11px] font-bold text-blue-400 mono">
                      {data.summary.totalRoutes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                      Disrupted
                    </span>
                    <span className="text-xs font-bold text-amber-500 mono">
                      {data.summary.disruptedRoutes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flow" className="space-y-2 mt-2">
            <RealTimeEventStream data={eventStreamData} />
            <IntuitiveSankey
              data={data}
              onNavigate={openMapWidget}
              onLocationSelect={handleLocationSelect}
              selectedLocation={eventSelection.selectedLocation}
            />
            <NewsNetwork data={data} onNavigate={openMapWidget} />
          </TabsContent>
        </Tabs>

        {/* Last Updated */}
        <div className="flex items-center justify-between opacity-50 pl-1">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar className="w-3 h-3" />
            <span className="text-[9px] font-mono">
              Telemetry synced: {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
