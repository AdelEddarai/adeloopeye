'use client';

import { useEffect, useMemo, useState } from 'react';
import { Command, Activity, Radio, Flame, CloudSun, GitMerge, Radar } from 'lucide-react';

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (key: string) => void;
  counts?: Record<string, number>;
};

const COMMANDS = [
  { key: 'overview', label: 'Overview Dashboard', icon: Activity, hint: 'Events, KPIs, live stream' },
  { key: 'earthquakes', label: 'Earthquakes', icon: Radio, hint: 'USGS seismic activity (M2.0+)' },
  { key: 'fires', label: 'Fires', icon: Flame, hint: 'NASA FIRMS thermal hotspots' },
  { key: 'weather', label: 'Weather & Alerts', icon: CloudSun, hint: 'City conditions + warnings' },
  { key: 'routes', label: 'Routes & Network', icon: GitMerge, hint: 'Highways, disruptions, links' },
  { key: 'map', label: 'Open 4D Map', icon: Radar, hint: 'Cesium globe with all layers' },
] as const;

export function CommandPalette({ open, onClose, onNavigate, counts }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)
    );
  }, [query]);

  if (!open) return null;

  const handleSelect = (key: string) => {
    onNavigate(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[540px] max-w-[90vw] rounded-2xl border border-cyan-400/20 bg-zinc-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Command className="w-4 h-4 text-cyan-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intelligence views... (Cmd+K to close)"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none font-mono"
          />
          <kbd className="text-[9px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="text-center text-zinc-500 text-xs py-8 font-mono">NO RESULTS FOR &quot;{query}&quot;</div>
          )}
          {results.map((cmd) => {
            const Icon = cmd.icon;
            const count = counts?.[cmd.key];
            return (
              <button
                key={cmd.key}
                onClick={() => handleSelect(cmd.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-400/10 transition-colors group text-left"
              >
                <span className="p-1.5 rounded-md bg-zinc-900 border border-white/10 text-cyan-400 group-hover:border-cyan-400/40">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-cyan-100">{cmd.label}</span>
                    {typeof count === 'number' && (
                      <span className="text-[9px] text-cyan-400 mono bg-cyan-400/10 border border-cyan-400/20 rounded px-1.5 py-px">
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{cmd.hint}</p>
                </div>
                <kbd className="text-[9px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">↵</kbd>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
