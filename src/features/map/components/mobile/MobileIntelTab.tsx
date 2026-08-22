'use client';

import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Plane,
  Sparkles,
  ShieldAlert,
  MapPin,
  ExternalLink,
  Clock,
  Filter,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { useLiveNews } from '@/shared/hooks/use-live-news';
import { useLiveFlights } from '@/shared/hooks/use-live-flights';
import { useLiveCyberThreats } from '@/shared/hooks/use-live-cyber-threats';
import { getCoordinatesForLocation } from '@/shared/lib/location-coordinates';

type Props = {
  onIntelItemClick?: (item: any) => void;
  onFlyToLocation?: (coords: { lat: number; lng: number; zoom?: number }) => void;
};

export function MobileIntelTab({ onIntelItemClick, onFlyToLocation }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'MILITARY' | 'CYBER'>('ALL');

  const newsQuery = useLiveNews('iran israel conflict military osint morocco', 20);
  const flightsQuery = useLiveFlights(undefined, true);
  const cyberQuery = useLiveCyberThreats(true);

  // Parse and aggregate feed items
  const intelItems = useMemo(() => {
    const list: any[] = [];

    // News
    if (newsQuery.data?.articles) {
      newsQuery.data.articles.forEach((article, idx) => {
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        let severity: 'CRITICAL' | 'HIGH' | 'INFO' = 'INFO';
        if (text.includes('strike') || text.includes('missile') || text.includes('killed') || text.includes('attack')) {
          severity = 'CRITICAL';
        } else if (text.includes('alert') || text.includes('warning') || text.includes('drone') || text.includes('drill')) {
          severity = 'HIGH';
        }

        // Try extracting known city/country coordinates
        let coordinates: [number, number] | undefined;
        if (text.includes('casablanca') || text.includes('casa')) coordinates = [-7.5898, 33.5731];
        else if (text.includes('rabat')) coordinates = [-6.8498, 33.9716];
        else if (text.includes('tangier') || text.includes('tanger')) coordinates = [-5.8134, 35.7595];
        else if (text.includes('marrakech') || text.includes('kech')) coordinates = [-7.9811, 31.6295];
        else if (text.includes('agadir')) coordinates = [-9.5981, 30.4278];
        else if (text.includes('laayoune')) coordinates = [-13.1994, 27.1536];
        else if (text.includes('dakhla')) coordinates = [-15.9582, 23.7158];
        else if (text.includes('tehran')) coordinates = [51.389, 35.6892];
        else if (text.includes('tel aviv') || text.includes('israel')) coordinates = [34.7818, 32.0853];
        else if (text.includes('beirut') || text.includes('lebanon')) coordinates = [35.5018, 33.8938];
        else if (text.includes('red sea')) coordinates = [38.5, 20.0];
        else if (text.includes('hormuz')) coordinates = [56.25, 26.56];

        list.push({
          id: `news-${idx}`,
          type: 'NEWS',
          severity,
          title: article.title,
          description: article.description || '',
          source: article.source || 'OSINT WIRE',
          timestamp: article.publishedAt,
          url: article.url,
          coordinates,
        });
      });
    }

    // High Priority Flights
    if (flightsQuery.data?.flights) {
      const milFlights = flightsQuery.data.flights
        .filter((f: any) => f.callsign?.includes('MIL') || f.callsign?.startsWith('RCH') || f.altitude > 40000)
        .slice(0, 4);

      milFlights.forEach((f: any) => {
        list.push({
          id: `flight-${f.id}`,
          type: 'FLIGHT',
          severity: 'HIGH',
          title: `AIR RECON: ${f.callsign || f.id}`,
          description: `Altitude ${Math.round(f.altitude)}ft · Speed ${Math.round(f.speedKnots || 450)}kn`,
          source: 'ADS-B TELEMETRY',
          timestamp: new Date().toISOString(),
          coordinates: f.position,
        });
      });
    }

    // Cyber Threats
    if (cyberQuery.data?.threats) {
      cyberQuery.data.threats.slice(0, 4).forEach((t: any) => {
        list.push({
          id: `cyber-${t.id}`,
          type: 'CYBER',
          severity: t.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: `CYBER ATTACK: ${t.type} VECTOR`,
          description: `Targeting infrastructure from ${t.sourceCountry} ➔ ${t.targetCountry}`,
          source: 'CYBER INTELLIGENCE',
          timestamp: new Date().toISOString(),
          coordinates: t.position,
        });
      });
    }

    return list;
  }, [newsQuery.data, flightsQuery.data, cyberQuery.data]);

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return intelItems;
    if (filter === 'CRITICAL') return intelItems.filter(i => i.severity === 'CRITICAL');
    if (filter === 'MILITARY') return intelItems.filter(i => i.type === 'FLIGHT' || i.type === 'NEWS');
    if (filter === 'CYBER') return intelItems.filter(i => i.type === 'CYBER');
    return intelItems;
  }, [intelItems, filter]);

  const handleCardClick = (item: any) => {
    if (item.coordinates && onFlyToLocation) {
      onFlyToLocation({
        lng: item.coordinates[0],
        lat: item.coordinates[1],
        zoom: item.type === 'FLIGHT' ? 8.5 : 10.5,
      });
    }
    if (onIntelItemClick) {
      onIntelItemClick(item);
    }
  };

  return (
    <div className="space-y-3 pb-12 font-mono text-xs">
      {/* ── Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {(['ALL', 'CRITICAL', 'MILITARY', 'CYBER'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 rounded-sm text-[10px] font-bold shrink-0 border transition-all ${
              filter === tab
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'CRITICAL' && '🔴 '}
            {tab === 'MILITARY' && '✈️ '}
            {tab === 'CYBER' && '⚡ '}
            {tab} {filter === tab && `(${filteredItems.length})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1 text-[9px] text-zinc-500 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>REALTIME</span>
        </div>
      </div>

      {/* ── Item List ── */}
      <div className="space-y-2">
        {newsQuery.isLoading && intelItems.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-[11px]">
            <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-cyan-400" />
            SYNCHRONIZING GLOBAL INTELLIGENCE WIRE...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-[11px]">
            NO ACTIVE EVENTS MATCHING FILTER CRITERIA
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="p-3 rounded-sm bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/50 hover:bg-zinc-900/60 transition-all active:scale-[0.99] cursor-pointer space-y-1.5 group"
            >
              {/* Header: Source, Badge, Timestamp */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded-2xs font-bold ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-zinc-400 font-bold uppercase">{item.source}</span>
                </div>

                {item.coordinates && (
                  <span className="flex items-center gap-0.5 text-cyan-400 text-[8.5px] font-bold group-hover:underline">
                    <MapPin size={9} />
                    MAP TARGET
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="font-bold text-zinc-100 text-[11.5px] leading-snug line-clamp-2">
                {item.title}
              </div>

              {/* Snippet */}
              {item.description && (
                <div className="text-zinc-400 text-[10.5px] line-clamp-2 leading-relaxed">
                  {item.description}
                </div>
              )}

              {/* Footer / URL */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[8.5px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={9} />
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW'}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-0.5 text-zinc-400 hover:text-cyan-300"
                  >
                    ORIGIN SOURCE <ExternalLink size={8} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
