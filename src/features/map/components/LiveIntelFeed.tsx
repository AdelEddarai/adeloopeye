'use client';

import { useState, useMemo } from 'react';

import { 
  Activity, 
  AlertTriangle, 
  Plane, 
  Newspaper, 
  Shield, 
  MapPin,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useLiveNews } from '@/shared/hooks/use-live-news';
import { useLiveFlights } from '@/shared/hooks/use-live-flights';
import { useLiveCyberThreats } from '@/shared/hooks/use-live-cyber-threats';

type IntelItem = {
  id: string;
  type: 'NEWS' | 'FLIGHT' | 'CYBER' | 'THREAT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  location?: string;
  coordinates?: [number, number];
  timestamp: string;
  source: string;
  url?: string;
  icon: any;
  color: string;
};

type Props = {
  onItemClick?: (item: IntelItem) => void;
  enableFlights?: boolean;
  enableCyber?: boolean;
};

export function LiveIntelFeed({ onItemClick, enableFlights = false, enableCyber = true }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NEWS' | 'FLIGHT' | 'CYBER'>('ALL');

  // Fetch real-time data with conditional enabling
  const newsQuery = useLiveNews('iran israel conflict military', 15);
  const flightsQuery = useLiveFlights(undefined, enableFlights);
  const cyberQuery = useLiveCyberThreats(enableCyber);

  // Combine and transform data into unified feed
  const feedItems = useMemo(() => {
    const items: IntelItem[] = [];

    // Add news items
    if (newsQuery.data?.articles) {
      newsQuery.data.articles.slice(0, 10).forEach((article, idx) => {
        // Determine severity based on keywords
        const content = `${article.title} ${article.description}`.toLowerCase();
        const severity = 
          content.includes('killed') || content.includes('attack') || content.includes('strike') ? 'CRITICAL' :
          content.includes('threat') || content.includes('warning') || content.includes('conflict') ? 'HIGH' :
          content.includes('tension') || content.includes('concern') ? 'MEDIUM' : 'LOW';

        items.push({
          id: `news-${idx}`,
          type: 'NEWS',
          severity: severity as any,
          title: article.title,
          description: article.description || '',
          source: article.source,
          timestamp: article.publishedAt,
          url: article.url,
          icon: Newspaper,
          color: severity === 'CRITICAL' ? '#ef4444' : severity === 'HIGH' ? '#f97316' : '#3b82f6',
        });
      });
    }

    // Add significant flight activity (only if enabled)
    if (enableFlights && flightsQuery.data?.flights) {
      const militaryFlights = flightsQuery.data.flights
        .filter((f: any) => 
          f.callsign?.includes('MIL') || 
          f.callsign?.includes('AIR') ||
          f.callsign?.startsWith('RCH') || // US Military
          f.callsign?.startsWith('CNV') || // US Military Convoy
          f.altitude > 40000 // High altitude
        )
        .slice(0, 5);

      militaryFlights.forEach((flight: any, idx: number) => {
        items.push({
          id: `flight-${flight.icao24 || idx}`,
          type: 'FLIGHT',
          severity: 'MEDIUM',
          title: `Military Aircraft: ${flight.callsign || 'Unknown'}`,
          description: `Altitude: ${Math.round(flight.altitude * 3.28084)}ft, Speed: ${Math.round(flight.velocity * 1.94384)}kts`,
          location: flight.origin_country,
          coordinates: [flight.longitude, flight.latitude],
          timestamp: new Date(flight.time_position * 1000).toISOString(),
          source: 'OpenSky Network',
          icon: Plane,
          color: '#3b82f6',
        });
      });
    }

    // Add cyber threats (only if enabled)
    if (enableCyber && cyberQuery.data) {
      const cyberData = cyberQuery.data as { threats?: any[] };
      const threats = cyberData.threats || [];
      threats.slice(0, 8).forEach((threat: any) => {
        items.push({
          id: threat.id,
          type: 'CYBER',
          severity: threat.severity,
          title: `${threat.type}: ${threat.target}`,
          description: threat.description || `Cyber threat detected from ${threat.source}`,
          location: threat.location,
          coordinates: threat.position,
          timestamp: threat.timestamp,
          source: 'Threat Intelligence',
          icon: Shield,
          color: threat.severity === 'CRITICAL' ? '#ef4444' : threat.severity === 'HIGH' ? '#f97316' : '#f59e0b',
        });
      });
    }

    // Sort by timestamp (newest first)
    return items.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [newsQuery.data, flightsQuery.data, cyberQuery.data, enableFlights, enableCyber]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return feedItems;
    return feedItems.filter(item => item.type === filter);
  }, [feedItems, filter]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: feedItems.length,
    critical: feedItems.filter(i => i.severity === 'CRITICAL').length,
    news: feedItems.filter(i => i.type === 'NEWS').length,
    flights: feedItems.filter(i => i.type === 'FLIGHT').length,
    cyber: feedItems.filter(i => i.type === 'CYBER').length,
  }), [feedItems]);

  // Check loading and error states
  const isLoading = newsQuery.isLoading || (enableFlights && flightsQuery.isLoading) || (enableCyber && cyberQuery.isLoading);
  const hasError = newsQuery.isError || (enableFlights && flightsQuery.isError) || (enableCyber && cyberQuery.isError);

  // Get last update time
  const lastUpdate = useMemo(() => {
    const times = [
      newsQuery.dataUpdatedAt,
      enableFlights ? flightsQuery.dataUpdatedAt : 0,
      enableCyber ? cyberQuery.dataUpdatedAt : 0,
    ].filter(t => t > 0);
    
    return times.length > 0 ? Math.max(...times) : 0;
  }, [newsQuery.dataUpdatedAt, flightsQuery.dataUpdatedAt, cyberQuery.dataUpdatedAt, enableFlights, enableCyber]);

  const handleItemClick = (item: IntelItem) => {
    if (item.coordinates) {
      onItemClick?.(item);
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  const handleRefresh = () => {
    newsQuery.refetch();
    if (enableFlights) flightsQuery.refetch();
    if (enableCyber) cyberQuery.refetch();
  };

  return (
    <Card className="border-[var(--bd)]">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="text-primary font-bold text-xs tracking-wide">◈ LIVE INTELLIGENCE FEED</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <span className="text-muted-foreground text-sm">{expanded ? '∨' : '›'}</span>
        </div>

        {expanded && (
          <>
            {/* Statistics Bar */}
            <div className="grid grid-cols-4 gap-1.5 p-2 bg-muted/20 border-b">
              <div className="flex flex-col items-center px-2 py-1.5 bg-background rounded">
                <div className="font-mono text-xs font-bold text-primary leading-none">{stats.total}</div>
                <div className="font-mono text-[8px] text-muted-foreground leading-none mt-0.5">TOTAL</div>
              </div>
              <div className="flex flex-col items-center px-2 py-1.5 bg-background rounded">
                <div className="font-mono text-xs font-bold text-destructive leading-none">{stats.critical}</div>
                <div className="font-mono text-[8px] text-muted-foreground leading-none mt-0.5">CRITICAL</div>
              </div>
              <div className="flex flex-col items-center px-2 py-1.5 bg-background rounded">
                <div className="font-mono text-xs font-bold text-blue-500 leading-none">{stats.flights}</div>
                <div className="font-mono text-[8px] text-muted-foreground leading-none mt-0.5">FLIGHTS</div>
              </div>
              <div className="flex flex-col items-center px-2 py-1.5 bg-background rounded">
                <div className="font-mono text-xs font-bold text-orange-500 leading-none">{stats.cyber}</div>
                <div className="font-mono text-[8px] text-muted-foreground leading-none mt-0.5">CYBER</div>
              </div>
            </div>

            {/* Filter Tabs & Controls */}
            <div className="flex items-center gap-1 p-2 bg-muted/20 border-b overflow-x-auto">
              {(['ALL', 'NEWS', 'FLIGHT', 'CYBER'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="h-6 px-2 text-[9px] font-bold"
                >
                  {f}
                </Button>
              ))}
              
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Filter size={10} />
                  <span className="text-[8px] font-mono">{filteredItems.length}</span>
                </div>
                
                {lastUpdate > 0 && (
                  <span className="text-[8px] font-mono text-muted-foreground">
                    {formatTimestamp(new Date(lastUpdate).toISOString())}
                  </span>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  className="h-6 w-6 p-0"
                  disabled={isLoading}
                >
                  <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
                </Button>
              </div>
            </div>

            {/* Error State */}
            {hasError && (
              <div className="p-4 bg-destructive/10 border-b border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Failed to load some data</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-7 text-xs"
                >
                  <RefreshCw size={12} className="mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Feed Items */}
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading && filteredItems.length === 0 ? (
                // Loading skeletons
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-muted-foreground text-xs font-mono">No intelligence items</span>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const hasLocation = !!item.coordinates;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left p-3 border-b last:border-0 hover:bg-muted/30 transition-colors relative group"
                    >
                      {/* Type Badge */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <Badge 
                          variant="secondary"
                          className="text-[8px] font-bold h-4 px-1.5"
                          style={{
                            background: `${item.color}20`,
                            color: item.color,
                          }}
                        >
                          {item.severity}
                        </Badge>
                        {hasLocation && (
                          <MapPin size={10} className="text-primary" />
                        )}
                      </div>

                      {/* Icon & Type */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={14} style={{ color: item.color }} className="shrink-0" />
                        <Badge 
                          variant="outline"
                          className="text-[9px] font-bold h-4 px-1.5"
                          style={{
                            background: `${item.color}15`,
                            color: item.color,
                            borderColor: `${item.color}40`,
                          }}
                        >
                          {item.type}
                        </Badge>
                      </div>

                      {/* Title */}
                      <div className="text-foreground text-sm font-semibold mb-1 line-clamp-2 leading-snug pr-16">
                        {item.title}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <div className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-2">
                          {item.description}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span className="font-mono">{formatTimestamp(item.timestamp)}</span>
                        </div>
                        {item.location && (
                          <>
                            <span>•</span>
                            <span className="font-mono truncate">{item.location}</span>
                          </>
                        )}
                        {item.url && (
                          <>
                            <span>•</span>
                            <ExternalLink size={10} className="inline" />
                          </>
                        )}
                      </div>

                      {/* Hover indicator */}
                      {hasLocation && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] text-primary font-mono">Click to view on map</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}
