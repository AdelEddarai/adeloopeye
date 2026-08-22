'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layers, Newspaper, Search, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

type SheetState = 'collapsed' | 'peek' | 'expanded';

type TabKey = 'layers' | 'intel' | 'search';

type Props = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
  sheetState: SheetState;
  onSheetStateChange: (state: SheetState) => void;
  intelCount?: number;
};

export function MobileBottomSheet({
  activeTab,
  onTabChange,
  children,
  sheetState,
  onSheetStateChange,
  intelCount = 0,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const startState = useRef<SheetState>(sheetState);

  // Height configurations
  const getHeight = () => {
    switch (sheetState) {
      case 'collapsed':
        return '54px';
      case 'peek':
        return '48vh';
      case 'expanded':
        return '84vh';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    startState.current = sheetState;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    dragStartY.current = null;

    // Significant swipe gesture
    if (Math.abs(deltaY) > 40) {
      if (deltaY < 0) {
        // Swiped UP
        if (startState.current === 'collapsed') onSheetStateChange('peek');
        else if (startState.current === 'peek') onSheetStateChange('expanded');
      } else {
        // Swiped DOWN
        if (startState.current === 'expanded') onSheetStateChange('peek');
        else if (startState.current === 'peek') onSheetStateChange('collapsed');
      }
    }
  };

  const handleTabClick = (tab: TabKey) => {
    onTabChange(tab);
    if (sheetState === 'collapsed') {
      onSheetStateChange('peek');
    }
  };

  return (
    <div
      ref={sheetRef}
      style={{
        height: getHeight(),
        transition: 'height 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col bg-zinc-950/95 border-t border-zinc-800 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden font-mono"
    >
      {/* ── Drag & Pull Handle Header ── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (sheetState === 'collapsed') onSheetStateChange('peek');
          else if (sheetState === 'peek') onSheetStateChange('expanded');
          else onSheetStateChange('collapsed');
        }}
        className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none shrink-0"
      >
        <div className="w-10 h-1 rounded-full bg-zinc-700 hover:bg-cyan-400 transition-colors" />
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="grid grid-cols-3 gap-1 px-2 pb-2 border-b border-zinc-900 bg-zinc-950/80 shrink-0">
        <button
          onClick={() => handleTabClick('layers')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm text-[10.5px] font-bold tracking-wide transition-all ${
            activeTab === 'layers' && sheetState !== 'collapsed'
              ? 'bg-zinc-900 border border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <Layers size={12} className={activeTab === 'layers' ? 'text-cyan-400' : 'text-zinc-500'} />
          <span>LAYERS</span>
        </button>

        <button
          onClick={() => handleTabClick('intel')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm text-[10.5px] font-bold tracking-wide transition-all ${
            activeTab === 'intel' && sheetState !== 'collapsed'
              ? 'bg-zinc-900 border border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <Newspaper size={12} className={activeTab === 'intel' ? 'text-cyan-400' : 'text-zinc-500'} />
          <span>LIVE INTEL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => handleTabClick('search')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm text-[10.5px] font-bold tracking-wide transition-all ${
            activeTab === 'search' && sheetState !== 'collapsed'
              ? 'bg-zinc-900 border border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <Search size={12} className={activeTab === 'search' ? 'text-cyan-400' : 'text-zinc-500'} />
          <span>SEARCH</span>
        </button>
      </div>

      {/* ── Scrollable Tab Content ── */}
      {sheetState !== 'collapsed' && (
        <div className="flex-1 overflow-y-auto px-3 pt-3 hide-scrollbar overscroll-contain">
          {children}
        </div>
      )}
    </div>
  );
}
