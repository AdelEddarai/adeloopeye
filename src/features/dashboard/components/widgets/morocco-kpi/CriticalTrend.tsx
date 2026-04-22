'use client';

import dynamic from 'next/dynamic';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type CriticalTrendProps = {
  data: any[];
};

export function CriticalTrend({ data }: CriticalTrendProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '1%', right: '1%', bottom: '0%', top: '10%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#ef4444',
      textStyle: { color: '#e4e4e7', fontSize: 10 },
    },
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
        name: 'Critical',
        type: 'line',
        data: data.map((d) => d.critical),
        smooth: true,
        symbol: 'none',
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
        lineStyle: { width: 2, color: '#ef4444' },
        itemStyle: { color: '#ef4444' },
      },
    ],
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          Critical Events Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ReactECharts option={option} style={{ height: '110px' }} />
      </CardContent>
    </Card>
  );
}
