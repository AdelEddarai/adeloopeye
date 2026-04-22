'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GitMerge, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type IntuitiveSankeyProps = {
  data: any;
  onNavigate: (location: string) => void;
  onLocationSelect: (location: string) => void;
  selectedLocation: string | null;
};

export function IntuitiveSankey({ data, onNavigate, onLocationSelect, selectedLocation }: IntuitiveSankeyProps) {
  const sankeyData = useMemo(() => {
    if (!data || !data.events || data.events.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodes: any[] = [];
    const links: any[] = [];
    const nodeSet = new Set<string>();

    // NEW FLOW: Severity → Location → Event Type
    const severityToLocation = new Map<string, number>();
    const locationToType = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    data.events.forEach((event: any) => {
      const severity =
        event.severity === 'CRITICAL' ? '🔴 Critical' : event.severity === 'HIGH' ? '🟠 High' : '🔵 Standard';
      const location = event.location || 'Unknown';
      const eventType = event.type.replace(/_/g, ' ').slice(0, 20); // Shorten type names

      // Count frequencies
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      typeCounts.set(eventType, (typeCounts.get(eventType) || 0) + 1);

      // Severity → Location
      const slKey = `${severity}→${location}`;
      severityToLocation.set(slKey, (severityToLocation.get(slKey) || 0) + 1);

      // Location → Event Type
      const ltKey = `${location}→${eventType}`;
      locationToType.set(ltKey, (locationToType.get(ltKey) || 0) + 1);
    });

    // INTELLIGENCE LAYER: Filter to top 6 locations and top 8 event types
    const topLocations = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // Top 6 locations
      .map(([loc]) => loc);

    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 event types
      .map(([type]) => type);

    const topLocationSet = new Set(topLocations);
    const topTypeSet = new Set(topTypes);

    // Filter links to only include top locations and types
    const filteredSeverityToLocation = new Map<string, number>();
    const filteredLocationToType = new Map<string, number>();

    severityToLocation.forEach((value, key) => {
      const [source, target] = key.split('→');
      if (topLocationSet.has(target)) {
        filteredSeverityToLocation.set(key, value);
        nodeSet.add(source); // Severity
        nodeSet.add(target); // Location
      }
    });

    locationToType.forEach((value, key) => {
      const [source, target] = key.split('→');
      if (topLocationSet.has(source) && topTypeSet.has(target)) {
        filteredLocationToType.set(key, value);
        nodeSet.add(source); // Location
        nodeSet.add(target); // Event Type
      }
    });

    // Create nodes array with metadata AND COLORS
    nodeSet.forEach((name) => {
      const isLocation = topLocationSet.has(name);
      const isSeverity = name.includes('🔴') || name.includes('🟠') || name.includes('🔵');
      const isSelected = selectedLocation === name;

      // Determine color based on node type
      let nodeColor = '#8b5cf6'; // Default purple for event types

      if (name.includes('🔴')) {
        nodeColor = '#ef4444'; // Red - Critical
      } else if (name.includes('🟠')) {
        nodeColor = '#f59e0b'; // Orange - High
      } else if (name.includes('🔵')) {
        nodeColor = '#3b82f6'; // Blue - Standard
      } else if (isLocation) {
        nodeColor = isSelected ? '#22c55e' : '#10b981'; // Brighter green if selected
      }

      nodes.push({
        name,
        isLocation,
        isSeverity,
        itemStyle: {
          color: nodeColor,
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? '#22c55e' : '#27272a',
          shadowBlur: isSelected ? 15 : 0,
          shadowColor: isSelected ? 'rgba(34, 197, 94, 0.8)' : 'transparent',
        },
      });
    });

    // Create links
    filteredSeverityToLocation.forEach((value, key) => {
      const [source, target] = key.split('→');
      links.push({ source, target, value });
    });

    filteredLocationToType.forEach((value, key) => {
      const [source, target] = key.split('→');
      links.push({ source, target, value });
    });

    return { nodes, links };
  }, [data, selectedLocation]);

  const handleNodeClick = (params: any) => {
    if (params.dataType === 'node') {
      const nodeName = params.name;
      const nodeData = sankeyData.nodes.find((n: any) => n.name === nodeName);

      // Only handle location nodes
      if (nodeData?.isLocation) {
        onLocationSelect(nodeName); // Select location (highlights all events there)
      }
    }
  };

  // Track double-click
  const handleNodeDblClick = (params: any) => {
    if (params.dataType === 'node') {
      const nodeName = params.name;
      const nodeData = sankeyData.nodes.find((n: any) => n.name === nodeName);

      // Navigate on double-click for any node with location info
      if (nodeData?.isLocation) {
        onNavigate(nodeName);
        console.log('🗺️ Double-click: Opening map for location:', nodeName);
      }
    }
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(24, 24, 27, 0.98)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      textStyle: { color: '#e4e4e7', fontSize: 11 },
      padding: [8, 12],
      confine: true, // Keep tooltip within chart area
      enterable: false, // Prevent tooltip from disappearing when hovering over it
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const nodeData = sankeyData.nodes.find((n: any) => n.name === params.name);
          const clickHint = nodeData?.isLocation
            ? '<div style="margin-top:6px; padding-top:6px; border-top:1px solid #3f3f46; color:#60a5fa; font-size:9px;">💡 Double-click to view on map</div>'
            : '';

          return `<div style="font-weight:bold; color:#fff; margin-bottom:4px;">${params.name}</div>
                  <div style="color:#a1a1aa; font-size:10px;">Total flow: <span style="color:#60a5fa; font-family:monospace;">${params.value}</span></div>
                  ${clickHint}`;
        }
        return `<div style="color:#a1a1aa; font-size:10px;">
                  ${params.data.source} → ${params.data.target}
                  <div style="color:#60a5fa; font-family:monospace; margin-top:4px;">${params.data.value} events</div>
                </div>`;
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: { focus: 'adjacency' },
        data: sankeyData.nodes,
        links: sankeyData.links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
          opacity: 0.3,
        },
        label: {
          color: '#e4e4e7',
          fontSize: 9,
          fontWeight: 'bold',
          padding: [2, 4],
        },
      },
    ],
  };

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <GitMerge className="w-3 h-3 text-purple-500 rotate-90" />
          Intelligence Flow
          <Badge variant="outline" className="ml-2 text-[8px] bg-purple-500/10 border-purple-500/30 text-purple-400">
            FILTERED
          </Badge>
        </CardTitle>
        <span className="text-[8px] text-zinc-500 max-w-[240px] text-right leading-tight flex items-center gap-1">
          <ExternalLink className="w-2.5 h-2.5" />
          Double-click location → Map
        </span>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ReactECharts
          option={option}
          style={{ height: '240px' }}
          onEvents={{
            click: handleNodeClick,
            dblclick: handleNodeDblClick,
          }}
        />
      </CardContent>
    </Card>
  );
}
