'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type EventDistributionProps = {
  data: any[];
};

export function EventDistribution({ data }: EventDistributionProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '20%', right: '8%', bottom: '0%', top: '5%', containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: '#3b82f6',
      textStyle: { color: '#e4e4e7', fontSize: 10 },
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.type),
      axisLine: { show: false },
      axisLabel: { color: '#a1a1aa', fontSize: 9 },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Events',
        type: 'bar',
        data: data.map((d) => d.count),
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 1,
            y: 0,
            x2: 0,
            y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.2)' },
            ],
          },
          borderRadius: [0, 2, 2, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#71717a',
          fontSize: 9,
          fontFamily: 'monospace',
          formatter: '{c}',
        },
      },
    ],
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <MapPin className="w-3 h-3 text-blue-500" />
          Topology Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ReactECharts option={option} style={{ height: '140px' }} />
      </CardContent>
    </Card>
  );
}
