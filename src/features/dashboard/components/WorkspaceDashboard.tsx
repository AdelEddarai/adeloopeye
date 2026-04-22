'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { ArrowLeft, ArrowRight, Plus, X as XIcon, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { useActors } from '@/features/actors/queries';
import { useBootstrap } from '@/features/dashboard/queries';
import { useConflict, useConflictDays } from '@/features/dashboard/queries/conflicts';
import { PRESETS, SELECTABLE_WIDGET_KEYS, WIDGET_LABELS, type WidgetKey } from '@/features/dashboard/state/presets';
import {
  addColumn as addColumnAction,
  addWidget as addWidgetAction,
  applyPreset,
  moveWidget as moveWidgetAction,
  removeWidget as removeWidgetAction,
  resetToPreset,
  setColumnSizes,
  setRowSizes,
  toggleEditing,
} from '@/features/dashboard/state/workspace-slice';
import { useEvents } from '@/features/events/queries';
import { useXPosts } from '@/features/events/queries/x-posts';
import { MobileOverviewSkeleton, OverviewScreenSkeleton } from '@/shared/components/loading/screen-skeletons';
import { DaySelector } from '@/shared/components/shared/DaySelector';

import { getAnalyticsLayoutMode, trackDashboardViewChanged, trackNavigationClicked } from '@/shared/lib/analytics';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

import type { DashData } from './DashCtx';
import { DashCtx } from './DashCtx';
import { MobileOverview } from './MobileOverview';
import { widgetComponents } from './widgets';

import { useAppDispatch, useAppSelector } from '@/shared/state';
import { toast } from 'sonner';

const WIDGET_LINKS: Partial<Record<WidgetKey, { href: string; label: string; preserveDay?: boolean }>> = {
  latest: { href: '/dashboard/feed', label: 'View All', preserveDay: true },
  actors: { href: '/dashboard/actors', label: 'Dossiers', preserveDay: true },
  signals: { href: '/dashboard/signals', label: 'All Signals' },
  map: { href: '/dashboard/map', label: 'Full Map' },
  predictions: { href: '/dashboard/predictions', label: 'All Markets' },
  markets: { href: '/dashboard/markets', label: 'Markets Desk' },
  brief: { href: '/dashboard/brief', label: 'Full Brief', preserveDay: true },
};

export function WorkspaceDashboard() {
  const dispatch = useAppDispatch();
  const { columns, activePreset, editing, columnSizes, rowSizes } = useAppSelector(s => s.workspace);
  const isMobile = useIsMobile(1024);
  const isLandscapePhone = useIsLandscapePhone();
  const [selectedWidget, setSelectedWidget] = useState<WidgetKey | ''>('');

  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap();
  const allDays = bootstrap?.days ?? [];
  const [dashDay, setDashDay] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const effectiveDashDay = dashDay || allDays[allDays.length - 1] || '';
  const widgetLinks = Object.fromEntries(
    Object.entries(WIDGET_LINKS).map(([key, value]) => {
      const href = effectiveDashDay && value!.preserveDay
        ? `${value!.href}?day=${effectiveDashDay}`
        : value!.href;
      return [key, { ...value!, href }];
    }),
  ) as typeof WIDGET_LINKS;

  const { data: conflict, isLoading: conflictLoading } = useConflict();
  const { data: snapshots, isLoading: snapshotsLoading } = useConflictDays();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: actors, isLoading: actorsLoading } = useActors(undefined, effectiveDashDay || undefined);
  const { data: xPosts, isLoading: postsLoading } = useXPosts();
  const isDashboardLoading = bootstrapLoading || conflictLoading || snapshotsLoading || eventsLoading || actorsLoading || postsLoading;

  const usedWidgets = columns.flatMap(c => c.widgets);
  const availableWidgets = SELECTABLE_WIDGET_KEYS.filter(k => !usedWidgets.includes(k));
  const colSize = `${(100 / columns.length).toFixed(1)}%`;
  const layoutMode = getAnalyticsLayoutMode({ isLandscapePhone, isMobile });

  // Calculate dynamic minimum height to ensure widgets don't get squished and scrolling works
  const maxWidgetsInColumn = Math.max(...columns.map(c => c.widgets.length), 1);
  const minGridHeight = Math.max(100, maxWidgetsInColumn * 450); // Minimum 450px height per widget

  const dashData: DashData = {
    day: effectiveDashDay,
    conflict: conflict ?? null,
    snapshots: snapshots ?? [],
    events: events ?? [],
    actors: actors ?? [],
    xPosts: xPosts ?? [],
    allDays,
  };

  if (isMobile || isLandscapePhone) {
    if (isDashboardLoading) return <MobileOverviewSkeleton />;
    return <MobileOverview />;
  }

  if (isDashboardLoading) return <OverviewScreenSkeleton />;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--bg-1)] overflow-hidden">
      {/* ── toolbar ── */}
      <div className="shrink-0 flex items-center gap-2 py-1 px-3 border-b border-[var(--bd)] bg-[var(--bg-2)]/95 backdrop-blur-sm overflow-x-auto touch-scroll hide-scrollbar">
        <span className="mono text-[length:var(--text-caption)] text-[var(--t4)] border border-[var(--bd)] bg-[var(--bg-3)] px-1.5 py-0.5">
          OSINT GRID
        </span>
        <Button
          variant={editing ? 'outline' : 'ghost'}
          size="xs"
          onClick={() => dispatch(toggleEditing())}
          className={`text-[length:var(--text-label)] font-semibold tracking-wide mono ${editing
              ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
              : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t3)]'
            }`}
        >
          {editing ? '✦ EDITING' : 'EDIT LAYOUT'}
        </Button>

        {/* preset selector */}
        <div className="flex items-center gap-0.5 ml-2">
          {(['analyst', 'commander', 'executive', 'live'] as const).map(id => (
            <Button
              key={id}
              variant={activePreset === id ? 'outline' : 'ghost'}
              size="xs"
              onClick={() => {
                if (activePreset === id) return;

                dispatch(applyPreset(id));
                trackDashboardViewChanged({
                  control: 'preset',
                  day: effectiveDashDay,
                  layout_mode: layoutMode,
                  pathname: '/dashboard',
                  surface: 'dashboard_overview',
                  value: id,
                });
              }}
              className={`text-[length:var(--text-label)] font-semibold tracking-wide mono ${activePreset === id
                  ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]'
                  : 'border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)] hover:text-[var(--t2)]'
                }`}
            >
              {PRESETS[id].label}
            </Button>
          ))}
          {activePreset === 'custom' && (
            <span className="text-[length:var(--text-caption)] text-[var(--t4)] ml-1 mono">CUSTOM</span>
          )}
        </div>

        <div className="ml-1">
          <DaySelector
            currentDay={effectiveDashDay}
            onDayChange={day => {
              if (day === effectiveDashDay) return;

              setDashDay(day);
              trackDashboardViewChanged({
                control: 'day',
                day,
                layout_mode: layoutMode,
                pathname: '/dashboard',
                surface: 'dashboard_overview',
                value: day,
              });
            }}
          />
        </div>

        {editing && (
          <>
            {availableWidgets.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  id="add-widget-select"
                  className="text-[length:var(--text-label)] px-2 py-1 border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                  value={selectedWidget}
                  onChange={(e) => setSelectedWidget(e.target.value as WidgetKey | '')}
                >
                  <option value="" disabled>Select widget...</option>
                  {availableWidgets.map(k => (
                    <option key={k} value={k}>{WIDGET_LABELS[k]}</option>
                  ))}
                </select>
                <span className="text-[length:var(--text-caption)] text-[var(--t4)]">→ col:</span>
                {columns.map((col, ci) => (
                  <Button
                    key={col.id}
                    variant="ghost"
                    size="xs"
                    className="text-[length:var(--text-label)] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                    onClick={() => {
                      if (!selectedWidget || !availableWidgets.includes(selectedWidget)) {
                        toast.error('Please select a widget first');
                        return;
                      }
                      dispatch(addWidgetAction({ colId: col.id, widget: selectedWidget }));
                      setSelectedWidget(''); // Reset after adding
                    }}
                  >
                    {ci + 1}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-[length:var(--text-label)] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t2)]"
                  onClick={() => {
                    const sel = document.getElementById('add-widget-select') as HTMLSelectElement;
                    const val = sel.value as WidgetKey;
                    if (!val || !availableWidgets.includes(val)) return;
                    dispatch(addColumnAction(val));
                    sel.value = '';
                  }}
                >
                  <Plus size={9} strokeWidth={2.5} />
                  col
                </Button>
              </div>
            )}
            
            {/* ZOOM CONTROLS */}
            <div className="flex items-center gap-1 ml-auto mr-2 bg-white/5 rounded px-1 border border-white/10">
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setZoomLevel(z => Math.max(50, z - 10))}>
                <ZoomOut size={12} />
              </Button>
              <span className="text-[10px] mono text-muted-foreground w-8 text-center">{zoomLevel}%</span>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setZoomLevel(z => Math.min(150, z + 10))}>
                <ZoomIn size={12} />
              </Button>
            </div>

            <span className="text-[length:var(--text-caption)] text-[var(--t4)] mono ml-2">drag splitters to resize</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => dispatch(resetToPreset())}
              className="ml-auto text-[length:var(--text-label)] border border-[var(--bd)] bg-[var(--bg-3)] text-[var(--t4)]"
            >
              Reset
            </Button>
          </>
        )}
      </div>

      {/* ── RESIZABLE HYBRID LAYOUT ── */}
      <DashCtx.Provider value={dashData}>
        <div className="flex-1 overflow-y-auto bg-background p-2 md:p-4 custom-scrollbar">
          <div style={{ zoom: `${zoomLevel}%`, minHeight: `${minGridHeight}px`, height: '100%' }}>
            <ResizablePanelGroup
              orientation="horizontal"
              id="workspace-cols"
              className="flex-1 rounded-md overflow-hidden bg-background shadow-none"
              onLayoutChanged={(layout) => { dispatch(setColumnSizes(layout)); }}
            >
            {columns.map((col, ci) => (
              <React.Fragment key={col.id}>
                {ci > 0 && <ResizableHandle className="w-[4px] bg-transparent transition-colors hover:bg-foreground/10" />}
                <ResizablePanel
                  id={col.id}
                  defaultSize={columnSizes[col.id] != null ? `${columnSizes[col.id]}%` : colSize}
                  minSize="10%"
                  className="flex flex-col min-h-0 min-w-0 overflow-hidden"
                >
                  <ResizablePanelGroup
                    orientation="vertical"
                    id={`rows-${col.id}`}
                    className="flex-1 min-h-0"
                    onLayoutChanged={(layout) => { dispatch(setRowSizes({ colId: col.id, layout })); }}
                  >
                    {col.widgets.map((widget, wi) => (
                      <React.Fragment key={`${col.id}-${widget}`}>
                        {wi > 0 && <ResizableHandle className="h-[4px] bg-transparent transition-colors hover:bg-foreground/10" />}
                        <ResizablePanel
                          id={`${col.id}-${widget}`}
                          defaultSize={rowSizes[col.id]?.[`${col.id}-${widget}`] != null ? `${rowSizes[col.id][`${col.id}-${widget}`]}%` : `${(100 / col.widgets.length).toFixed(1)}%`}
                          minSize="15%"
                          className="flex flex-col min-h-0 overflow-hidden bg-card text-card-foreground group hover:bg-accent/5 transition-colors duration-200"
                        >
                          <div className="flex flex-col h-full min-h-0 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-card shrink-0">
                              <span className="font-semibold text-xs tracking-wider text-muted-foreground uppercase group-hover:text-foreground transition-colors">
                                {WIDGET_LABELS[widget]}
                              </span>

                              {editing && (
                                <div className="ml-auto flex items-center gap-1 opacity-100">
                                  {ci > 0 && (
                                    <Button variant="ghost" size="icon-sm" title="Move left" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                                      onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'left' }))}
                                    >
                                      <ArrowLeft size={10} strokeWidth={2} />
                                    </Button>
                                  )}
                                  {ci < columns.length - 1 && (
                                    <Button variant="ghost" size="icon-sm" title="Move right" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                                      onClick={() => dispatch(moveWidgetAction({ colId: col.id, widget, direction: 'right' }))}
                                    >
                                      <ArrowRight size={10} strokeWidth={2} />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon-sm" title="Remove widget" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 ml-1"
                                    onClick={() => dispatch(removeWidgetAction({ colId: col.id, widget }))}
                                  >
                                    <XIcon size={10} strokeWidth={2} />
                                  </Button>
                                </div>
                              )}

                              {!editing && widgetLinks[widget] && (
                                <Link
                                  href={widgetLinks[widget]!.href}
                                  className="no-underline ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => trackNavigationClicked({
                                    component: 'widget_link',
                                    destination_path: widgetLinks[widget]!.href,
                                    layout_mode: layoutMode,
                                    pathname: '/dashboard',
                                    surface: 'dashboard_overview',
                                    widget_key: widget,
                                  })}
                                >
                                  <span className="text-[10px] text-foreground font-semibold uppercase tracking-wider">OPEN</span>
                                  <ArrowRight size={10} strokeWidth={2} className="text-foreground" />
                                </Link>
                              )}
                            </div>

                            <div className="flex-1 min-h-0 overflow-hidden relative">
                              {widgetComponents()[widget]()}
                            </div>
                          </div>
                        </ResizablePanel>
                      </React.Fragment>
                    ))}
                  </ResizablePanelGroup>
                </ResizablePanel>
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
          </div>
        </div>
      </DashCtx.Provider>
    </div>
  );
}
