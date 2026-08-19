'use client';

import { useState, useMemo } from 'react';
import {
  Anchor, AlertTriangle, ShieldAlert, TrendingDown,
  TrendingUp, Clock, Compass, Activity, ChevronRight,
  Flame, Radio, Navigation2, Calendar, BarChart3, LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StrategicChokepointData, DailyVesselActivity } from '@/data/strategic-chokepoints';
import { useAppDispatch } from '@/shared/state';
import { flyToCoordinates } from '@/shared/state/event-selection-slice';

export function ChokepointContent({ data }: { data: StrategicChokepointData }) {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(data.dailyActivity.length - 1);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(data.weeklyTrend.length - 1);

  const currentDay = data.dailyActivity[selectedDayIndex] || data.dailyActivity[data.dailyActivity.length - 1];
  const currentWeek = data.weeklyTrend[selectedWeekIndex] || data.weeklyTrend[data.weeklyTrend.length - 1];

  const handleFocusCamera = () => {
    if (data.coordinates) {
      dispatch(flyToCoordinates({
        coordinates: data.coordinates,
        zoom: 7.5,
      }));
    }
  };

  const levelColor =
    data.level === 'CRITICAL'
      ? 'text-red-400 bg-red-500/10 border-red-500/30'
      : data.level === 'HIGH'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

  // Compute SVG Line chart points for 14-day daily trend
  const lineChartData = useMemo(() => {
    const items = data.dailyActivity;
    if (!items || items.length === 0) return null;
    const maxVal = Math.max(...items.map(d => d.totalVessels)) * 1.15;
    const minVal = Math.min(...items.map(d => d.totalVessels)) * 0.85;
    const range = Math.max(1, maxVal - minVal);

    const width = 280;
    const height = 75;
    const step = width / (items.length - 1);

    const points = items.map((d, i) => {
      const x = i * step;
      const y = height - ((d.totalVessels - minVal) / range) * (height - 18) - 10;
      return { x, y, data: d, index: i };
    });

    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return { points, pathD, areaD, width, height, minVal, maxVal };
  }, [data.dailyActivity]);

  return (
    <div className="space-y-3.5 font-mono text-zinc-300">
      {/* Top Banner & Risk Score */}
      <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80 space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Anchor size={14} className="text-cyan-400" />
            <span className="text-[11px] font-bold tracking-wider text-zinc-100 uppercase">
              {data.name}
            </span>
          </div>
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold ${levelColor}`}>
            {data.level}
          </Badge>
        </div>

        <p className="text-[10px] text-zinc-400 leading-relaxed">
          {data.description}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[9px]">
          <span className="text-zinc-500">REGION: {data.region}</span>
          <span className="text-zinc-400 font-bold">
            LAT/LON: {data.coordinates[1].toFixed(2)}°N, {data.coordinates[0].toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Focus Camera Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleFocusCamera}
        className="w-full bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-bold h-8 rounded-sm font-mono shadow-[0_0_12px_rgba(6,182,212,0.15)]"
      >
        <Navigation2 size={12} className="mr-1.5 text-cyan-400" />
        FOCUS CAMERA ON SECTOR
      </Button>

      {/* Daily vs Weekly Mode Switcher */}
      <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1">
            <Activity size={12} className="text-cyan-400" />
            TRANSIT FLOW ANALYTICS
          </span>
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-xs transition-all ${
                viewMode === 'daily'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              14-DAY LINE
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-xs transition-all ${
                viewMode === 'weekly'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              4-WEEK BAR
            </button>
          </div>
        </div>

        {/* 14-DAY DAILY SPLINE LINE CHART */}
        {viewMode === 'daily' && lineChartData && (
          <div className="space-y-2">
            <div className="relative pt-1">
              <svg viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`} className="w-full h-20 overflow-visible">
                <defs>
                  <linearGradient id="chokepointGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path d={lineChartData.areaD} fill="url(#chokepointGradient)" />

                {/* Spline Path */}
                <path d={lineChartData.pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />

                {/* Interactive Points */}
                {lineChartData.points.map(p => {
                  const isSelected = p.index === selectedDayIndex;
                  const isDisrupted = p.data.disruptionLevel === 'HIGH_DISRUPTION';
                  const isElevated = p.data.disruptionLevel === 'ELEVATED';

                  const dotColor = isDisrupted ? '#ef4444' : isElevated ? '#f59e0b' : '#22d3ee';

                  return (
                    <g key={p.data.date} className="cursor-pointer" onClick={() => setSelectedDayIndex(p.index)}>
                      {isSelected && (
                        <circle cx={p.x} cy={p.y} r="7" fill={dotColor} opacity="0.25" className="animate-pulse" />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? "4.5" : isDisrupted ? "3.5" : "2.5"}
                        fill={dotColor}
                        stroke="#09090b"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Day Axis labels */}
              <div className="flex justify-between text-[7.5px] text-zinc-500 pt-1">
                <span>{data.dailyActivity[0]?.dayLabel}</span>
                <span className="text-zinc-400">{data.dailyActivity[Math.floor(data.dailyActivity.length / 2)]?.dayLabel}</span>
                <span className="text-cyan-400 font-bold">{data.dailyActivity[data.dailyActivity.length - 1]?.dayLabel}</span>
              </div>
            </div>

            {/* Selected Day Dossier */}
            <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800 text-[9px] space-y-1.5">
              <div className="flex justify-between items-center text-zinc-300 font-bold border-b border-zinc-800/80 pb-1">
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-cyan-400" />
                  DATE: {currentDay.dayLabel} ({currentDay.date})
                </span>
                <span className="text-cyan-300 text-[10px]">{currentDay.totalVessels} VESSELS</span>
              </div>

              {currentDay.note && (
                <div className="p-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[8px] flex items-center gap-1">
                  <AlertTriangle size={10} className="shrink-0 text-red-400" />
                  <span>ALERT: {currentDay.note}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">CRUDE/LNG TANKERS:</span>
                  <span className="text-amber-400 font-bold">{currentDay.tankers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CONTAINER SHIPS:</span>
                  <span className="text-blue-400 font-bold">{currentDay.containers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">BULK & CARGO:</span>
                  <span className="text-emerald-400 font-bold">{currentDay.cargo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">MILITARY / WARSHIPS:</span>
                  <span className="text-purple-400 font-bold">{currentDay.military}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-WEEK AGGREGATE BAR CHART */}
        {viewMode === 'weekly' && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 pt-1">
              {data.weeklyTrend.map((w, idx) => {
                const isSelected = idx === selectedWeekIndex;
                const maxVal = Math.max(...data.weeklyTrend.map(x => x.totalVessels));
                const heightPct = Math.max(25, Math.round((w.totalVessels / maxVal) * 100));

                return (
                  <div
                    key={w.week}
                    onClick={() => setSelectedWeekIndex(idx)}
                    className={`cursor-pointer flex flex-col items-center gap-1 p-1.5 rounded transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                        : 'hover:bg-zinc-900/80 border border-transparent'
                    }`}
                  >
                    <div className="w-full h-16 bg-zinc-950/80 rounded flex items-end p-1 justify-center">
                      <div
                        className="w-full rounded-xs transition-all"
                        style={{
                          height: `${heightPct}%`,
                          background: isSelected
                            ? 'linear-gradient(to top, #0891b2, #22d3ee)'
                            : 'linear-gradient(to top, #3f3f46, #71717a)',
                        }}
                      />
                    </div>
                    <span className="text-[8.5px] font-bold text-zinc-300">{w.week}</span>
                    <span className="text-[8px] text-zinc-500">{w.totalVessels}</span>
                  </div>
                );
              })}
            </div>

            {/* Selected Week Breakdown */}
            <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800 text-[9px] space-y-1.5">
              <div className="flex justify-between text-zinc-400 font-bold border-b border-zinc-800/80 pb-1">
                <span>{currentWeek.week} SHIP BREAKDOWN</span>
                <span className="text-cyan-300">{currentWeek.totalVessels} TOTAL</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">TANKERS (CRUDE/LNG):</span>
                  <span className="text-amber-400 font-bold">{currentWeek.tankers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">CONTAINER SHIPS:</span>
                  <span className="text-blue-400 font-bold">{currentWeek.containers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">BULK & CARGO:</span>
                  <span className="text-emerald-400 font-bold">{currentWeek.cargo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">WARSHIPS:</span>
                  <span className="text-purple-400 font-bold">{currentWeek.military}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Core Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div className="p-2 rounded bg-zinc-900/40 border border-zinc-800/60">
          <div className="text-zinc-500 uppercase font-bold">DAILY CAPACITY</div>
          <div className="text-zinc-100 font-bold text-[11px] mt-0.5">{data.dailyVolume}</div>
        </div>
        <div className="p-2 rounded bg-zinc-900/40 border border-zinc-800/60">
          <div className="text-zinc-500 uppercase font-bold">ENERGY FLOW</div>
          <div className="text-amber-300 font-bold text-[11px] mt-0.5">{data.crudeFlow}</div>
        </div>
        <div className="p-2 rounded bg-zinc-900/40 border border-zinc-800/60">
          <div className="text-zinc-500 uppercase font-bold">AVG QUEUE DELAY</div>
          <div className="text-red-400 font-bold text-[11px] mt-0.5">{data.delayAvg}</div>
        </div>
        <div className="p-2 rounded bg-zinc-900/40 border border-zinc-800/60">
          <div className="text-zinc-500 uppercase font-bold">DARK FLEET SPOOFING</div>
          <div className="text-purple-300 font-bold text-[11px] mt-0.5">{data.spoofingRate}</div>
        </div>
      </div>

      {/* Chronological Incident Timeline (Last 7 Days) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1">
            <Clock size={12} className="text-amber-400" />
            7-DAY INCIDENT LOG & ALERTS
          </span>
          <span className="text-[8.5px] text-zinc-500">{data.incidents.length} EVENTS</span>
        </div>

        <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
          {data.incidents.map(inc => {
            const sevBadge =
              inc.severity === 'CRITICAL'
                ? 'text-red-400 border-red-500/40 bg-red-500/10'
                : inc.severity === 'HIGH'
                ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                : 'text-zinc-400 border-zinc-700 bg-zinc-800';

            return (
              <div
                key={inc.id}
                className="p-2 rounded bg-zinc-900/50 border border-zinc-800/80 space-y-1 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-200 truncate max-w-[190px]">
                    {inc.title}
                  </span>
                  <Badge variant="outline" className={`text-[7.5px] px-1 py-0 ${sevBadge}`}>
                    {inc.severity}
                  </Badge>
                </div>
                <p className="text-[8.5px] text-zinc-400 leading-snug">
                  {inc.description}
                </p>
                <div className="flex items-center justify-between text-[7.5px] text-zinc-500 pt-0.5">
                  <span>{inc.type}</span>
                  <span>{inc.timeAgo} ({inc.date})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
