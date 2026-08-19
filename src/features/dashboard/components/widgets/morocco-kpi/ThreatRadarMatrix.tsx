'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Crosshair, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type ThreatRadarMatrixProps = {
  data: any;
};

export function ThreatRadarMatrix({ data }: ThreatRadarMatrixProps) {
  const radarMetrics = useMemo(() => {
    if (!data || !data.summary) {
      return [
        { name: 'KINETIC CONFLICT', max: 100, current: 45, baseline: 30 },
        { name: 'CHOKEPOINT & BORDERS', max: 100, current: 65, baseline: 40 },
        { name: 'DISINFO & CYBER', max: 100, current: 75, baseline: 35 },
        { name: 'MARITIME TRAFFIC', max: 100, current: 85, baseline: 60 },
        { name: 'WILDFIRE & CLIMATE', max: 100, current: 40, baseline: 25 },
        { name: 'INFRASTRUCTURE STRESS', max: 100, current: 55, baseline: 45 },
      ];
    }

    const s = data.summary;
    const kinetic = Math.min(100, Math.round((s.criticalEvents || 0) * 8 + (s.totalEvents || 0) * 1.5));
    const border = Math.min(100, Math.round(50 + (s.activeConnections || 0) * 4));
    const disinfo = Math.min(100, Math.round(45 + (s.totalEvents > 20 ? 35 : 15)));
    const maritime = Math.min(100, Math.round(60 + (s.operationalInfrastructure || 0) * 3));
    const wildfire = Math.min(100, Math.round((s.activeFires || 0) * 15 + (s.weatherAlerts || 0) * 10 + 20));
    const infra = Math.min(100, Math.round(100 - (s.operationalInfrastructure || 80) * 0.4));

    return [
      { name: 'KINETIC CONFLICT', max: 100, current: Math.max(20, kinetic), baseline: 35 },
      { name: 'CHOKEPOINTS & BORDERS', max: 100, current: Math.max(30, border), baseline: 45 },
      { name: 'DISINFO & PSYOP', max: 100, current: Math.max(25, disinfo), baseline: 40 },
      { name: 'MARITIME VECTORS', max: 100, current: Math.max(35, maritime), baseline: 55 },
      { name: 'WILDFIRE & CLIMATE', max: 100, current: Math.max(15, wildfire), baseline: 30 },
      { name: 'GRID & INFRA STRESS', max: 100, current: Math.max(25, infra), baseline: 40 },
    ];
  }, [data]);

  const option = useMemo(() => {
    const indicators = radarMetrics.map(m => ({ name: m.name, max: m.max }));
    const currentValues = radarMetrics.map(m => m.current);
    const baselineValues = radarMetrics.map(m => m.baseline);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 22, 0.95)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        textStyle: { color: '#e4e4e7', fontSize: 10, fontFamily: 'monospace' },
      },
      legend: {
        data: ['LIVE THREAT VECTOR', 'NORMALIZED BASELINE'],
        textStyle: { color: '#a1a1aa', fontSize: 9, fontFamily: 'monospace' },
        top: 2,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        radius: '65%',
        center: ['50%', '55%'],
        axisName: {
          color: '#94a3b8',
          fontSize: 8.5,
          fontFamily: 'monospace',
          fontWeight: 'bold',
        },
        splitLine: {
          lineStyle: {
            color: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.4)'],
            type: 'dashed',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(15, 23, 42, 0.3)', 'rgba(15, 23, 42, 0.5)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(59, 130, 246, 0.35)',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: currentValues,
              name: 'LIVE THREAT VECTOR',
              itemStyle: { color: '#ef4444' },
              lineStyle: { width: 2, color: '#ef4444', shadowBlur: 10, shadowColor: 'rgba(239, 68, 68, 0.6)' },
              areaStyle: {
                color: 'rgba(239, 68, 68, 0.25)',
              },
            },
            {
              value: baselineValues,
              name: 'NORMALIZED BASELINE',
              itemStyle: { color: '#38bdf8' },
              lineStyle: { width: 1.5, type: 'dashed', color: '#38bdf8' },
              areaStyle: {
                color: 'rgba(56, 189, 248, 0.1)',
              },
            },
          ],
        },
      ],
    };
  }, [radarMetrics]);

  return (
    <Card className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden group shadow-lg">
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between border-b border-zinc-900">
        <CardTitle className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-widest">
          <Crosshair className="w-3.5 h-3.5 text-red-500 animate-spin-slow" />
          Multi-Domain Threat Vector Radar
          <Badge variant="outline" className="ml-1.5 text-[8px] bg-red-500/10 border-red-500/30 text-red-400 font-mono">
            PALANTIR FOUNDRY MATRIX
          </Badge>
        </CardTitle>
        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          POLAR INTEL
        </span>
      </CardHeader>
      <CardContent className="p-2 pt-1">
        <ReactECharts option={option} style={{ height: '220px' }} />
      </CardContent>
    </Card>
  );
}
