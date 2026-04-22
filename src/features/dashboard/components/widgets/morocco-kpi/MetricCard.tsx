'use client';

import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type MetricCardProps = {
  title: string;
  value: number;
  trend?: { value: number; percent: number } | null;
  icon: React.ReactNode;
  color: 'blue' | 'danger' | 'warning' | 'info' | 'success';
};

export function MetricCard({ title, value, trend, icon, color }: MetricCardProps) {
  const colorMap = {
    blue: '#3b82f6',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    success: '#10b981',
  };
  
  const trendColor = trend && trend.value > 0 ? '#ef4444' : trend && trend.value < 0 ? '#10b981' : '#71717a';
  const TrendIcon = trend && trend.value > 0 ? ArrowUpRight : trend && trend.value < 0 ? ArrowDownRight : Minus;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/80 overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: colorMap[color], opacity: 0.8 }} />
      <div
        className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-3xl transition-opacity duration-500 opacity-20 group-hover:opacity-40"
        style={{ backgroundColor: colorMap[color] }}
      />
      <CardContent className="p-3 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 rounded-lg bg-zinc-950 shadow-inner border border-zinc-800/50" style={{ color: colorMap[color] }}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-0.5 bg-zinc-950/60 px-1.5 py-0.5 rounded-sm border border-zinc-800/30" style={{ color: trendColor }}>
              <TrendIcon className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold mono">{Math.abs(trend.percent).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold font-mono truncate">{title}</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold mono tracking-tight text-white leading-none">{value.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
