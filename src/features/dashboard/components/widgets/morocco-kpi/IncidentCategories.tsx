'use client';

import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IncidentCategoriesProps = {
  data: any[];
};

export function IncidentCategories({ data }: IncidentCategoriesProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '1%', right: '1%', bottom: '0%', top: '15%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(24, 24, 27, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#e4e4e7', fontSize: 10 },
      extraCssText: 'backdrop-filter: blur(8px); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);',
    },
    legend: {
      data: ['Fires', 'Traffic', 'Weather'],
      textStyle: { color: '#71717a', fontSize: 9 },
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
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
        name: 'Fires',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.fires),
        itemStyle: { 
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245, 158, 11, 0.9)' }, { offset: 1, color: 'rgba(245, 158, 11, 0.3)' }]
          }
        },
        barWidth: '40%',
      },
      {
        name: 'Traffic',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.traffic),
        itemStyle: { 
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.9)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.3)' }]
          }
        },
      },
      {
        name: 'Weather',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.weather),
        itemStyle: { 
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.9)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.3)' }]
          },
          borderRadius: [4, 4, 0, 0] 
        },
      },
    ],
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <BarChart3 className="w-3 h-3 text-emerald-500" />
          Incident Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <ReactECharts option={option} style={{ height: '110px' }} />
      </CardContent>
    </Card>
  );
}
