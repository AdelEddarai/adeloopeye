'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, AlertTriangle, BarChart3, MapPin, Radar, TrendingDown, TrendingUp, Zap, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getConflictForDay, getEventsForDay } from '@/shared/lib/day-filter';

import { DashCtx } from '../DashCtx';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export function IntelAnalyticsWidget() {
  const { day, snapshots, events: allEvents, allDays } = useContext(DashCtx);
  const snap = getConflictForDay(snapshots, day);
  const dayEvents = useMemo(() => getEventsForDay(allEvents, allDays, day), [allEvents, allDays, day]);

  if (!snap) return null;

  // Calculate analytics
  const severityBreakdown = {
    CRITICAL: dayEvents.filter(e => e.severity === 'CRITICAL').length,
    HIGH: dayEvents.filter(e => e.severity === 'HIGH').length,
    STANDARD: dayEvents.filter(e => e.severity === 'STANDARD').length,
  };

  const typeBreakdown = dayEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTypes = Object.entries(typeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate trend (compare with previous days)
  const dayIndex = allDays.indexOf(day);
  const prevDayEvents = dayIndex > 0 ? getEventsForDay(allEvents, allDays, allDays[dayIndex - 1]) : [];
  const eventTrend = dayEvents.length - prevDayEvents.length;
  const trendPercent = prevDayEvents.length > 0 
    ? ((eventTrend / prevDayEvents.length) * 100).toFixed(1)
    : '0';

  // Hourly distribution for ECharts
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const count = dayEvents.filter(e => {
      const eventHour = new Date(e.timestamp).getHours();
      return eventHour === hour;
    }).length;
    return count;
  });

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, bottom: 0, top: 0 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      show: false
    },
    yAxis: { type: 'value', show: false },
    series: [{
      data: hourlyData,
      type: 'bar',
      itemStyle: {
        color: '#4a90e2',
        borderRadius: [2, 2, 0, 0]
      },
      emphasis: {
        itemStyle: { color: '#60a5fa' }
      }
    }],
    tooltip: {
      show: true,
      trigger: 'axis',
      backgroundColor: 'rgba(23, 23, 37, 0.9)',
      borderColor: '#3f3f46',
      textStyle: { color: '#f4f4f5', fontSize: 10 },
      formatter: (params: any) => `${params[0].name}: ${params[0].value} events`
    }
  };

  return (
    <div className="h-full overflow-y-auto p-2 space-y-2 bg-zinc-950/10">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-zinc-900/50 border-zinc-800 border-l-2 border-l-blue-500 overflow-hidden relative group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          <CardContent className="p-2 relative">
            <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
              <Activity size={12} className="text-blue-500" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Total Events</span>
            </div>
            <div className="text-xl font-mono font-bold text-blue-400 tracking-tighter leading-none mb-1">
              {dayEvents.length}
            </div>
            <div className="flex items-center gap-1">
              {eventTrend > 0 ? (
                <div className="flex items-center text-red-500 font-mono text-[9px]">
                  <TrendingUp size={10} className="mr-0.5" />
                  <span>+{trendPercent}%</span>
                </div>
              ) : eventTrend < 0 ? (
                <div className="flex items-center text-emerald-500 font-mono text-[9px]">
                  <TrendingDown size={10} className="mr-0.5" />
                  <span>{trendPercent}%</span>
                </div>
              ) : (
                <span className="text-zinc-500 text-[9px]">0% vs prev</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 border-l-2 border-l-red-500 overflow-hidden relative group">
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
          <CardContent className="p-2 relative">
            <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
              <ShieldAlert size={12} className="text-red-500" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Escalation</span>
            </div>
            <div className="text-xl font-mono font-bold text-red-400 tracking-tighter leading-none mb-1">
              {snap.escalation}%
            </div>
            <Progress value={snap.escalation} className="h-[2px] bg-zinc-800 mt-1.5" indicatorClassName="bg-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Severity Distribution */}
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="p-2 pb-1.5 border-b border-zinc-800/50">
          <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Zap size={10} className="text-amber-500" />
            Severity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 space-y-2">
          {Object.entries(severityBreakdown).map(([severity, count]) => {
            const colorClass = severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
              : severity === 'HIGH' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
            const textColorClass = severity === 'CRITICAL' ? 'text-red-400' 
              : severity === 'HIGH' ? 'text-amber-400' 
              : 'text-blue-400';
            const percent = dayEvents.length > 0 ? (count / dayEvents.length) * 100 : 0;
            
            return (
              <div key={severity} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[8px] font-mono leading-none px-1 py-0 border-zinc-800/50 ${textColorClass}`}>
                    {severity}
                  </Badge>
                  <span className={`text-[9px] font-mono leading-none ${textColorClass}`}>
                    {count} <span className="text-zinc-600 text-[8px]">({percent.toFixed(0)}%)</span>
                  </span>
                </div>
                <Progress value={percent} className="h-[2px] bg-zinc-800/50" indicatorClassName={colorClass} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Event Types */}
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="p-2 pb-1.5 border-b border-zinc-800/50">
          <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 size={10} className="text-blue-400" />
            Core Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 space-y-2">
          {topTypes.map(([type, count]) => {
            const percent = dayEvents.length > 0 ? (count / dayEvents.length) * 100 : 0;
            return (
              <div key={type} className="group cursor-default">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-zinc-400 font-medium tracking-wide group-hover:text-zinc-200 transition-colors truncate pr-2">
                    {type}
                  </span>
                  <span className="text-[9px] text-blue-400/80 font-mono">{count}</span>
                </div>
                <Progress value={percent} className="h-[2px] bg-zinc-800/50" indicatorClassName="bg-blue-500/60 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 24-Hour Timeline */}
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="p-2 pb-1.5 border-b border-zinc-800/50">
          <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            24H Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-[40px] w-full">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <span className="text-[7px] font-mono text-zinc-600">00:00</span>
            <span className="text-[7px] font-mono text-zinc-600">12:00</span>
            <span className="text-[7px] font-mono text-zinc-600">23:59</span>
          </div>
        </CardContent>
      </Card>

      {/* Regional Impact */}
      {snap.casualties?.regional && (
        <Card className="bg-blue-500/5 border border-blue-500/20">
          <CardContent className="p-2 py-1.5">
            <div className="text-[8px] font-bold text-blue-400/70 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-500 rounded-full" />
              Territorial Impact
            </div>
            <div className="space-y-1">
              {Object.entries(snap.casualties.regional).map(([region, data]: [string, any]) => (
                <div key={region} className="flex items-center justify-between border-b border-blue-500/10 pb-1 last:border-0 last:pb-0">
                  <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-tight">{region}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono text-red-400 leading-none">{data.killed}</span>
                      <span className="text-[6px] text-zinc-500 uppercase font-bold">KIA</span>
                    </div>
                    <Separator orientation="vertical" className="h-3 bg-blue-500/20" />
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono text-amber-400 leading-none">{data.injured}</span>
                      <span className="text-[6px] text-zinc-500 uppercase font-bold">WIA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
