'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Anchor, ShieldAlert, Crosshair, Navigation, ChevronRight, Building } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/shared/state';
import { flyToCoordinates } from '@/shared/state/event-selection-slice';
import { setSelectedZoneId } from '@/features/sentinel/state/sentinel-slice';
import { STRATEGIC_CHOKEPOINTS } from '@/data/strategic-chokepoints';

type Props = {
  onFlyToLocation: (coords: { lat: number; lng: number; zoom?: number }) => void;
};

const POPULAR_TARGETS = [
  { name: 'Casablanca, Morocco', code: 'CAS', lat: 33.5731, lng: -7.5898, zoom: 11.5, type: 'CITY' },
  { name: 'Rabat (Capital), Morocco', code: 'RBA', lat: 33.9716, lng: -6.8498, zoom: 12, type: 'CITY' },
  { name: 'Tangier Med Port, Morocco', code: 'TNG', lat: 35.7595, lng: -5.8134, zoom: 11, type: 'PORT' },
  { name: 'Marrakech, Morocco', code: 'RAK', lat: 31.6295, lng: -7.9811, zoom: 11.5, type: 'CITY' },
  { name: 'Agadir, Morocco', code: 'AGA', lat: 30.4278, lng: -9.5981, zoom: 11.5, type: 'CITY' },
  { name: 'Laayoune, Moroccan Sahara', code: 'EUN', lat: 27.1536, lng: -13.1994, zoom: 10.5, type: 'REGIONAL' },
  { name: 'Dakhla Peninsula, Morocco', code: 'VIL', lat: 23.7158, lng: -15.9582, zoom: 10.5, type: 'PORT' },
  { name: 'Tehran, Iran', code: 'THR', lat: 35.6892, lng: 51.389, zoom: 10, type: 'THEATRE' },
  { name: 'Tel Aviv, Israel', code: 'TLV', lat: 32.0853, lng: 34.7818, zoom: 11, type: 'THEATRE' },
  { name: 'Beirut, Lebanon', code: 'BEY', lat: 33.8938, lng: 35.5018, zoom: 11, type: 'THEATRE' },
];

export function MobileSearchTab({ onFlyToLocation }: Props) {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const sentinel = useAppSelector(state => state.sentinel);

  const filteredTargets = useMemo(() => {
    if (!query.trim()) return POPULAR_TARGETS;
    const q = query.toLowerCase();
    return POPULAR_TARGETS.filter(
      t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredChokepoints = useMemo(() => {
    if (!query.trim()) return STRATEGIC_CHOKEPOINTS.slice(0, 6);
    const q = query.toLowerCase();
    return STRATEGIC_CHOKEPOINTS.filter(
      c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.waterway.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-4 pb-12 font-mono text-xs">
      {/* ── Search Input ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search city, port, choke point, coordinates..."
          className="w-full pl-9 pr-3 py-2 bg-zinc-950/90 border border-zinc-800 rounded-sm text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-cyan-400 font-mono"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Strategic Chokepoints ── */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Anchor size={11} className="text-cyan-400" /> MARITIME CHOKE POINTS
          </span>
          <span className="text-[9px] text-zinc-500">AIS RADAR</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {filteredChokepoints.map(choke => (
            <button
              key={choke.id}
              onClick={() => {
                onFlyToLocation({ lat: choke.coordinates[1], lng: choke.coordinates[0], zoom: 9.5 });
              }}
              className="p-2 rounded-sm bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/50 text-left transition-all active:scale-95 space-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 group-hover:text-cyan-300 text-[10.5px] truncate">
                  {choke.name}
                </span>
                <span className="text-[8px] text-cyan-400 font-bold px-1 bg-cyan-950/50 rounded">
                  {choke.vesselCount} AIS
                </span>
              </div>
              <div className="text-[9px] text-zinc-500 truncate">{choke.waterway}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── City & Infrastructure Targets ── */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Building size={11} className="text-blue-400" /> STRATEGIC REGIONS & CITIES
          </span>
          <span className="text-[9px] text-zinc-500">TAP TO NAVIGATE</span>
        </div>

        <div className="space-y-1">
          {filteredTargets.map(target => (
            <div
              key={target.name}
              onClick={() => onFlyToLocation({ lat: target.lat, lng: target.lng, zoom: target.zoom })}
              className="flex items-center justify-between p-2 rounded-sm bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/50 cursor-pointer active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-xs bg-zinc-900 text-zinc-400 group-hover:text-cyan-300">
                  <MapPin size={12} />
                </div>
                <div className="truncate">
                  <div className="font-bold text-zinc-200 group-hover:text-cyan-300 text-[11px] truncate">
                    {target.name}
                  </div>
                  <div className="text-[9px] text-zinc-500">
                    LAT: {target.lat.toFixed(2)}° · LNG: {target.lng.toFixed(2)}°
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="px-1.5 py-0.5 rounded-2xs text-[8.5px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold">
                  {target.code}
                </span>
                <ChevronRight size={13} className="text-zinc-600 group-hover:text-cyan-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Sentinel Perimeter Geofences ── */}
      {sentinel.zones.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1 text-cyan-400">
              <ShieldAlert size={11} /> ACTIVE SENTINEL ZONES ({sentinel.zones.length})
            </span>
          </div>

          <div className="space-y-1">
            {sentinel.zones.map(zone => (
              <div
                key={zone.id}
                onClick={() => {
                  const centerLng = (zone.bbox[0] + zone.bbox[2]) / 2;
                  const centerLat = (zone.bbox[1] + zone.bbox[3]) / 2;
                  onFlyToLocation({ lat: centerLat, lng: centerLng, zoom: 10 });
                  dispatch(setSelectedZoneId(zone.id));
                }}
                className="flex items-center justify-between p-2 rounded-sm bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/50 cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                  <div>
                    <div className="font-bold text-zinc-200 text-[11px]">{zone.name}</div>
                    <div className="text-[9px] text-zinc-500">
                      {zone.coordinates.length} VERTICES · {zone.breachCount} BREACHES
                    </div>
                  </div>
                </div>

                <button className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold rounded-xs">
                  FOCUS
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
