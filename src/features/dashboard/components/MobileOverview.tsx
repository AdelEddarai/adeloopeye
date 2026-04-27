'use client';

import { useMemo, useState, useEffect } from 'react';

import Link from 'next/link';

import { ArrowRight, BookOpen, TrendingUp, Users, Zap } from 'lucide-react';

import { useActors } from '@/features/actors/queries';
import { CasChip } from '@/features/dashboard/components/CasChip';
import { useBootstrap } from '@/features/dashboard/queries';
import { useConflictDays } from '@/features/dashboard/queries/conflicts';
import { useEvents } from '@/features/events/queries';
import { useXPosts } from '@/features/events/queries/x-posts';
import { useMapStories } from '@/features/map/queries';
import { widgetComponents } from '@/features/dashboard/components/widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/shared/state';
import { addWidget, removeWidget } from '@/features/dashboard/state/workspace-slice';
import { SELECTABLE_WIDGET_KEYS, WIDGET_LABELS, type WidgetKey } from '@/features/dashboard/state/presets';

import { trackNavigationClicked } from '@/shared/lib/analytics';
import { getConflictForDay, getEventsForDay } from '@/shared/lib/day-filter';
import { fmtTimeZ } from '@/shared/lib/format';
import { useAnalyticsLayoutMode } from '@/shared/hooks/use-analytics-layout-mode';

export function MobileOverview() {
  const dispatch = useAppDispatch();
  const { columns } = useAppSelector(s => s.workspace);
  const usedWidgets = columns.flatMap(c => c.widgets);
  const targetColId = columns[0]?.id || 'col-a';

  // Default mobile widgets that are always visible (not toggleable)
  const CORE_MOBILE_WIDGETS: WidgetKey[] = ['latest', 'map', 'signals'];
  // Default custom widgets for mobile (can be toggled on/off)
  const DEFAULT_MOBILE_CUSTOM_WIDGETS: WidgetKey[] = ['markets', 'morocco', 'aitech'];
  
  // Initialize default mobile widgets on first load ONLY if workspace is completely empty
  useEffect(() => {
    // Only initialize if there are NO widgets at all (first time user)
    if (usedWidgets.length === 0 && columns.length > 0) {
      console.log('[MobileOverview] First time user - initializing default mobile widgets');
      DEFAULT_MOBILE_CUSTOM_WIDGETS.forEach(widget => {
        dispatch(addWidget({ colId: targetColId, widget }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleToggleWidget = (key: WidgetKey, checked: boolean) => {
    if (checked) {
      dispatch(addWidget({ colId: targetColId, widget: key }));
    } else {
      dispatch(removeWidget({ colId: targetColId, widget: key }));
    }
  };

  const WIDGETS = useMemo(() => widgetComponents(), []);
  
  // Get custom widgets from workspace state
  const customWidgets = useMemo(() => {
    return usedWidgets.filter(k => !CORE_MOBILE_WIDGETS.includes(k));
  }, [usedWidgets, CORE_MOBILE_WIDGETS]);
  
  // State for fullscreen modal
  const [fullscreenWidget, setFullscreenWidget] = useState<{ key: WidgetKey; label: string } | null>(null);

  const { data: bootstrap } = useBootstrap();
  const { data: snapshots } = useConflictDays();
  const { data: allEvents } = useEvents();
  const { data: actors } = useActors();
  const { data: xPosts } = useXPosts();
  const { data: stories = [] } = useMapStories();

  const allDays = useMemo(() => bootstrap?.days ?? [], [bootstrap]);
  const latestDay = allDays[allDays.length - 1] ?? '';
  const snap = snapshots ? getConflictForDay(snapshots, latestDay) : null;

  const recentEvents = useMemo(() => {
    if (!allEvents) return [];
    return getEventsForDay(allEvents, allDays, latestDay)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [allEvents, allDays, latestDay]);

  const totalEvents = allEvents?.length ?? 0;
  const totalActors = actors?.length ?? 0;
  const totalStories = stories.length;
  const critCount = recentEvents.filter(e => e.severity === 'CRITICAL').length;
  const [expandedSummary, setExpandedSummary] = useState(false);
  const feedHref = (eventId?: string) => {
    const params = new URLSearchParams();
    if (latestDay) params.set('day', latestDay);
    if (eventId) params.set('event', eventId);
    const qs = params.toString();
    return qs ? `/dashboard/feed?${qs}` : '/dashboard/feed';
  };
  const mapHref = (storyId?: string) => {
    const params = new URLSearchParams();
    if (storyId) params.set('story', storyId);
    const qs = params.toString();
    return qs ? `/dashboard/map?${qs}` : '/dashboard/map';
  };
  const actorsHref = latestDay ? `/dashboard/actors?day=${latestDay}` : '/dashboard/actors';
  const briefHref = latestDay ? `/dashboard/brief?day=${latestDay}` : '/dashboard/brief';
  const layoutMode = useAnalyticsLayoutMode();

  const trackOverviewNavigation = (destinationPath: string, component: string, widgetKey?: string) => {
    trackNavigationClicked({
      component,
      destination_path: destinationPath,
      layout_mode: layoutMode,
      pathname: '/dashboard',
      surface: 'dashboard_overview',
      widget_key: widgetKey,
    });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background safe-pb p-3 space-y-4">

      {/* ── Situation summary ── */}
      {snap && (
        <Card className="bg-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="mono text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                {snap.dayLabel} — SITUATION
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            </div>
            <p
              className={`text-sm text-foreground leading-relaxed cursor-pointer ${expandedSummary ? '' : 'line-clamp-3'}`}
              onClick={() => setExpandedSummary(p => !p)}
            >
              {snap.summary}
            </p>

            {/* Escalation */}
            <div className="flex items-center gap-3 mt-4">
              <span className="mono text-[10px] font-semibold text-muted-foreground">ESCALATION</span>
              <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-destructive rounded-full" style={{ width: `${snap.escalation}%` }} />
              </div>
              <span className="mono text-xs font-bold text-destructive">{snap.escalation}</span>
            </div>

            {/* Casualty chips */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <CasChip label="US KIA" val={String(snap.casualties.us.kia)} color="var(--danger)" />
              <CasChip label="IL Civ" val={String(snap.casualties.israel.civilians)} color="var(--warning)" />
              <CasChip label="IR Killed" val={String(snap.casualties.iran.killed)} color="var(--t2)" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick stats (Fluid Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'EVENTS', val: totalEvents, icon: Zap, color: 'text-foreground' },
          { label: 'CRITICAL', val: critCount, icon: Zap, color: 'text-destructive' },
          { label: 'ACTORS', val: totalActors, icon: Users, color: 'text-blue-500' },
          { label: 'STORIES', val: totalStories, icon: BookOpen, color: 'text-emerald-500' },
        ].map(s => (
          <Card key={s.label} className="bg-card border-0 shadow-none">
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <span className={`mono text-xl font-bold ${s.color}`}>{s.val}</span>
              <span className="mono text-[10px] font-semibold text-muted-foreground tracking-widest mt-0.5">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Dynamic Custom Intelligence Feed ── */}
      {customWidgets.map(key => {
        if (!WIDGETS[key]) return null;
        return (
          <Card key={key} className="bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden h-[450px] relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-[var(--background)]/80 backdrop-blur-sm hover:bg-[var(--background)] border border-[var(--border)]"
                onClick={() => setFullscreenWidget({ key, label: WIDGET_LABELS[key] })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </Button>
            </div>
            {WIDGETS[key]()}
          </Card>
        );
      })}

      {/* ── Latest events ── */}
      <Card className="bg-card border-0 shadow-none">
        <CardHeader className="p-3 pb-2 border-b-0 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold mono text-foreground tracking-widest uppercase">Latest Events</CardTitle>
          <Link href={feedHref()} className="no-underline flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => trackOverviewNavigation(feedHref(), 'widget_link', 'latest')}>
            <span className="mono text-[10px] font-bold">SEE ALL</span>
            <ArrowRight size={10} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentEvents.map((evt, i) => {
            const isCrit = evt.severity === 'CRITICAL';
            return (
              <Link key={evt.id} href={feedHref(evt.id)} className="no-underline block">
                <div
                  className="flex gap-3 items-start p-3 hover:bg-accent/10 active:bg-accent/20 transition-colors"
                  style={{
                    borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none',
                    borderLeft: `3px solid ${isCrit ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}`
                  }}
                >
                  <div className="shrink-0 w-12 text-center">
                    <Badge variant="outline" className={`px-1 py-0 text-[9px] w-full justify-center ${isCrit ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>
                      {evt.severity.slice(0, 4)}
                    </Badge>
                    <div className="mono text-[9px] text-muted-foreground mt-1">{fmtTimeZ(evt.timestamp)}</div>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground font-medium leading-snug line-clamp-2 pr-2">{evt.title}</p>
                      <span className="mono text-[10px] text-muted-foreground mt-1 block">{evt.location}</span>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 opacity-50" />
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Active stories ── */}
      {stories.length > 0 && (
        <Card className="bg-card border-0 shadow-none">
          <CardHeader className="p-3 pb-2 border-b-0 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold mono text-foreground tracking-widest uppercase">Active Stories</CardTitle>
            <Link href={mapHref()} className="no-underline flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => trackOverviewNavigation(mapHref(), 'widget_link', 'map')}>
              <span className="mono text-[10px] font-bold">MAP</span>
              <ArrowRight size={10} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stories.slice(0, 3).map((story, i) => {
              return (
                <Link key={story.id} href={mapHref(story.id)} className="no-underline block">
                  <div
                    className="flex gap-3 items-center p-3 hover:bg-accent/10 active:bg-accent/20 transition-colors"
                    style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[9px] bg-accent/30 px-1.5 py-0">
                          {story.category}
                        </Badge>
                        <span className="mono text-[10px] text-muted-foreground">{fmtTimeZ(story.timestamp)}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug">{story.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-1">{story.tagline}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 opacity-50" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Nav links to other pages ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {[
          { href: actorsHref, label: 'ACTORS DIRECTORY', icon: Users, color: 'text-foreground' },
          { href: '/dashboard/predictions', label: 'AI PREDICTIONS', icon: TrendingUp, color: 'text-foreground' },
          { href: briefHref, label: 'DAILY BRIEF', icon: BookOpen, color: 'text-foreground' },
        ].map(nav => (
          <Link key={nav.href} href={nav.href} className="no-underline block" onClick={() => trackOverviewNavigation(nav.href, 'widget_link', nav.label.toLowerCase())}>
            <div className="flex items-center gap-3 px-4 py-4 border-0 rounded-lg bg-card hover:bg-accent/50 active:bg-accent transition-colors shadow-none">
              <nav.icon size={16} strokeWidth={2.5} className={nav.color} />
              <span className="mono text-xs font-bold text-foreground tracking-widest">{nav.label}</span>
              <ArrowRight size={14} className="text-muted-foreground ml-auto opacity-50" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Customize Feed Sheet ── */}
      <div className="flex justify-center mt-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full bg-[var(--card)] border-0 shadow-none text-[var(--muted-foreground)] font-mono text-[10px] tracking-widest font-bold h-12 rounded-lg active:scale-[0.98] transition-transform">
              <Settings2 className="w-4 h-4 mr-2" />
              CUSTOMIZE FEED
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-[var(--background)] border-t-[var(--border)] rounded-t-xl overflow-y-auto">
            <SheetHeader className="text-left pb-4 border-b border-[var(--border)] mb-4">
              <SheetTitle className="font-mono text-sm tracking-widest text-[var(--foreground)] uppercase">Customize Mobile Feed</SheetTitle>
              <p className="text-xs text-[var(--muted-foreground)]">Select intelligence widgets to pin to your mobile feed. This layout seamlessly syncs with your desktop workspace.</p>
            </SheetHeader>
            <div className="space-y-4 pb-12">
              {SELECTABLE_WIDGET_KEYS.filter(k => !CORE_MOBILE_WIDGETS.includes(k)).map(key => {
                const isChecked = usedWidgets.includes(key);
                
                return (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-0">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{WIDGET_LABELS[key]}</span>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => handleToggleWidget(key, checked)}
                      className="data-[state=checked]:bg-[var(--foreground)] data-[state=unchecked]:bg-[var(--accent)]"
                    />
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom padding */}
      <div className="h-4" />
      
      {/* ── Fullscreen Widget Modal ── */}
      {fullscreenWidget && (
        <div className="fixed inset-0 z-[9999] bg-[var(--background)] flex flex-col">
          {/* Modal Header */}
          <div className="shrink-0 flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)]">
            <h2 className="font-mono text-sm font-bold text-[var(--foreground)] tracking-widest uppercase">
              {fullscreenWidget.label}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFullscreenWidget(null)}
              className="h-8 w-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </Button>
          </div>
          
          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {WIDGETS[fullscreenWidget.key] && WIDGETS[fullscreenWidget.key]()}
          </div>
        </div>
      )}
    </div>
  );
}
