'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Flame, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type EventsTimelineProps = {
  data: any[];
};

export function EventsTimeline({ data }: EventsTimelineProps) {
  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      grid: { left: '2%', right: '2%', bottom: '2%', top: '16%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: 'rgba(59, 130, 246, 0.4)', width: 1, type: 'dashed' },
        },
        backgroundColor: 'rgba(10, 14, 22, 0.96)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        textStyle: { color: '#e4e4e7', fontSize: 10, fontFamily: 'monospace' },
        padding: [6, 10],
      },
      legend: {
        data: ['TOTAL EVENTS', 'CRITICAL INCIDENTS', 'ACTIVE FIRES / EMERGENCIES'],
        textStyle: { color: '#a1a1aa', fontSize: 8.5, fontFamily: 'monospace' },
        top: 0,
        right: 0,
        itemWidth: 8,
        itemHeight: 8,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLine: { lineStyle: { color: '#27272a' } },
        axisLabel: { color: '#71717a', fontSize: 9, fontFamily: 'monospace' },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: '#71717a', fontSize: 9, fontFamily: 'monospace' },
          splitLine: { lineStyle: { color: 'rgba(39, 39, 42, 0.6)', type: 'dashed' } },
        },
      ],
      series: [
        {
          name: 'TOTAL EVENTS',
          type: 'line',
          smooth: 0.35,
          showSymbol: false,
          data: data.map((d) => d.events),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.45)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
              ],
            },
          },
          lineStyle: { width: 2, color: '#3b82f6', shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.6)' },
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: 'CRITICAL INCIDENTS',
          type: 'line',
          smooth: 0.35,
          showSymbol: false,
          data: data.map((d) => d.critical),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.01)' },
              ],
            },
          },
          lineStyle: { width: 2.2, color: '#ef4444', shadowBlur: 12, shadowColor: 'rgba(239, 68, 68, 0.8)' },
          itemStyle: { color: '#ef4444' },
          markPoint: data.length > 0 ? {
            data: [
              {
                coord: [data.length - 1, data[data.length - 1]?.critical ?? 0],
                symbol: 'circle',
                symbolSize: 10,
                itemStyle: {
                  color: '#ef4444',
                  shadowBlur: 15,
                  shadowColor: 'rgba(239, 68, 68, 1)',
                },
                label: { show: false },
              },
            ],
          } : undefined,
        },
        {
          name: 'ACTIVE FIRES / EMERGENCIES',
          type: 'bar',
          data: data.map((d) => d.fires || 0),
          barWidth: '25%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.8)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.1)' },
              ],
            },
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  return (
    <Card className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden shadow-lg">
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      <CardHeader className="p-3 pb-1 border-b border-zinc-900 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-widest">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Event Velocity & Threat Timeline
          <Badge variant="outline" className="ml-1.5 text-[8px] bg-blue-500/10 border-blue-500/30 text-blue-400 font-mono">
            TEMPORAL INTEL
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 pt-1">
        <ReactECharts option={option} style={{ height: '140px' }} />
      </CardContent>
    </Card>
  );
}
