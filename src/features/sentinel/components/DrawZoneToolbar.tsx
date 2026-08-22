'use client';

import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/state';
import { cancelDrawing, undoDrawVertex, finishDrawing, updateDrawConfig } from '../state/sentinel-slice';
import { calculatePolygonAreaKm2, calculateDistanceKm } from '../lib/point-in-polygon';
import { Button } from '@/components/ui/button';
import { Check, X, Undo2, ShieldAlert, Pentagon, Eye } from 'lucide-react';
import type { SeverityLevel } from '../types';

export function DrawZoneToolbar() {
  const dispatch = useAppDispatch();
  const drawMode = useAppSelector(state => state.sentinel.drawMode);

  // Keyboard shortcut handlers
  React.useEffect(() => {
    if (!drawMode.active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement)?.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        dispatch(cancelDrawing());
      } else if (e.key === 'Enter' && drawMode.vertices.length >= 3) {
        dispatch(finishDrawing());
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch(undoDrawVertex());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode.active, drawMode.vertices.length, dispatch]);

  // Live metrics calculations
  const areaKm2 = useMemo(() => {
    if (drawMode.vertices.length < 3) return 0;
    return calculatePolygonAreaKm2(drawMode.vertices);
  }, [drawMode.vertices]);

  const perimeterKm = useMemo(() => {
    if (drawMode.vertices.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < drawMode.vertices.length - 1; i++) {
      total += calculateDistanceKm(drawMode.vertices[i], drawMode.vertices[i + 1]);
    }
    if (drawMode.vertices.length >= 3) {
      total += calculateDistanceKm(drawMode.vertices[drawMode.vertices.length - 1], drawMode.vertices[0]);
    }
    return total;
  }, [drawMode.vertices]);

  if (!drawMode.active) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-auto">
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-950/95 border border-cyan-500/50 rounded-md shadow-2xl backdrop-blur-xl font-mono text-xs">
      {/* Icon & Title */}
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <Pentagon size={16} className="text-cyan-400" />
        <span className="font-bold text-cyan-300 tracking-wider">DRAWING GEOFENCE</span>
      </div>

      {/* Name Input */}
      <input
        type="text"
        value={drawMode.zoneName}
        onChange={e => dispatch(updateDrawConfig({ zoneName: e.target.value }))}
        placeholder="Zone Name"
        className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-zinc-100 rounded text-xs w-48 focus:outline-none focus:border-cyan-400"
      />

      {/* Severity Selector */}
      <select
        value={drawMode.zoneSeverity}
        onChange={e => dispatch(updateDrawConfig({ zoneSeverity: e.target.value as SeverityLevel }))}
        className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-zinc-200 rounded text-xs focus:outline-none focus:border-cyan-400"
      >
        <option value="CRITICAL">🔴 CRITICAL</option>
        <option value="HIGH">🟠 HIGH</option>
        <option value="ELEVATED">🟡 ELEVATED</option>
        <option value="INFO">🔵 INFO</option>
      </select>

      {/* Color Selector */}
      <div className="flex items-center gap-1.5 px-2 border-l border-r border-zinc-800">
        {['#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#a855f7'].map(c => (
          <button
            key={c}
            onClick={() => dispatch(updateDrawConfig({ zoneColor: c }))}
            style={{ backgroundColor: c }}
            className={`w-4 h-4 rounded-full transition-transform ${drawMode.zoneColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
          />
        ))}
      </div>

      {/* Live Metrics */}
      <div className="flex items-center gap-3 text-[11px] text-zinc-400 px-2">
        <span>
          POINTS: <strong className="text-zinc-100">{drawMode.vertices.length}</strong>
        </span>
        {drawMode.vertices.length >= 3 && (
          <span>
            AREA: <strong className="text-cyan-400">{Math.round(areaKm2).toLocaleString()} km²</strong>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pl-2">
        <Button
          size="sm"
          variant="outline"
          disabled={drawMode.vertices.length === 0}
          onClick={() => dispatch(undoDrawVertex())}
          className="h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 text-xs"
        >
          <Undo2 size={13} className="mr-1" /> Undo
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => dispatch(cancelDrawing())}
          className="h-7 px-2.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/50 text-xs"
        >
          <X size={13} className="mr-1" /> Cancel
        </Button>

        <Button
          size="sm"
          disabled={drawMode.vertices.length < 3}
          onClick={() => dispatch(finishDrawing())}
          className="h-7 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950"
        >
          <Check size={13} className="mr-1" /> Complete Zone
        </Button>
      </div>
      </div>

      {/* Sub-banner instruction pill */}
      <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/90 border border-zinc-800/80 rounded-full text-[10px] text-zinc-400 font-mono shadow-md backdrop-blur-md">
        <span className="text-cyan-400 font-bold">🎯 CLICK MAP</span>
        <span>to add perimeter points</span>
        <span className="text-zinc-600">|</span>
        <span>Min: <strong className="text-zinc-200">3 points</strong></span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">Shortcuts: <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300">Ctrl+Z</kbd> Undo · <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300">Enter</kbd> Save · <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[9px] text-zinc-300">Esc</kbd> Cancel</span>
      </div>
    </div>
  );
}
