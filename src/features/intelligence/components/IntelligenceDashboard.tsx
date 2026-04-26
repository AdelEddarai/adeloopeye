'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Loader2, Minus, RefreshCw, Shield, TrendingDown, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/shared/lib/query/client';

type GeopoliticalIndicator = {
  id: string;
  category: 'MILITARY' | 'DIPLOMATIC' | 'ECONOMIC' | 'CYBER' | 'HUMANITARIAN';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'ESCALATING' | 'STABLE' | 'DE-ESCALATING';
  confidence: number;
  sources: number;
  lastUpdated: string;
  metrics: { label: string; value: string; change?: string }[];
  relatedEvents: string[];
};

type ThreatAssessment = {
  region: string;
  threatLevel: 'EXTREME' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW';
  score: number;
  factors: { military: number; political: number; economic: number; cyber: number };
  keyThreats: string[];
  lastUpdated: string;
};

type StrategicIndicator = {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
};

type IntelligenceData = {
  indicators: GeopoliticalIndicator[];
  threats: ThreatAssessment[];
  strategic: StrategicIndicator[];
  generatedAt: string;
};

export function IntelligenceDashboard() {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['geopolitical-intelligence'],
    queryFn: () => api.get<IntelligenceData>('/intelligence/geopolitical'),
    staleTime: 180000, // 3 minutes
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  const indicators = data?.indicators || [];
  const threats = data?.threats || [];
  const strategic = data?.strategic || [];
  const selectedData = indicators.find(i => i.id === selectedIndicator);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-1)] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[var(--bg-app)] border-b border-[var(--bd)]">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-[var(--blue)]" />
          <h1 className="text-[var(--t1)] font-bold text-lg mono">GEOPOLITICAL INTELLIGENCE</h1>
          <span className="text-[var(--t4)] text-xs mono">REAL-TIME ANALYSIS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[var(--t4)] text-xs mono">
            {data?.generatedAt && new Date(data.generatedAt).toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            <span className="ml-1.5 text-xs">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Strategic Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {strategic.map((indicator) => (
            <div
              key={indicator.name}
              className="bg-[var(--bg-2)] border border-[var(--bd)] p-4 rounded"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-[var(--t2)] font-semibold text-sm mb-1">
                    {indicator.name}
                  </h3>
                  <p className="text-[var(--t4)] text-xs leading-relaxed">
                    {indicator.description}
                  </p>
                </div>
                <div className="ml-3">
                  {indicator.trend === 'up' ? (
                    <TrendingUp size={20} className="text-[var(--danger)]" />
                  ) : indicator.trend === 'down' ? (
                    <TrendingDown size={20} className="text-[var(--success)]" />
                  ) : (
                    <Minus size={20} className="text-[var(--t4)]" />
                  )}
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div className="mono text-3xl font-bold text-[var(--t1)]">
                  {indicator.value}
                </div>
                <div className={`flex items-center gap-1 text-xs mono ${
                  indicator.change > 0 ? 'text-[var(--danger)]' : 
                  indicator.change < 0 ? 'text-[var(--success)]' : 
                  'text-[var(--t4)]'
                }`}>
                  {indicator.change > 0 ? <ArrowUp size={12} /> : indicator.change < 0 ? <ArrowDown size={12} /> : null}
                  {Math.abs(indicator.change)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Threat Assessments */}
        <div>
          <h2 className="text-[var(--t2)] font-bold text-sm mono mb-3 tracking-wider">
            REGIONAL THREAT ASSESSMENTS
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {threats.map((threat) => (
              <div
                key={threat.region}
                className="bg-[var(--bg-2)] border border-[var(--bd)] p-4 rounded"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[var(--t1)] font-bold text-base">{threat.region}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold mono px-2 py-1 rounded"
                      style={{
                        background: getThreatColor(threat.threatLevel) + '20',
                        color: getThreatColor(threat.threatLevel),
                      }}
                    >
                      {threat.threatLevel}
                    </span>
                    <span className="text-2xl font-bold mono text-[var(--t1)]">
                      {threat.score}
                    </span>
                  </div>
                </div>

                {/* Threat Factors */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {Object.entries(threat.factors).map(([factor, value]) => (
                    <div key={factor} className="flex items-center justify-between">
                      <span className="text-[var(--t4)] text-xs capitalize">{factor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[var(--bg-3)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${value}%`,
                              background: value > 80 ? 'var(--danger)' : value > 60 ? 'var(--warning)' : 'var(--info)',
                            }}
                          />
                        </div>
                        <span className="text-[var(--t3)] text-xs mono w-8 text-right">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Threats */}
                <div>
                  <h4 className="text-[var(--t4)] text-xs font-bold mono mb-2">KEY THREATS</h4>
                  <ul className="space-y-1">
                    {threat.keyThreats.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[var(--t3)] text-xs">
                        <AlertTriangle size={12} className="text-[var(--warning)] shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geopolitical Indicators */}
        <div>
          <h2 className="text-[var(--t2)] font-bold text-sm mono mb-3 tracking-wider">
            GEOPOLITICAL INDICATORS
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className={`bg-[var(--bg-2)] border border-[var(--bd)] p-4 rounded cursor-pointer transition-colors ${
                  selectedIndicator === indicator.id ? 'border-[var(--blue)]' : 'hover:border-[var(--bd-hover)]'
                }`}
                onClick={() => setSelectedIndicator(selectedIndicator === indicator.id ? null : indicator.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                        style={{
                          background: getCategoryColor(indicator.category) + '20',
                          color: getCategoryColor(indicator.category),
                        }}
                      >
                        {indicator.category}
                      </span>
                      <span
                        className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                        style={{
                          background: getSeverityColor(indicator.severity) + '20',
                          color: getSeverityColor(indicator.severity),
                        }}
                      >
                        {indicator.severity}
                      </span>
                      <span
                        className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                        style={{
                          background: getTrendColor(indicator.trend) + '20',
                          color: getTrendColor(indicator.trend),
                        }}
                      >
                        {indicator.trend}
                      </span>
                    </div>
                    <h3 className="text-[var(--t1)] font-bold text-base mb-1">{indicator.title}</h3>
                    <p className="text-[var(--t3)] text-sm">{indicator.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-[var(--t4)] text-xs mono mb-1">CONFIDENCE</div>
                    <div className="text-2xl font-bold mono text-[var(--blue)]">{indicator.confidence}%</div>
                    <div className="text-[var(--t4)] text-xs mono mt-1">{indicator.sources} sources</div>
                  </div>
                </div>

                {selectedIndicator === indicator.id && (
                  <div className="mt-4 pt-4 border-t border-[var(--bd)] space-y-3">
                    {/* Metrics */}
                    <div>
                      <h4 className="text-[var(--t4)] text-xs font-bold mono mb-2">METRICS</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {indicator.metrics.map((metric, i) => (
                          <div key={i} className="bg-[var(--bg-1)] p-2 rounded">
                            <div className="text-[var(--t4)] text-[10px] mono mb-1">{metric.label}</div>
                            <div className="text-[var(--t1)] font-bold text-sm">{metric.value}</div>
                            {metric.change && (
                              <div className="text-[var(--t4)] text-[10px] mono mt-0.5">{metric.change}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Related Events */}
                    <div>
                      <h4 className="text-[var(--t4)] text-xs font-bold mono mb-2">RELATED EVENTS</h4>
                      <ul className="space-y-1">
                        {indicator.relatedEvents.map((event, i) => (
                          <li key={i} className="flex items-start gap-2 text-[var(--t3)] text-xs">
                            <Activity size={12} className="text-[var(--blue)] shrink-0 mt-0.5" />
                            <span>{event}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getThreatColor(level: string): string {
  const colors: Record<string, string> = {
    'EXTREME': '#dc2626',
    'HIGH': '#ea580c',
    'ELEVATED': '#f59e0b',
    'MODERATE': '#3b82f6',
    'LOW': '#10b981',
  };
  return colors[level] || '#6b7280';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'MILITARY': '#dc2626',
    'DIPLOMATIC': '#3b82f6',
    'ECONOMIC': '#f59e0b',
    'CYBER': '#8b5cf6',
    'HUMANITARIAN': '#10b981',
  };
  return colors[category] || '#6b7280';
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    'CRITICAL': '#ef4444',
    'HIGH': '#f97316',
    'MEDIUM': '#f59e0b',
    'LOW': '#3b82f6',
  };
  return colors[severity] || '#6b7280';
}

function getTrendColor(trend: string): string {
  const colors: Record<string, string> = {
    'ESCALATING': '#ef4444',
    'STABLE': '#3b82f6',
    'DE-ESCALATING': '#10b981',
  };
  return colors[trend] || '#6b7280';
}
