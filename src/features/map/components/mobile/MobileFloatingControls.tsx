'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mountain, RotateCcw, ShieldAlert, Target, MapPin, X, Compass, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/shared/state';
import { toggleHud } from '@/features/sentinel/state/sentinel-slice';
import type { MapStory } from '@/types/domain';
import { StoryIcon } from '@/features/map/components/StoryIcon';

type Props = {
  mapStyle: 'dark' | 'satellite';
  onStyleChange: (style: 'dark' | 'satellite') => void;
  is3d: boolean;
  onToggle3D: () => void;
  bearing: number;
  pitch: number;
  onResetView: () => void;
  onCityFlyTo: (coords: { lat: number; lng: number; zoom?: number }) => void;
  activeStory: MapStory | null;
  onClearStory: () => void;
  embedded?: boolean;
};

const STRATEGIC_CITIES = [
  { name: 'RABAT', lat: 33.9716, lng: -6.8498, zoom: 11 },
  { name: 'CASA', lat: 33.5731, lng: -7.5898, zoom: 11 },
  { name: 'TANGER', lat: 35.7595, lng: -5.8134, zoom: 11 },
  { name: 'KECH', lat: 31.6295, lng: -7.9811, zoom: 11 },
  { name: 'AGADIR', lat: 30.4278, lng: -9.5981, zoom: 11 },
  { name: 'FES', lat: 34.0181, lng: -5.0003, zoom: 11 },
  { name: 'LAAYOUNE', lat: 27.1536, lng: -13.1994, zoom: 10 },
  { name: 'DAKHLA', lat: 23.7158, lng: -15.9582, zoom: 10 },
  { name: 'GIBRALTAR', lat: 35.95, lng: -5.6, zoom: 9.5 },
  { name: 'HORMUZ', lat: 26.56, lng: 56.25, zoom: 9 },
  { name: 'RED SEA', lat: 20.0, lng: 38.5, zoom: 7 },
];

export function MobileFloatingControls({
  mapStyle,
  onStyleChange,
  is3d,
  onToggle3D,
  bearing,
  pitch,
  onResetView,
  onCityFlyTo,
  activeStory,
  onClearStory,
  embedded = false,
}: Props) {
  const dispatch = useAppDispatch();
  const sentinel = useAppSelector(state => state.sentinel);
  const activeBreachesCount = sentinel.incidents.filter(i => !i.acknowledged).length;
  const [showCityStrip, setShowCityStrip] = useState(false);

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-30 flex flex-col gap-1.5 p-2 pt-[calc(8px+env(safe-area-inset-top))]">
      {/* Top Primary Bar */}
      <div className="flex items-center justify-between gap-1.5 w-full">
        {/* Left Side: Back / Overview & Live Badge */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          {!embedded && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-2 py-1 rounded-sm bg-zinc-950/90 border border-zinc-800/90 shadow-lg backdrop-blur-xl font-mono text-[10px] font-bold text-zinc-300 active:scale-95 transition-all"
            >
              <span className="text-cyan-400">←</span>
              <span>OVERVIEW</span>
            </Link>
          )}

          <div className="flex items-center gap-1 px-2 py-1 rounded-sm bg-zinc-950/90 border border-zinc-800/90 shadow-lg backdrop-blur-xl font-mono text-[10px] text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Right Side: Map Style, 3D, Sentinel, Reset */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          {/* Quick Locator Dropdown Toggle */}
          <button
            onClick={() => setShowCityStrip(prev => !prev)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-sm border shadow-lg backdrop-blur-xl font-mono text-[10px] font-bold transition-all ${
              showCityStrip
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 active:scale-95'
            }`}
          >
            <MapPin size={11} className="text-cyan-400" />
            <span>LOCATE</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${showCityStrip ? 'rotate-180' : ''}`} />
          </button>

          {/* Map Base Style Switcher */}
          <button
            onClick={() => onStyleChange(mapStyle === 'dark' ? 'satellite' : 'dark')}
            className="px-2 py-1 rounded-sm bg-zinc-950/90 border border-zinc-800 shadow-lg backdrop-blur-xl font-mono text-[10px] font-bold text-zinc-300 hover:text-cyan-300 active:scale-95 transition-all"
            title="Toggle Satellite / Dark Basemap"
          >
            {mapStyle === 'dark' ? '🛰 SAT' : '🗺 DARK'}
          </button>

          {/* 3D Tilt Mode */}
          <button
            onClick={onToggle3D}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm border shadow-lg backdrop-blur-xl font-mono text-[10px] font-bold transition-all ${
              is3d || pitch > 15
                ? 'bg-cyan-950/95 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 active:scale-95'
            }`}
            title="Toggle 3D View"
          >
            <Mountain size={11} className="text-cyan-400" />
            <span>3D</span>
          </button>

          {/* Sentinel HUD Button */}
          <button
            onClick={() => dispatch(toggleHud())}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm border shadow-lg backdrop-blur-xl font-mono text-[10px] font-bold transition-all ${
              sentinel.hudOpen
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300'
                : activeBreachesCount > 0
                ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 active:scale-95'
            }`}
            title="Sentinel Perimeter Geofencing"
          >
            <ShieldAlert size={11} className={activeBreachesCount > 0 ? 'text-red-400' : 'text-cyan-400'} />
            {activeBreachesCount > 0 && <span>{activeBreachesCount}</span>}
          </button>

          {/* Reset Orientation & Tilt (When non-zero) */}
          {(pitch > 5 || Math.abs(bearing) > 2) && (
            <button
              onClick={onResetView}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-sm bg-zinc-950/90 border border-zinc-800 text-zinc-400 hover:text-red-400 active:scale-95 transition-colors font-mono text-[9px]"
              title="Reset View to North Top-Down"
            >
              <RotateCcw size={10} />
              <span>0°</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Strategic City Quick Jump Strip */}
      {showCityStrip && (
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1 px-1 bg-zinc-950/95 border border-cyan-500/30 rounded-sm shadow-2xl backdrop-blur-xl pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-[8.5px] font-mono text-cyan-400 font-bold uppercase tracking-wider shrink-0 px-1">
            TARGETS:
          </span>
          {STRATEGIC_CITIES.map(city => (
            <button
              key={city.name}
              onClick={() => {
                onCityFlyTo({ lat: city.lat, lng: city.lng, zoom: city.zoom });
                setShowCityStrip(false);
              }}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-cyan-950 border border-zinc-800 hover:border-cyan-500/50 text-[9px] font-mono font-bold text-zinc-300 hover:text-cyan-300 shrink-0 active:scale-95 transition-all"
            >
              {city.name}
            </button>
          ))}
        </div>
      )}

      {/* Active Story Pill Banner */}
      {activeStory && (
        <div className="self-center flex items-center gap-2 px-2.5 py-1 bg-zinc-950/95 border border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-xl pointer-events-auto font-mono text-[10px]">
          <StoryIcon iconName={activeStory.iconName} category={activeStory.category} size={11} boxSize={18} />
          <span className="font-bold text-zinc-200 truncate max-w-[200px]">
            {activeStory.title.toUpperCase()}
          </span>
          <button
            onClick={onClearStory}
            className="p-0.5 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
