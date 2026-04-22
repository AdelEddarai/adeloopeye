'use client';

import { Maximize2, Minimize2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { CitySearchPanel } from '@/features/map/components/CitySearchPanel';
import { LiveIntelFeed } from '@/features/map/components/LiveIntelFeed';

import type { MapStory } from '@/types/domain';

// Types

type Props = {
  isOpen:          boolean;
  stories:         MapStory[];
  activeStory:     MapStory | null;
  onToggle:        () => void;
  onActivateStory: (story: MapStory) => void;
  onClearStory:    () => void;
  expanded?:       boolean;
  onToggleExpand?: () => void;
  onCitySelect?:   (city: { name: string; lat: number; lon: number }) => void;
  onNewsClick?:    (news: any) => void;
  onIntelItemClick?: (item: any) => void;
  selectedCountry?: { name: string; code: string } | null;
};

// Component

export function MapSidebar({ 
  isOpen, 
  stories, 
  activeStory, 
  onToggle, 
  onActivateStory, 
  onClearStory, 
  expanded, 
  onToggleExpand, 
  onCitySelect,
  onNewsClick,
  onIntelItemClick,
  selectedCountry,
}: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      background:    'var(--bg-app)',
      overflow:      'hidden',
      height:        '100%',
    }}>
      {/* Header */}
      <div className="panel-header">
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 'var(--text-body)' }}>
          ◈ INTEL PANEL
        </span>
        {onToggleExpand && (
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={onToggleExpand}
            className="ml-auto h-5 w-5 p-0 text-[var(--t4)] hover:text-[var(--t1)] leading-none"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 size={12} strokeWidth={2} /> : <Maximize2 size={12} strokeWidth={2} />}
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="xs" 
          onClick={onToggle}
          className={`${onToggleExpand ? '' : 'ml-auto '}h-5 w-5 p-0 text-[var(--t4)] hover:text-[var(--t1)] text-base leading-none`}
        >
          ✕
        </Button>
      </div>

      {/* Body - Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* City Search */}
        <CitySearchPanel 
          onCitySelect={onCitySelect}
          onNewsClick={onNewsClick}
          selectedCountry={selectedCountry}
        />

        {/* Live Intelligence Feed */}
        <LiveIntelFeed
          onItemClick={onIntelItemClick}
        />
      </div>
    </div>
  );
}
