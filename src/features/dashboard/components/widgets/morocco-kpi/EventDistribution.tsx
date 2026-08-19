'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PieChart, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type EventDistributionProps = {
  data: any[];
};

export function EventDistribution({ data }: EventDistributionProps) {
  const option = useMemo(() => {
    const formattedData = data.map((d, idx) => {
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#ec4899', '#64748b'];
      return {
        value: d.count,
        name: d.type,
        itemStyle: {
          color: colors[idx % colors.length],
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 22, 0.96)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        textStyle: { color: '#e4e4e7', fontSize: 10, fontFamily: 'monospace' },
        formatter: '{b}: {c} events ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: '#94a3b8',
          fontSize: 8.5,
          fontFamily: 'monospace',
        },
      },
      series: [
        {
          name: 'Incident Types',
          type: 'pie',
          radius: ['38%', '70%'],
          center: ['35%', '50%'],
          roseType: 'radius',
          itemStyle: {
            borderRadius: 3,
            borderColor: '#09090b',
            borderWidth: 1.5,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 9,
              fontWeight: 'bold',
              color: '#f8fafc',
              fontFamily: 'monospace',
            },
          },
          data: formattedData,
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
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Topology & Incident Rose Matrix
          <Badge variant="outline" className="ml-1.5 text-[8px] bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-mono">
            RADIAL OSINT
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ReactECharts option={option} style={{ height: '170px' }} />
      </CardContent>
    </Card>
  );
}
