'use client';

import dynamic from 'next/dynamic';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type InfrastructureChartProps = {
  data: any[];
};

export function InfrastructureChart({ data }: InfrastructureChartProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 20, 30, 0.95)',
      borderColor: '#4a90e2',
      textStyle: { color: '#e5e7eb' },
    },
    legend: {
      data: ['Infrastructure', 'Connections'],
      textStyle: { color: '#9ca3af' },
      top: 0,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
    },
    series: [
      {
        name: 'Infrastructure',
        type: 'line',
        data: data.map((d) => d.infrastructure),
        smooth: true,
        lineStyle: { width: 3, color: '#10b981' },
        itemStyle: { color: '#10b981' },
      },
      {
        name: 'Connections',
        type: 'line',
        data: data.map((d) => d.connections),
        smooth: true,
        lineStyle: { width: 3, color: '#4a90e2' },
        itemStyle: { color: '#4a90e2' },
      },
    ],
  };

  return (
    <Card className="bg-[var(--bg-2)] border-[var(--bd)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--t2)] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--success)]" />
          Infrastructure & Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '160px' }} />
      </CardContent>
    </Card>
  );
}
