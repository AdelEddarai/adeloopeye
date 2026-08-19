'use client';

import { useState, useMemo } from 'react';
import {
  Flame, ShieldAlert, AlertTriangle, Radio,
  ExternalLink, Search, RefreshCw, Crosshair,
  TrendingUp, Clock, Filter, Layers, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConflict, useConflictDays } from '@/features/dashboard/queries/conflicts';
import { useLiveNews } from '@/shared/hooks/use-live-news';
import { timeAgo } from '@/shared/lib/format';

type ConflictCategory = 'ALL' | 'KINETIC' | 'AIR' | 'MARITIME' | 'CYBER' | 'DIPLOMATIC';

export function ConflictNewsWidget() {
  const [selectedCategory, setSelectedCategory] = useState<ConflictCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  const { data: conflict, isLoading: isConflictLoading } = useConflict();
  const { data: snapshots } = useConflictDays();
  const { data: newsData, isLoading: isNewsLoading, refetch, isFetching } = useLiveNews('middle east conflict missile drone airstrike', 30);

  // Compute sorted timeline snapshots
  const days = useMemo(() => {
    return (snapshots ?? [])
      .slice()
      .sort((a, b) => (a.day < b.day ? -1 : 1))
      .slice(-14);
  }, [snapshots]);

  const latestDay = days[days.length - 1];

  // Enhanced News Items with Tactical Categorization
  const categorizedNews = useMemo(() => {
    const raw = newsData?.articles || [];
    return raw.map((art, idx) => {
      const text = `${art.title} ${art.description || ''}`.toLowerCase();
      let cat: ConflictCategory = 'KINETIC';

      if (text.includes('missile') || text.includes('air strike') || text.includes('airstrike') || text.includes('drone') || text.includes('jet') || text.includes('intercept')) {
        cat = 'AIR';
      } else if (text.includes('ship') || text.includes('tanker') || text.includes('sea') || text.includes('maritime') || text.includes('vessel') || text.includes('red sea') || text.includes('hormuz')) {
        cat = 'MARITIME';
      } else if (text.includes('cyber') || text.includes('hack') || text.includes('malware') || text.includes('c2') || text.includes('spoofing')) {
        cat = 'CYBER';
      } else if (text.includes('diplomacy') || text.includes('sanction') || text.includes('treaty') || text.includes('ceasefire') || text.includes('un ') || text.includes('talks')) {
        cat = 'DIPLOMATIC';
      }

      return {
        ...art,
        id: `news-${idx}`,
        category: cat,
      };
    });
  }, [newsData]);

  // Filtered News Items based on Category & Search
  const filteredArticles = useMemo(() => {
    return categorizedNews.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [categorizedNews, selectedCategory, searchQuery]);

  const escalationScore = conflict?.escalation ?? 84;
  const defconLevel = escalationScore >= 80 ? 'DEFCON 2' : escalationScore >= 60 ? 'DEFCON 3' : 'DEFCON 4';
  const defconColor =
    escalationScore >= 80
      ? 'text-red-400 border-red-500/40 bg-red-500/10'
      : escalationScore >= 60
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';

  return (
    <div className="h-full flex flex-col font-mono bg-zinc-950 text-zinc-300 select-none overflow-hidden">
      {/* Top Header: Escalation Telemetry */}
      <div className="px-3 py-2.5 border-b border-zinc-800/90 bg-zinc-900/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-xs font-bold tracking-wider text-zinc-100 uppercase">
              {conflict?.name || 'MIDDLE EAST THEATER · OSINT'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[8.5px] px-1.5 py-0 font-bold ${defconColor}`}>
              {defconLevel} · {conflict?.status || 'CRITICAL'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200"
              title="Refresh conflict news"
            >
              <RefreshCw size={11} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
            </Button>
          </div>
        </div>

        {/* Escalation Gauge Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8.5px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Flame size={11} className="text-red-400" />
              THEATER ESCALATION INDEX
            </span>
            <span className="text-red-400 font-bold">{escalationScore} / 100</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              style={{ width: `${escalationScore}%` }}
            />
          </div>
        </div>

        {/* 14-Day Timeline Heatmap */}
        {days.length > 0 && (
          <div className="pt-1">
            <div className="flex justify-between text-[7.5px] text-zinc-500 mb-1">
              <span>14-DAY ESCALATION TRAJECTORY</span>
              <span className="text-zinc-400 font-bold">
                {hoveredDay ? `${hoveredDay.dayLabel}: ESC ${hoveredDay.escalation}` : `${latestDay?.dayLabel || ''}`}
              </span>
            </div>
            <div className="flex gap-1 h-5 items-end bg-zinc-950/60 p-1 rounded border border-zinc-800/60">
              {days.map((d, i) => {
                const max = 100;
                const heightPct = Math.max(20, Math.round((d.escalation / max) * 100));
                const barColor =
                  d.escalation >= 75
                    ? '#ef4444'
                    : d.escalation >= 50
                    ? '#f59e0b'
                    : '#06b6d4';

                return (
                  <div
                    key={d.day || i}
                    onMouseEnter={() => setHoveredDay(d)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 rounded-xs transition-all hover:opacity-100 cursor-pointer"
                    style={{
                      height: `${heightPct}%`,
                      background: barColor,
                      opacity: hoveredDay?.day === d.day ? 1 : 0.75,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/30 space-y-1.5 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar text-[8.5px]">
          {(['ALL', 'AIR', 'MARITIME', 'KINETIC', 'CYBER', 'DIPLOMATIC'] as ConflictCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={11} className="absolute left-2 top-2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter tactical headlines (e.g. Hormuz, Drone, Strike)..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xs pl-6 pr-2 py-1 text-[9px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Articles Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
        {isNewsLoading && (
          <div className="flex items-center justify-center py-12 text-zinc-500 text-[10px]">
            <RefreshCw size={14} className="animate-spin mr-2 text-cyan-400" />
            SYNCHRONIZING TACTICAL NEWS FEEDS...
          </div>
        )}

        {!isNewsLoading && filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-1">
            <ShieldAlert size={24} className="text-zinc-700 mb-1" />
            <span className="text-[10px] font-bold">NO MATCHING CONFLICT REPORTS</span>
            <span className="text-[8.5px]">Try adjusting your search or category filter</span>
          </div>
        )}

        {filteredArticles.map(article => {
          const catBadge =
            article.category === 'AIR'
              ? 'text-purple-400 border-purple-500/40 bg-purple-500/10'
              : article.category === 'MARITIME'
              ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
              : article.category === 'CYBER'
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              : article.category === 'DIPLOMATIC'
              ? 'text-blue-400 border-blue-500/40 bg-blue-500/10'
              : 'text-red-400 border-red-500/40 bg-red-500/10';

          return (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all space-y-1.5 group no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={`text-[7.5px] px-1 py-0 font-bold ${catBadge}`}>
                    {article.category}
                  </Badge>
                  <span className="text-[8px] text-zinc-500 truncate max-w-[120px]">
                    {article.source?.name || 'VERIFIED FEED'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-zinc-500">
                  <Clock size={9} />
                  <span>{timeAgo(article.publishedAt)}</span>
                  <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity ml-0.5" />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-zinc-200 leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
                {article.title}
              </h4>

              {article.description && (
                <p className="text-[8.5px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {article.description}
                </p>
              )}
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-800/80 bg-zinc-900/40 text-[8px] text-zinc-500 flex items-center justify-between shrink-0">
        <span>ADELOOPEYE TACTICAL FEED</span>
        <span>{filteredArticles.length} REPORTS LOADED</span>
      </div>
    </div>
  );
}
