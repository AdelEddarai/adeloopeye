'use client';

import { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Target, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { selectEvent, clearSelection } from '@/shared/state/event-selection-slice';
import type { RootState } from '@/shared/state';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type NewsNetworkProps = {
  data: any;
  onNavigate: (location: string) => void;
};

export function NewsNetwork({ data, onNavigate }: NewsNetworkProps) {
  const dispatch = useDispatch();
  const selection = useSelector((state: RootState) => state.eventSelection);
  const chartRef = useRef<any>(null);

  // Build network graph from events
  const networkData = useMemo(() => {
    if (!data || !data.events || data.events.length === 0) {
      return { nodes: [], links: [], categories: [] };
    }

    const nodes: any[] = [];
    const links: any[] = [];
    const nodeMap = new Map<string, { idx: number; title: string; location?: string }>();

    // Define categories
    const categories = [
      { name: 'Critical', itemStyle: { color: '#ef4444' } },
      { name: 'High', itemStyle: { color: '#f59e0b' } },
      { name: 'Standard', itemStyle: { color: '#3b82f6' } },
      { name: 'Location', itemStyle: { color: '#10b981' } },
    ];

    // Create nodes from events (limit to 30 for performance)
    data.events.slice(0, 30).forEach((event: any, idx: number) => {
      const nodeId = event.id || `event-${idx}`;
      const categoryIdx = event.severity === 'CRITICAL' ? 0 : event.severity === 'HIGH' ? 1 : 2;
      const fullTitle = event.title;
      const shortTitle = event.title.slice(0, 30) + (event.title.length > 30 ? '...' : '');

      nodes.push({
        id: nodeId,
        name: shortTitle,
        fullTitle: fullTitle,
        location: event.location, // Store location for click handler
        value: event.severity === 'CRITICAL' ? 30 : event.severity === 'HIGH' ? 20 : 10,
        category: categoryIdx,
        symbolSize: event.severity === 'CRITICAL' ? 28 : event.severity === 'HIGH' ? 20 : 14,
        label: {
          show: event.severity === 'CRITICAL',
          fontSize: 8,
          color: '#e4e4e7',
          fontWeight: 'bold',
        },
        itemStyle: {
          borderWidth: 2,
          borderColor:
            event.severity === 'CRITICAL' ? '#ef4444' : event.severity === 'HIGH' ? '#f59e0b' : '#3b82f6',
          shadowBlur: event.severity === 'CRITICAL' ? 10 : 5,
          shadowColor:
            event.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.3)',
        },
      });

      nodeMap.set(nodeId, { idx: nodes.length - 1, title: fullTitle, location: event.location });

      // Create location nodes
      if (event.location) {
        const locId = `loc-${event.location}`;
        if (!nodeMap.has(locId)) {
          nodes.push({
            id: locId,
            name: event.location,
            fullTitle: `Location: ${event.location}`,
            location: event.location, // Store for click handler
            value: 15,
            category: 3,
            symbolSize: 18,
            symbol: 'diamond',
            label: {
              show: true,
              fontSize: 9,
              color: '#10b981',
              fontWeight: 'bold',
            },
            itemStyle: {
              borderWidth: 2,
              borderColor: '#10b981',
              shadowBlur: 8,
              shadowColor: 'rgba(16, 185, 129, 0.4)',
            },
          });
          nodeMap.set(locId, {
            idx: nodes.length - 1,
            title: `Location: ${event.location}`,
            location: event.location,
          });
        }

        // Link event to location
        links.push({
          source: nodeId,
          target: locId,
          value: 1,
          lineStyle: {
            opacity: 0.2,
            width: 1.5,
          },
        });
      }
    });

    // Create links between events of same type
    const slicedEvents = data.events.slice(0, 30);
    slicedEvents.forEach((event: any, idx: number) => {
      const nodeId = event.id || `event-${idx}`;

      // Find related events (same type or location)
      slicedEvents.slice(idx + 1, Math.min(idx + 5, 30)).forEach((otherEvent: any, relIdx: number) => {
        const otherNodeId = otherEvent.id || `event-${idx + relIdx + 1}`;

        if (event.type === otherEvent.type || event.location === otherEvent.location) {
          links.push({
            source: nodeId,
            target: otherNodeId,
            value: event.type === otherEvent.type ? 2 : 1,
            lineStyle: {
              opacity: event.type === otherEvent.type ? 0.15 : 0.08,
              curveness: 0.2,
              width: event.type === otherEvent.type ? 1.5 : 1,
            },
          });
        }
      });
    });

    return { nodes, links, categories };
  }, [data]);

  const handleNodeClick = (params: any) => {
    if (params.dataType === 'node') {
      const nodeData = params.data;

      // Dispatch selection to Redux for coordinated highlighting
      if (nodeData.id?.startsWith('loc-')) {
        const eventIdsAtLocation = networkData.nodes
          .filter((node: any) => !node.id.startsWith('loc-') && node.location === nodeData.location)
          .map((node: any) => node.id);
        dispatch(
          selectEvent({
            eventId: eventIdsAtLocation[0] || nodeData.id,
            location: nodeData.location,
          })
        );
      } else if (nodeData.location) {
        dispatch(
          selectEvent({
            eventId: nodeData.id,
            location: nodeData.location,
          })
        );
      }
    }
  };

  // Handle double-click for map navigation
  const handleNodeDblClick = (params: any) => {
    if (params.dataType === 'node') {
      const nodeData = params.data;

      // Navigate on double-click
      if (nodeData.location) {
        onNavigate(nodeData.location);
        console.log('🗺️ Double-click: Opening map for location:', nodeData.location);
      }
    }
  };

  // Update graph options based on selection state
  const neighborIds = useMemo(() => {
    if (!selection.selectedEventId) return [];
    const adjacent = new Set<string>([selection.selectedEventId]);
    for (const link of networkData.links as any[]) {
      const source = String(link.source);
      const target = String(link.target);
      if (source === selection.selectedEventId) adjacent.add(target);
      if (target === selection.selectedEventId) adjacent.add(source);
    }
    return Array.from(adjacent);
  }, [networkData.links, selection.selectedEventId]);

  useEffect(() => {
    if (!selection.selectedEventId || !chartRef.current || !selection.followSelection) return;
    const chart = chartRef.current.getEchartsInstance?.();
    if (!chart) return;
    const nodeIndex = networkData.nodes.findIndex((n: any) => n.id === selection.selectedEventId);
    if (nodeIndex < 0) return;
    chart.dispatchAction({ type: 'focusNodeAdjacency', seriesIndex: 0, dataIndex: nodeIndex });
    chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: nodeIndex });
  }, [networkData.nodes, selection.followSelection, selection.selectedEventId, selection.timestamp]);

  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(24, 24, 27, 0.98)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        textStyle: { color: '#e4e4e7', fontSize: 11 },
        padding: [8, 12],
        confine: true,
        enterable: false,
        hideDelay: 200,
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const fullTitle = params.data.fullTitle || params.data.name;
            const location = params.data.location;
            const category =
              params.data.category === 0
                ? 'CRITICAL'
                : params.data.category === 1
                ? 'HIGH'
                : params.data.category === 2
                ? 'STANDARD'
                : 'LOCATION';
            const categoryColor =
              params.data.category === 0
                ? '#ef4444'
                : params.data.category === 1
                ? '#f59e0b'
                : params.data.category === 2
                ? '#3b82f6'
                : '#10b981';

            const clickHint = location
              ? '<div style="margin-top:6px; padding-top:6px; border-top:1px solid #3f3f46; color:#60a5fa; font-size:9px;">💡 Click to select • Double-click for map</div>'
              : '';

            return `<div style="max-width:280px;">
                      <div style="font-weight:bold; font-size:12px; margin-bottom:6px; line-height:1.4; color:#fff;">
                        ${fullTitle}
                      </div>
                      <div style="display:flex; align-items:center; gap:8px; margin-top:6px; padding-top:6px; border-top:1px solid #3f3f46;">
                        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${categoryColor};"></span>
                        <span style="color:#a1a1aa; font-size:10px; font-family:monospace; font-weight:bold;">${category}</span>
                        <span style="color:#71717a; margin-left:auto;">•</span>
                        <span style="color:#60a5fa; font-family:monospace; font-size:10px;">${params.data.value} connections</span>
                      </div>
                      ${clickHint}
                    </div>`;
          }
          return `<div style="color:#a1a1aa; font-size:10px;">
                    ${params.data.source} → ${params.data.target}
                    <span style="color:#60a5fa; margin-left:8px;">strength: ${params.data.value}</span>
                  </div>`;
        },
      },
      legend: {
        data: networkData.categories.map((c: any) => c.name),
        textStyle: { color: '#71717a', fontSize: 9 },
        top: 0,
        left: 0,
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle',
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          // Apply highlighting based on selection state
          data: networkData.nodes.map((node: any) => ({
            ...node,
            itemStyle: {
              ...node.itemStyle,
              // Highlight selected node
              opacity:
                selection.selectedEventId === node.id
                  ? 1
                  : neighborIds.includes(node.id) || selection.highlightedEvents.includes(node.id)
                  ? 0.9
                  : 0.7,
              shadowBlur:
                selection.selectedEventId === node.id ? 25 : node.itemStyle.shadowBlur,
              shadowColor:
                selection.selectedEventId === node.id
                  ? 'rgba(59, 130, 246, 1)'
                  : node.itemStyle.shadowColor,
              borderWidth:
                selection.selectedEventId === node.id ? 3 : node.itemStyle.borderWidth,
            },
            label: {
              ...node.label,
              // Show label for selected node
              show: selection.selectedEventId === node.id || node.label.show,
            },
          })),
          links: networkData.links,
          categories: networkData.categories,
          roam: true,
          draggable: true,
          label: {
            position: 'right',
            formatter: '{b}',
            fontSize: 8,
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2,
            opacity: 0.15,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 3,
              opacity: 0.6,
            },
            itemStyle: {
              shadowBlur: 15,
              shadowColor: 'rgba(59, 130, 246, 0.6)',
            },
          },
          force: {
            repulsion: 180,
            gravity: 0.08,
            edgeLength: [60, 120],
            layoutAnimation: true,
            friction: 0.6,
          },
        },
      ],
    };
  }, [neighborIds, networkData, selection]); // Re-render when selection changes

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
          <Box className="w-3 h-3 text-emerald-500" />
          News Network Graph
          {selection.selectedEventId && (
            <Badge variant="outline" className="ml-2 text-[8px] bg-blue-500/10 border-blue-500/30 text-blue-400">
              <Target className="w-2 h-2 mr-1" />
              SELECTED
            </Badge>
          )}
        </CardTitle>
        <span className="text-[8px] text-zinc-500 max-w-[200px] text-right leading-tight flex items-center gap-1">
          {selection.selectedEventId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearSelection())}
              className="h-5 px-2 text-[8px] text-zinc-400 hover:text-zinc-100"
            >
              Clear Selection
            </Button>
          ) : (
            <>
              <ExternalLink className="w-2.5 h-2.5" />
              Click to select • Double-click for map
            </>
          )}
        </span>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '320px' }}
          onEvents={{
            click: handleNodeClick,
            dblclick: handleNodeDblClick,
          }}
        />
      </CardContent>
    </Card>
  );
}
