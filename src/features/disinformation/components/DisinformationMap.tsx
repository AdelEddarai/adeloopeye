'use client';

import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';
import * as echarts from 'echarts';

import type { DisinfoEdge, DisinfoNode } from '@/shared/hooks/use-live-disinformation';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const CAMPAIGN_COLOR = '#f59e0b';
const BOT_COLOR = '#38bdf8';
const FOCUS_COLOR = '#f87171';

type Props = {
  edges: DisinfoEdge[];
  nodes: DisinfoNode[];
  focus: { code: string; name: string; lat: number; lon: number };
};

function coordOf(nodes: DisinfoNode[], code: string): [number, number] {
  const n = nodes.find(x => x.code === code);
  return n ? [n.lon, n.lat] : [0, 0];
}

export function DisinformationMap({ edges, nodes, focus }: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/world.json')
      .then(r => r.json())
      .then(geo => {
        if (cancelled) return;
        echarts.registerMap('world', geo);
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const option = useMemo(() => {
    const campaignEdges = edges
      .filter(e => e.kind === 'CAMPAIGN')
      .map(e => ({
        coords: [coordOf(nodes, e.source), coordOf(nodes, e.target)],
        value: e.weight,
        from: e.source,
        to: e.target,
        weight: e.weight,
        sources: e.sources,
      }));

    const botEdges = edges
      .filter(e => e.kind === 'BOT_TRAFFIC')
      .map(e => ({
        coords: [coordOf(nodes, e.source), coordOf(nodes, e.target)],
        value: e.weight,
        from: e.source,
        to: e.target,
        weight: e.weight,
      }));

    const scatter = nodes
      .filter(n => n.campaignVolume + n.botVolume > 0)
      .map(n => ({ name: n.code, value: [n.lon, n.lat, n.campaignVolume + n.botVolume] }));

    const focusNode = { name: focus.code, value: [focus.lon, focus.lat, 1] };

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(12,12,16,0.96)',
        borderColor: '#27272a',
        borderWidth: 1,
        textStyle: { color: '#e4e4e7', fontSize: 11 },
        padding: [8, 12],
        confine: true,
        formatter: (p: any) => {
          if (p.seriesType === 'lines') {
            const d = p.data;
            const color = p.seriesName === 'CAMPAIGN' ? CAMPAIGN_COLOR : BOT_COLOR;
            const kind = p.seriesName === 'CAMPAIGN' ? 'REPORTED CAMPAIGN' : 'OBSERVED BOT TRAFFIC';
            const src = nodes.find(n => n.code === d.from);
            const tgt = nodes.find(n => n.code === d.to);
            const refs = (d.sources || [])
              .map(
                (s: any) =>
                  `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #27272a;"><a href="${s.url}" target="_blank" style="color:#60a5fa;text-decoration:none;">${s.title}</a><span style="color:#52525b;"> · ${s.domain}</span></div>`
              )
              .join('');
            return `<div style="max-width:300px;">
                <div style="font-weight:bold;font-size:12px;color:#fff;">${src?.name ?? d.from} → ${tgt?.name ?? d.to}</div>
                <div style="margin-top:4px;display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};"></span>
                  <span style="color:#a1a1aa;font-family:monospace;font-size:10px;font-weight:bold;">${kind}</span>
                  <span style="color:#71717a;margin-left:auto;font-family:monospace;font-size:10px;">weight: ${d.weight}</span>
                </div>${refs}</div>`;
          }
          if (p.seriesType === 'effectScatter') {
            if (p.data.name === focus.code) {
              return `<div style="font-weight:bold;font-size:12px;color:#fff;">${focus.name}</div>
                <div style="margin-top:4px;color:#f87171;font-family:monospace;font-size:10px;">FOCUS COUNTRY — radar target</div>`;
            }
            const n = nodes.find(x => x.code === p.data.name);
            if (!n) return '';
            return `<div style="font-weight:bold;font-size:12px;color:#fff;">${n.name}</div>
              <div style="margin-top:4px;display:flex;flex-direction:column;gap:2px;font-family:monospace;font-size:10px;">
                <span style="color:#f59e0b;">campaign refs: ${n.campaignVolume}</span>
                <span style="color:#38bdf8;">bot volume: ${n.botVolume}</span>
              </div>`;
          }
          return '';
        },
      },
      legend: {
        data: ['CAMPAIGN', 'BOT TRAFFIC'],
        top: 8,
        left: 8,
        textStyle: { color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace' },
        itemWidth: 12,
        itemHeight: 8,
        icon: 'rect',
      },
      geo: {
        map: 'world',
        roam: true,
        zoom: 1.1,
        scaleLimit: { min: 1, max: 20 },
        itemStyle: { areaColor: '#131316', borderColor: '#2a2a31', borderWidth: 0.5 },
        emphasis: { label: { show: false }, itemStyle: { areaColor: '#1c1c22' } },
        regions: [
          {
            name: focus.name,
            itemStyle: { areaColor: '#341216', borderColor: FOCUS_COLOR, borderWidth: 1.5 },
          },
        ],
      },
      series: [
        {
          name: 'CAMPAIGN',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          data: campaignEdges,
          lineStyle: { color: CAMPAIGN_COLOR, width: 1.6, opacity: 0.8, curveness: 0.25 },
          effect: { show: true, period: 5, trailLength: 0.25, symbol: 'arrow', symbolSize: 4, color: CAMPAIGN_COLOR },
          emphasis: { lineStyle: { width: 3 } },
        },
        {
          name: 'BOT TRAFFIC',
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          data: botEdges,
          lineStyle: { color: BOT_COLOR, width: 1.2, opacity: 0.5, curveness: 0.2 },
          effect: { show: true, period: 7, trailLength: 0.35, symbol: 'circle', symbolSize: 3, color: BOT_COLOR },
          emphasis: { lineStyle: { width: 3 } },
        },
        {
          type: 'effectScatter',
          name: 'SOURCE VOLUME',
          coordinateSystem: 'geo',
          zlevel: 3,
          data: scatter,
          symbolSize: (val: any) => Math.max(6, Math.min(24, Math.sqrt(Number(val[2]) || 0) * 4)),
          rippleEffect: { brushType: 'stroke', scale: 3 },
          itemStyle: { color: '#a1a1aa' },
          label: { show: false },
        },
        {
          type: 'effectScatter',
          name: 'FOCUS',
          coordinateSystem: 'geo',
          zlevel: 4,
          data: [focusNode],
          symbol: 'pin',
          symbolSize: 44,
          itemStyle: { color: FOCUS_COLOR },
          label: {
            show: true,
            formatter: focus.name,
            position: 'top',
            color: FOCUS_COLOR,
            fontSize: 11,
            fontWeight: 'bold',
          },
        },
      ],
    };
  }, [edges, nodes, focus]);

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--danger)]">
          WORLD MAP DATA UNAVAILABLE
        </span>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)] animate-pulse">
          LOADING MAP...
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
    </div>
  );
}
