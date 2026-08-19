'use client';

import { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type MetricCardProps = {
  title: string;
  value: number;
  trend?: { value: number; percent: number } | null;
  icon: React.ReactNode;
  color: 'blue' | 'danger' | 'warning' | 'info' | 'success' | 'purple';
  subtitle?: string;
  sparklineData?: number[];
  targetValue?: number;
  classification?: string;
};

export function MetricCard({
  title,
  value,
  trend,
  icon,
  color,
  subtitle,
  sparklineData = [12, 18, 15, 22, 19, 28, 25, 34, 30, value || 42],
  targetValue,
  classification = 'SIGINT',
}: MetricCardProps) {
  const colorMap = {
    blue: { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
    danger: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
    warning: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
    info: { main: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)' },
    success: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
    purple: { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
  };

  const c = colorMap[color] || colorMap.blue;
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const trendColor = trendPositive ? '#ef4444' : trendNegative ? '#10b981' : '#71717a';
  const TrendIcon = trendPositive ? ArrowUpRight : trendNegative ? ArrowDownRight : Minus;

  // Generate SVG path for mini-sparkline
  const sparklinePath = useMemo(() => {
    const data = sparklineData.length > 0 ? sparklineData : [10, 15, 12, 20, 18, 25];
    const min = Math.min(...data);
    const max = Math.max(...data, min + 1);
    const width = 64;
    const height = 20;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / (max - min)) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }, [sparklineData]);

  return (
    <Card className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-300 relative overflow-hidden group shadow-lg backdrop-blur-md">
      {/* Top laser accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.main}, transparent)`,
        }}
      />

      {/* Subtle corner reticles (Palantir bracket style) */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      {/* Ambient background glow on hover */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: c.main }}
      />

      <CardContent className="p-3 relative z-10 space-y-2">
        {/* Top Header Row: Icon + Classification Badge + Trend Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs shadow-inner"
              style={{ color: c.main, borderColor: c.border }}
            >
              {icon}
            </div>
            <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase font-semibold px-1 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/40">
              {classification}
            </span>
          </div>

          {trend && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
              style={{
                color: trendColor,
                backgroundColor: `${trendColor}12`,
                borderColor: `${trendColor}30`,
              }}
            >
              <TrendIcon className="w-2.5 h-2.5" />
              <span>{Math.abs(trend.percent).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Middle Metric Value + Sparkline */}
        <div className="flex items-end justify-between gap-2 pt-0.5">
          <div>
            <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono font-medium truncate">
              {title}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono tracking-tight text-zinc-100 leading-none">
                {value.toLocaleString()}
              </span>
              {subtitle && (
                <span className="text-[9px] font-mono text-zinc-500 font-normal">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* SVG Mini Sparkline */}
          <div className="w-16 h-6 flex items-end justify-end pb-0.5 shrink-0 opacity-85 group-hover:opacity-100 transition-opacity">
            <svg width="64" height="20" className="overflow-visible">
              <path
                d={sparklinePath}
                fill="none"
                stroke={c.main}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0px 0px 4px ${c.glow})` }}
              />
            </svg>
          </div>
        </div>

        {/* Bottom Tactical Progress / Metric Bar */}
        {targetValue !== undefined && (
          <div className="pt-1 border-t border-zinc-900 flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(5, (value / targetValue) * 100))}%`,
                  backgroundColor: c.main,
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-zinc-500 shrink-0">
              {Math.round((value / targetValue) * 100)}% cap
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
