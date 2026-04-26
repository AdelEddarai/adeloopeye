'use client';

import { useState } from 'react';

import { AlertTriangle, Clock, MapPin, TrendingUp } from 'lucide-react';

import type { MapStory } from '@/types/domain';

type Props = {
  stories: MapStory[];
  activeId: string | null;
  onActivate: (story: MapStory) => void;
};

export function SimpleStoriesList({ stories, activeId, onActivate }: Props) {
  const [expanded, setExpanded] = useState(true);

  // Calculate statistics
  const stats = {
    // total: stories.length
    // @ts-ignore
    critical: stories.filter(s => s.category === 'STRIKE' || s.category === 'BREAKING').length,
    recent: stories.filter(s => {
      const hoursSince = (Date.now() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    }).length,
  };

  if (stories.length === 0) {
    return (
      <div className="bg-bg-app border border-bd rounded p-3">
        <div className="text-t4 text-xs mono">No stories available</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-app border border-bd rounded overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-bg-1 border-b border-bd cursor-pointer hover:bg-bg-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-blue font-bold text-xs mono">◈ INTELLIGENCE STORIES</span>
        </div>
        <span className="text-t4 text-sm">{expanded ? '∨' : '›'}</span>
      </div>

      {/* Statistics Bar */}
      {expanded && (
        <div className="grid grid-cols-3 gap-2 p-2 bg-bg-2 border-b border-bd">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-bg-1 rounded">
            <TrendingUp size={12} className="text-blue shrink-0" />
            <div className="flex-1 min-w-0">
              {/* @ts-ignore */}
              <div className="mono text-xs font-bold text-blue leading-none">{stats.total}</div>
              <div className="mono text-[8px] text-t4 leading-none mt-0.5">TOTAL</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-bg-1 rounded">
            <AlertTriangle size={12} className="text-danger shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="mono text-xs font-bold text-danger leading-none">{stats.critical}</div>
              <div className="mono text-[8px] text-t4 leading-none mt-0.5">CRITICAL</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-bg-1 rounded">
            <Clock size={12} className="text-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="mono text-xs font-bold text-warning leading-none">{stats.recent}</div>
              <div className="mono text-[8px] text-t4 leading-none mt-0.5">24H</div>
            </div>
          </div>
        </div>
      )}

      {/* Stories List */}
      {expanded && (
        <div className="max-h-[500px] overflow-y-auto">
          {stories.map((story) => {
            const isActive = story.id === activeId;
            const categoryColor = getCategoryColor(story.category);
            // @ts-ignore
            const isCritical = story.category === 'STRIKE' || story.category === 'BREAKING';

            return (
              <button
                key={story.id}
                onClick={() => onActivate(story)}
                className={`w-full text-left p-3 border-b border-bd-s hover:bg-bg-1 transition-colors relative ${isActive ? 'bg-bg-1 border-l-2 border-l-blue' : ''
                  }`}
              >
                {/* Critical Indicator */}
                {isCritical && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  </div>
                )}

                {/* Category Badge & Subtitle */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[9px] font-bold mono px-1.5 py-0.5 rounded"
                    style={{
                      background: `${categoryColor}20`,
                      color: categoryColor,
                    }}
                  >
                    {story.category}
                  </span>
                  {/* @ts-ignore */}
                  <span className="text-t4 text-[9px] mono truncate flex-1">{story.subtitle}</span>
                </div>

                {/* Title */}
                <div className="text-t2 text-sm font-semibold mb-1.5 line-clamp-2 leading-snug">
                  {story.title}
                </div>

                {/* Narrative */}
                <div className="text-t3 text-xs line-clamp-2 leading-relaxed mb-2">
                  {story.narrative}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 text-[9px] text-t4">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span className="mono">{formatTimestamp(story.timestamp)}</span>
                  </div>
                  {/* @ts-ignore */}
                  {story.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={10} />
                      {/* @ts-ignore */}
                      <span className="mono truncate">{story.location}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'STRIKE': '#ef4444',
    'RETALIATION': '#f97316',
    'NAVAL': '#3b82f6',
    'INTELLIGENCE': '#8b5cf6',
    'DIPLOMATIC': '#10b981',
    'CYBER': '#ec4899',
    'BREAKING': '#f59e0b',
  };
  return colors[category] || '#6b7280';
}
