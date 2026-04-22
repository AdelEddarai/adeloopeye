'use client';

import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type EventsTimelineProps = {
  data: any[];
};

export function EventsTimeline({ data }: EventsTimelineProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '1%', right: '1%', bottom: '0%', top: '8%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#27272a',
      textStyle: { color: '#e4e4e7', fontSize: 10 },
    },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { show: false },
      axisLabel: { color: '#71717a', fontSize: 9 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#71717a', fontSize: 9 },
      splitLine: { lineStyle: { color: '#27272a', type: 'dashed' } },
    },
    series: [
      {
        name: 'Total Events',
        type: 'bar',
        data: data.map((d) => d.events),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
        barWidth: '60%',
      },
      {
        name: 'Critical',
        type: 'line',
        data: data.map((d) => d.critical),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          color: '#ef4444',
          shadowBlur: 8,
          shadowColor: 'rgba(239, 68, 68, 0.4)',
        },
        itemStyle: { color: '#ef4444', borderWidth: 1, borderColor: '#18181b' },
      },
    ],
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <Activity className="w-3 h-3 text-blue-500" />
          Volume & Critical Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ReactECharts option={option} style={{ height: '110px' }} />
      </CardContent>
    </Card>
  );
}
