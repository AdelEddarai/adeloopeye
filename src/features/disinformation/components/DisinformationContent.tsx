'use client';

import { useMemo, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DisinformationFeed } from '@/features/disinformation/components/DisinformationFeed';
import { DisinformationMap } from '@/features/disinformation/components/DisinformationMap';
import { DisinformationStats } from '@/features/disinformation/components/DisinformationStats';
import { useLiveDisinformation } from '@/shared/hooks/use-live-disinformation';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { usePanelLayout } from '@/shared/hooks/use-panel-layout';

const FOCUS_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'WLD', name: 'World' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'LY', name: 'Libya' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'IR', name: 'Iran' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IL', name: 'Israel' },
  { code: 'PS', name: 'Palestine' },
  { code: 'DE', name: 'Germany' },
];

export function DisinformationContent() {
  const isMobile = useIsMobile(1024);
  const [focus, setFocus] = useState('WLD');
  const { data, isLoading, isError, error, refetch, lastUpdate } = useLiveDisinformation(focus);
  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'disinfo' });

  const focusMeta = useMemo(
    () => FOCUS_OPTIONS.find(o => o.code === focus) ?? FOCUS_OPTIONS[0],
    [focus]
  );

  const attributedEdges = useMemo(
    () => (data?.edges ?? []).filter(e => e.subKind === 'ATTRIBUTED_ATTACK'),
    [data]
  );

  const topAttack = useMemo(() => {
    const sorted = [...attributedEdges].sort((a, b) => b.weight - a.weight);
    if (sorted.length === 0) return null;
    const name = (code: string) =>
      (data?.nodes ?? []).find(n => n.code === code)?.name ?? code;
    const t = sorted[0];
    return { source: name(t.source), target: name(t.target), weight: t.weight };
  }, [attributedEdges, data]);

  const handleFocusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFocus(e.target.value);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="panel-header shrink-0">
        <span className="section-title">Cyber &amp; Disinformation Intel</span>
        <span className="label ml-auto text-[var(--t4)]">FREE OSINT · GDELT + BOT FEEDS</span>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <label className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
          RADAR FOCUS
        </label>
        <select
          value={focus}
          onChange={handleFocusChange}
          className="mono h-8 px-2 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm text-[length:var(--text-label)] text-[var(--t1)] focus:outline-none focus:border-[var(--blue)]"
        >
          {FOCUS_OPTIONS.map(o => (
            <option key={o.code} value={o.code}>
              {o.name} ({o.code})
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          className="h-8 gap-1.5 text-[length:var(--text-label)]"
        >
          <RefreshCw size={12} />
          REFRESH
        </Button>
        <div className="mono text-[length:var(--text-caption)] text-[var(--t4)] ml-auto flex items-center gap-3">
          {topAttack && (
            <span className="flex items-center gap-1 text-[var(--warning)]">
              <span className="text-[var(--t4)]">TOP ATTACK:</span>
              {topAttack.source} → {topAttack.target}
              <span className="text-[var(--t4)]">x{topAttack.weight}</span>
            </span>
          )}
          <span>
            FOCUS: {focusMeta.name}
            {lastUpdate && (
              <>
                <span className="mx-1">·</span>UPDATED {new Date(lastUpdate).toLocaleTimeString()} UTC
              </>
            )}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="mono text-[length:var(--text-label)] text-[var(--danger)]">
            DISINFO FEED UNAVAILABLE
          </span>
          <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1">
            {error instanceof Error ? error.message : 'Failed to load'}
          </span>
        </div>
      ) : (
        <>
          <DisinformationStats stats={data?.stats ?? { campaigns: 0, botSources: 0, botCountries: 0, articleCount: 0 }} />

          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            {isMobile ? (
              <>
                <div className="relative h-[42vh] shrink-0 border-b border-[var(--bd)]">
                  {data && (
                    <DisinformationMap
                      edges={data.edges ?? []}
                      nodes={data.nodes ?? []}
                      focus={data.focus ?? focusMeta}
                    />
                  )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="panel-header shrink-0">
                    <span className="section-title">Intel Articles</span>
                    <span className="label ml-auto text-[var(--t4)]">GDELT</span>
                  </div>
                  <DisinformationFeed articles={data?.articles ?? []} />
                </div>
              </>
            ) : (
              <ResizablePanelGroup
                orientation="horizontal"
                defaultLayout={defaultLayout}
                onLayoutChanged={onLayoutChanged}
                className="flex-1 min-h-0 min-w-0 w-full"
              >
                <ResizablePanel
                  id="map"
                  defaultSize="62%"
                  minSize="35%"
                  className="relative flex flex-col overflow-hidden min-w-0"
                >
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="mono text-[length:var(--text-label)] text-[var(--t4)] animate-pulse">
                        FETCHING INTELLIGENCE...
                      </span>
                    </div>
                  ) : (
                    data && (
                      <DisinformationMap
                        edges={data.edges ?? []}
                        nodes={data.nodes ?? []}
                        focus={data.focus ?? focusMeta}
                      />
                    )
                  )}
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel
                  id="feed"
                  defaultSize="38%"
                  minSize="25%"
                  className="flex flex-col overflow-hidden min-w-0"
                >
                  <div className="panel-header shrink-0">
                    <span className="section-title">Intel Articles</span>
                    <span className="label ml-auto text-[var(--t4)]">GDELT</span>
                  </div>
                  <ScrollArea className="flex-1 min-h-0 min-w-0">
                    <DisinformationFeed articles={data?.articles ?? []} />
                  </ScrollArea>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>

          {/* Sources + disclaimer */}
          <div className="shrink-0 px-4 py-2 border-t border-[var(--bd)] bg-[var(--bg-2)]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono text-[length:var(--text-micro)] text-[var(--t4)]">SOURCES:</span>
              {(data?.sources ?? []).map(s => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-[length:var(--text-micro)] px-1.5 py-0.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm text-[var(--info)] hover:border-[var(--bd-hover)] no-underline"
                >
                  {s.name}
                </a>
              ))}
            </div>
            <p className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1.5 leading-snug">
              ATTRIBUTION LIMIT: solid orange arcs = reported attack direction from open-source
              journalism (GDELT) — "X accused of hacking Y". dashed orange arcs = countries merely
              co-mentioned in reporting. blue arcs = botnet/C2/scan IPs observed in a source country,
              mapped to the radar focus. No free feed authoritatively attributes a government to a bot
              network — treat attack arcs as reported, not proven.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
