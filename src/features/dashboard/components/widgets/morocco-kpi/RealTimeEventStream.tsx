'use client';

import { useState, useMemo } from 'react';
import { Terminal, Search, Filter, MapPin, Copy, Check, ShieldAlert, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type RealTimeEventStreamProps = {
  data: any[];
  onNavigateLocation?: (location: string) => void;
};

export function RealTimeEventStream({ data, onNavigateLocation }: RealTimeEventStreamProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'STANDARD'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return data.filter((event) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.type || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        filterSeverity === 'ALL' ||
        (filterSeverity === 'CRITICAL' && event.severity === 'CRITICAL') ||
        (filterSeverity === 'HIGH' && event.severity === 'HIGH') ||
        (filterSeverity === 'STANDARD' && event.severity !== 'CRITICAL' && event.severity !== 'HIGH');

      return matchesSearch && matchesSeverity;
    });
  }, [data, searchQuery, filterSeverity]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden shadow-lg flex flex-col h-full">
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      {/* Terminal Header */}
      <CardHeader className="p-3 pb-2 border-b border-zinc-900 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-widest">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Live SIGINT & OSINT Event Terminal
            <Badge variant="outline" className="ml-1 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping" />
              LIVE FEED
            </Badge>
          </CardTitle>
          <span className="text-[8px] font-mono text-zinc-500">
            {filteredEvents.length} / {data.length} EVENTS
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, location, actor..."
              className="h-6 pl-7 text-[9px] font-mono bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-sm"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(['ALL', 'CRITICAL', 'HIGH', 'STANDARD'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase rounded-sm border transition-all ${
                  filterSeverity === sev
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow'
                    : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* Terminal Stream List */}
      <CardContent className="p-2 pt-1.5 flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center text-[10px] font-mono text-zinc-600">
              No matching intelligence events found.
            </div>
          ) : (
            filteredEvents.map((event, idx) => {
              const isCrit = event.severity === 'CRITICAL';
              const isHigh = event.severity === 'HIGH';
              const severityColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8';

              return (
                <div
                  key={event.id || idx}
                  className="flex items-start gap-2 p-2 rounded bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all group"
                >
                  <div
                    className="w-1 h-8 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: severityColor, boxShadow: `0 0 6px ${severityColor}80` }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Badge
                          variant="outline"
                          className="text-[8px] font-mono font-bold px-1 py-0 shrink-0"
                          style={{
                            backgroundColor: `${severityColor}15`,
                            borderColor: `${severityColor}40`,
                            color: severityColor,
                          }}
                        >
                          {event.severity}
                        </Badge>
                        <span className="text-[8px] font-mono text-zinc-500 shrink-0">
                          {event.timeAgo}
                        </span>
                        {event.location && (
                          <span className="text-[9px] font-mono text-cyan-400 font-semibold truncate flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(event.id || String(idx), `${event.title} - ${event.location || ''}`)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                          title="Copy Intel snippet"
                        >
                          {copiedId === (event.id || String(idx)) ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>

                        {onNavigateLocation && event.location && (
                          <button
                            onClick={() => onNavigateLocation(event.location)}
                            className="p-1 rounded text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800"
                            title="Fly to location on Map"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] font-mono text-zinc-200 leading-snug line-clamp-2 group-hover:text-zinc-100">
                      {event.title}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800/80">
                        TYPE: {(event.type || 'GENERAL').replace(/_/g, ' ')}
                      </span>
                      {event.category && (
                        <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800/80">
                          CAT: {event.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
