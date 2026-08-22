'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Target,
  ExternalLink,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Route,
  Zap,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
  Eye,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  selectEvent,
  selectLocation,
  flyToCoordinates,
  clearSelection,
} from '@/shared/state/event-selection-slice';
import type { RootState } from '@/shared/state';
import { useLiveDisinformation } from '@/shared/hooks/use-live-disinformation';
import {
  buildEnhancedIntelligenceGraph,
  findShortestPath,
  extractNHopNeighborhood,
  DOMAIN_CONFIG,
  type EntityDomain,
  type IntelligenceEntity,
  type IntelligenceEdge,
} from '@/features/dashboard/lib/entity-intelligence-graph';
import { EntityDossierInspector } from './EntityDossierInspector';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type NewsNetworkProps = {
  data: any;
  onNavigate: (location: string) => void;
};

export function NewsNetwork({ data, onNavigate }: NewsNetworkProps) {
  const dispatch = useDispatch();
  const selection = useSelector((state: RootState) => state.eventSelection);
  const chartRef = useRef<any>(null);

  // Live Disinformation Feed Integration
  const { data: disinfoData } = useLiveDisinformation('MA', true);

  // State
  const [selectedDomain, setSelectedDomain] = useState<EntityDomain | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInspectorEntity, setActiveInspectorEntity] = useState<IntelligenceEntity | null>(null);
  const [layoutMode, setLayoutMode] = useState<'force' | 'circular'>('force');
  const [isExpanded, setIsExpanded] = useState(false);

  // Pathfinding Mode state
  const [isPathMode, setIsPathMode] = useState(false);
  const [pathSourceId, setPathSourceId] = useState<string>('actor-tindouf-cluster');
  const [pathTargetId, setPathTargetId] = useState<string>('target-tanger-med');

  // Multi-hop expansion state
  const [focusedHopNodeId, setFocusedHopNodeId] = useState<string | null>(null);
  const [hopDistance, setHopDistance] = useState<number>(1);

  // Build Full Unified Graph
  const rawGraph = useMemo(() => {
    return buildEnhancedIntelligenceGraph(data?.events || [], disinfoData);
  }, [data?.events, disinfoData]);

  // Compute Path if in Path Mode
  const activePath = useMemo(() => {
    if (!isPathMode || !pathSourceId || !pathTargetId) return null;
    return findShortestPath(pathSourceId, pathTargetId, rawGraph.edges);
  }, [isPathMode, pathSourceId, pathTargetId, rawGraph.edges]);

  // Compute N-hop neighborhood if active
  const hopSubGraph = useMemo(() => {
    if (!focusedHopNodeId) return null;
    return extractNHopNeighborhood(focusedHopNodeId, hopDistance, rawGraph.edges);
  }, [focusedHopNodeId, hopDistance, rawGraph.edges]);

  // Filter Entities & Edges
  const filteredGraph = useMemo(() => {
    let entities = rawGraph.entities;
    let edges = rawGraph.edges;

    // 1. Path Mode Isolation
    if (activePath) {
      const pathNodesSet = new Set(activePath.pathNodeIds);
      const pathEdgesSet = new Set(activePath.pathEdgeIds);
      entities = entities.filter((e) => pathNodesSet.has(e.id));
      edges = edges.filter((e) => pathEdgesSet.has(e.id));
      return { entities, edges };
    }

    // 2. N-Hop Subgraph Isolation
    if (hopSubGraph) {
      entities = entities.filter((e) => hopSubGraph.nodeIds.has(e.id));
      edges = edges.filter((e) => hopSubGraph.edgeIds.has(e.id));
      return { entities, edges };
    }

    // 3. Domain Filter
    if (selectedDomain !== 'ALL') {
      const matchingDomainNodeIds = new Set(
        entities.filter((e) => e.domain === selectedDomain).map((e) => e.id)
      );

      // Keep matching nodes + direct neighbors for context
      const relevantNodeIds = new Set<string>(matchingDomainNodeIds);
      const relevantEdges: IntelligenceEdge[] = [];

      for (const edge of edges) {
        if (matchingDomainNodeIds.has(edge.source) || matchingDomainNodeIds.has(edge.target)) {
          relevantNodeIds.add(edge.source);
          relevantNodeIds.add(edge.target);
          relevantEdges.push(edge);
        }
      }

      entities = entities.filter((e) => relevantNodeIds.has(e.id));
      edges = relevantEdges;
    }

    // 4. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const searchMatches = new Set(
        entities
          .filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.summary.toLowerCase().includes(q) ||
              e.locationName?.toLowerCase().includes(q) ||
              e.aliases?.some((a) => a.toLowerCase().includes(q))
          )
          .map((e) => e.id)
      );

      const relevantNodeIds = new Set<string>(searchMatches);
      const relevantEdges: IntelligenceEdge[] = [];

      for (const edge of edges) {
        if (searchMatches.has(edge.source) || searchMatches.has(edge.target)) {
          relevantNodeIds.add(edge.source);
          relevantNodeIds.add(edge.target);
          relevantEdges.push(edge);
        }
      }

      entities = entities.filter((e) => relevantNodeIds.has(e.id));
      edges = relevantEdges;
    }

    return { entities, edges };
  }, [rawGraph, activePath, hopSubGraph, selectedDomain, searchQuery]);

  // Handle locating entity on Intel Map
  const handleLocateOnMap = useCallback(
    (entity: IntelligenceEntity) => {
      if (entity.coordinates) {
        // 1. Dispatch coordinate flight
        dispatch(
          flyToCoordinates({
            coordinates: [entity.coordinates[0], entity.coordinates[1]],
            zoom: entity.domain === 'GEO' ? 7 : 11,
          })
        );

        // 2. Select location if available
        if (entity.locationName) {
          dispatch(
            selectLocation({
              location: entity.locationName,
              eventIds: [entity.id],
            })
          );
        }

        // 3. Trigger map opening/navigation
        onNavigate(entity.locationName || entity.name);
      } else if (entity.locationName) {
        dispatch(
          selectLocation({
            location: entity.locationName,
            eventIds: [entity.id],
          })
        );
        onNavigate(entity.locationName);
      }
    },
    [dispatch, onNavigate]
  );

  // Handle Node Click
  const handleNodeClick = useCallback(
    (params: any) => {
      if (params.dataType === 'node') {
        const entityId = params.data.id;
        const clickedEntity = rawGraph.entities.find((e) => e.id === entityId);

        if (clickedEntity) {
          setActiveInspectorEntity(clickedEntity);

          // Dispatch selection to Redux for coordinated cross-widget highlight
          if (clickedEntity.coordinates) {
            dispatch(
              flyToCoordinates({
                coordinates: [clickedEntity.coordinates[0], clickedEntity.coordinates[1]],
                zoom: 11,
              })
            );
          }

          if (clickedEntity.locationName) {
            dispatch(
              selectLocation({
                location: clickedEntity.locationName,
                eventIds: [clickedEntity.id],
              })
            );
          } else {
            dispatch(
              selectEvent({
                eventId: clickedEntity.id,
                location: clickedEntity.locationName,
              })
            );
          }
        }
      }
    },
    [rawGraph.entities, dispatch]
  );

  // Handle Double-Click (Fast Map Navigation)
  const handleNodeDblClick = useCallback(
    (params: any) => {
      if (params.dataType === 'node') {
        const entityId = params.data.id;
        const clickedEntity = rawGraph.entities.find((e) => e.id === entityId);
        if (clickedEntity) {
          handleLocateOnMap(clickedEntity);
        }
      }
    },
    [rawGraph.entities, handleLocateOnMap]
  );

  // Format Categories for Legend
  const categories = useMemo(() => {
    return Object.entries(DOMAIN_CONFIG).map(([domainKey, cfg]) => ({
      name: cfg.label,
      itemStyle: { color: cfg.color },
    }));
  }, []);

  // Construct ECharts Options
  const option = useMemo(() => {
    const nodes = filteredGraph.entities.map((entity) => {
      const domainMeta = DOMAIN_CONFIG[entity.domain] || DOMAIN_CONFIG.ACTOR;
      const isCritical = entity.riskLevel === 'CRITICAL';
      const isHigh = entity.riskLevel === 'HIGH';
      const isSelected =
        activeInspectorEntity?.id === entity.id ||
        selection.selectedEventId === entity.id ||
        selection.highlightedEvents.includes(entity.id);

      const symbolSize = isSelected
        ? 34
        : isCritical
          ? 28
          : isHigh
            ? 22
            : entity.domain === 'GEO'
              ? 24
              : 16;

      return {
        id: entity.id,
        name: entity.name,
        domain: entity.domain,
        riskLevel: entity.riskLevel,
        value: entity.degree || 1,
        category: Object.keys(DOMAIN_CONFIG).indexOf(entity.domain),
        symbol: domainMeta.symbol,
        symbolSize: symbolSize,
        itemStyle: {
          color: domainMeta.color,
          borderColor: isSelected ? '#ffffff' : domainMeta.color,
          borderWidth: isSelected ? 3 : isCritical ? 2 : 1,
          shadowBlur: isSelected ? 25 : isCritical ? 15 : 6,
          shadowColor: isSelected ? '#38bdf8' : domainMeta.glow,
        },
        label: {
          show: isSelected || isCritical || entity.domain === 'GEO' || (entity.degree || 0) > 2,
          position: 'right',
          fontSize: 9,
          color: '#e4e4e7',
          fontFamily: 'monospace',
          fontWeight: isCritical || isSelected ? 'bold' : 'normal',
          formatter: `{b}`,
        },
      };
    });

    const links = filteredGraph.edges.map((edge) => {
      const isPathEdge = activePath?.pathEdgeIds.includes(edge.id);
      return {
        source: edge.source,
        target: edge.target,
        value: edge.weight,
        label: {
          show: isPathEdge || edge.weight >= 8,
          formatter: edge.label || edge.relation,
          fontSize: 8,
          color: isPathEdge ? '#f43f5e' : '#a1a1aa',
          fontFamily: 'monospace',
        },
        lineStyle: {
          color: isPathEdge ? '#f43f5e' : '#52525b',
          width: isPathEdge ? 3.5 : Math.max(1, edge.weight / 3),
          type: isPathEdge ? 'solid' : 'dashed',
          curveness: 0.15,
          opacity: isPathEdge ? 0.9 : 0.35,
        },
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#0284c7',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: 11 },
        padding: [8, 12],
        confine: true,
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const rawEntity = rawGraph.entities.find((e) => e.id === params.data.id);
            if (!rawEntity) return params.data.name;

            const domainMeta = DOMAIN_CONFIG[rawEntity.domain];
            const coordinatesHint = rawEntity.coordinates
              ? `<div style="color:#38bdf8; font-size:9px; margin-top:4px;">📍 [${rawEntity.coordinates[0].toFixed(2)}, ${rawEntity.coordinates[1].toFixed(2)}] · Double-click for Intel Map</div>`
              : '';

            return `
              <div style="max-width:300px; font-family:sans-serif;">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                  <span>${domainMeta?.icon || '🔹'}</span>
                  <span style="color:${domainMeta?.color || '#fff'}; font-size:10px; font-family:monospace; font-weight:bold; text-transform:uppercase;">
                    ${domainMeta?.label || rawEntity.domain}
                  </span>
                  <span style="margin-left:auto; font-size:9px; background:#27272a; padding:1px 5px; border-radius:3px; color:#a1a1aa;">
                    ${rawEntity.riskLevel}
                  </span>
                </div>
                <div style="font-weight:bold; font-size:12px; color:#fff; line-height:1.3; margin-bottom:6px;">
                  ${rawEntity.name}
                </div>
                <div style="font-size:10px; color:#cbd5e1; line-height:1.4; border-top:1px solid #334155; padding-top:6px;">
                  ${rawEntity.summary.slice(0, 140)}...
                </div>
                ${coordinatesHint}
              </div>
            `;
          }

          if (params.dataType === 'edge') {
            return `
              <div style="font-family:monospace; font-size:10px; color:#cbd5e1;">
                <span style="color:#38bdf8;">${params.data.source}</span> ➔ <span style="color:#38bdf8;">${params.data.target}</span>
                <div style="margin-top:3px; color:#f43f5e; font-weight:bold;">${params.data.label?.formatter || 'RELATION VECTOR'}</div>
              </div>
            `;
          }

          return '';
        },
      },
      series: [
        {
          type: 'graph',
          layout: layoutMode,
          circular: { rotateLabel: true },
          data: nodes,
          links: links,
          categories: categories,
          roam: true,
          draggable: true,
          force: {
            repulsion: 260,
            gravity: 0.06,
            edgeLength: [70, 160],
            friction: 0.6,
            layoutAnimation: true,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 3, opacity: 0.8 },
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(56, 189, 248, 0.8)' },
          },
        },
      ],
    };
  }, [filteredGraph, activePath, layoutMode, activeInspectorEntity, selection, rawGraph.entities, categories]);

  // Quick Metrics
  const metrics = useMemo(() => {
    const totalNodes = rawGraph.entities.length;
    const totalEdges = rawGraph.edges.length;
    const aptCount = rawGraph.entities.filter((e) => e.domain === 'ACTOR').length;
    const targetCount = rawGraph.entities.filter((e) => e.domain === 'TARGET').length;
    return { totalNodes, totalEdges, aptCount, targetCount };
  }, [rawGraph]);

  return (
    <Card className="bg-zinc-950/90 border-zinc-800 text-zinc-100 flex flex-col overflow-hidden shadow-2xl relative">
      {/* ── TOP CONTROL & WORKBENCH HEADER ── */}
      <CardHeader className="p-3 pb-2 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0 space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                  ENTITY LINK ANALYSIS // GOTHAM INTELLIGENCE GRAPH
                </CardTitle>
                <Badge variant="outline" className="text-[8px] font-mono bg-purple-950/30 border-purple-500/40 text-purple-300">
                  PALANTIR WORKBENCH
                </Badge>
                {activeInspectorEntity && (
                  <Badge variant="outline" className="text-[8px] font-mono bg-cyan-950/30 border-cyan-500/40 text-cyan-300 animate-pulse">
                    <Target className="w-2.5 h-2.5 mr-1" />
                    {activeInspectorEntity.name.slice(0, 18)}...
                  </Badge>
                )}
              </div>
              <p className="text-[9px] font-mono text-zinc-500">
                MULTI-DOMAIN LINK GRAPH · ATTRIBUTION MATRIX · MAP SYNCHRONIZED
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[9px] font-mono">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              NODES: <strong className="text-zinc-200">{metrics.totalNodes}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              EDGES: <strong className="text-purple-400">{metrics.totalEdges}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-red-400">
              APTS: <strong className="text-red-300">{metrics.aptCount}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400">
              TARGETS: <strong className="text-cyan-300">{metrics.targetCount}</strong>
            </span>

            {/* Layout Toggle */}
            <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded">
              <button
                onClick={() => setLayoutMode('force')}
                className={`px-1.5 py-0.5 text-[8px] font-mono rounded ${
                  layoutMode === 'force' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500'
                }`}
              >
                FORCE
              </button>
              <button
                onClick={() => setLayoutMode('circular')}
                className={`px-1.5 py-0.5 text-[8px] font-mono rounded ${
                  layoutMode === 'circular' ? 'bg-zinc-800 text-cyan-300' : 'text-zinc-500'
                }`}
              >
                RING
              </button>
            </div>

            {/* Fullscreen Expand */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* ── TOOLBAR: DOMAIN FILTERS & SEARCH & PATHFINDING ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
          {/* Domain Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
            <button
              onClick={() => setSelectedDomain('ALL')}
              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded transition ${
                selectedDomain === 'ALL'
                  ? 'bg-zinc-100 text-zinc-900 shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              ALL
            </button>

            {(Object.keys(DOMAIN_CONFIG) as EntityDomain[]).map((dom) => {
              const cfg = DOMAIN_CONFIG[dom];
              const isSel = selectedDomain === dom;
              return (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded flex items-center gap-1 transition whitespace-nowrap ${
                    isSel
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-600 shadow'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                  style={{ color: isSel ? cfg.color : undefined }}
                >
                  <span>{cfg.icon}</span>
                  <span>{dom}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Path Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-44">
              <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
              <Input
                placeholder="Search entity, IP, alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 pr-2 text-[10px] font-mono bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded"
              />
            </div>

            <Button
              variant={isPathMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPathMode(!isPathMode)}
              className={`h-7 px-2 text-[9px] font-mono font-bold ${
                isPathMode
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-900'
              }`}
            >
              <Route className="w-3 h-3 mr-1" />
              {isPathMode ? 'PATH ACTIVE' : 'TRACE VECTOR'}
            </Button>
          </div>
        </div>

        {/* ── CONDITIONAL PATH TRACER CONTROLS ── */}
        {isPathMode && (
          <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-rose-400" /> SOURCE (APT/ORIGIN):
              </span>
              <select
                value={pathSourceId}
                onChange={(e) => setPathSourceId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 rounded text-[9px] font-mono"
              >
                {rawGraph.entities
                  .filter((e) => e.domain === 'ACTOR' || e.domain === 'PROXY' || e.domain === 'GEO')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>

              <span className="text-cyan-400 font-bold ml-2">➔ TARGET ASSET:</span>
              <select
                value={pathTargetId}
                onChange={(e) => setPathTargetId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 rounded text-[9px] font-mono"
              >
                {rawGraph.entities
                  .filter((e) => e.domain === 'TARGET' || e.domain === 'GEO' || e.domain === 'DISINFO')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>

            {activePath ? (
              <Badge variant="outline" className="text-[8px] font-mono bg-rose-500/20 border-rose-500/40 text-rose-300">
                ATTACK VECTOR IDENTIFIED ({activePath.pathNodeIds.length} HOPS)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[8px] font-mono bg-zinc-800 text-zinc-400">
                NO DIRECT VECTOR FOUND
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* ── GRAPH CANVAS & DOSSIER PANEL LAYOUT ── */}
      <CardContent className="p-0 relative flex-1 min-h-0 overflow-hidden">
        <div
          className={`w-full flex transition-all duration-200 ${
            isExpanded ? 'h-[620px]' : 'h-[380px]'
          }`}
        >
          {/* Graph Visualization */}
          <div className="flex-1 h-full relative overflow-hidden bg-radial from-zinc-900/50 to-zinc-950">
            <ReactECharts
              // @ts-ignore
              ref={chartRef}
              option={option}
              style={{ width: '100%', height: '100%' }}
              onEvents={{
                click: handleNodeClick,
                dblclick: handleNodeDblClick,
              }}
            />

            {/* Bottom Status Tip */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 pointer-events-none">
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/80 flex items-center gap-1.5 backdrop-blur-sm">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                Click node for Classified Dossier · Double-click to Fly Intel Map
              </span>
            </div>
          </div>

          {/* Dossier Flyout Panel */}
          {activeInspectorEntity && (
            <div className="w-80 h-full shrink-0 border-l border-zinc-800 bg-zinc-950/95 z-20">
              <EntityDossierInspector
                entity={activeInspectorEntity}
                edges={rawGraph.edges}
                allEntities={rawGraph.entities}
                onClose={() => setActiveInspectorEntity(null)}
                onSelectEntity={(id) => {
                  const target = rawGraph.entities.find((e) => e.id === id);
                  if (target) setActiveInspectorEntity(target);
                }}
                onLocateOnMap={handleLocateOnMap}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
