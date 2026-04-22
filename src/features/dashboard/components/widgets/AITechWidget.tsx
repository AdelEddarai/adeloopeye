'use client';

import { Cpu, Sparkles, Zap, ExternalLink, Clock, Activity, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type AITechNews = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: 'LLM' | 'AI_AGENT' | 'AI_MODEL' | 'BENCHMARK' | 'FRAMEWORK' | 'RESEARCH' | 'COMPANY';
  tags: string[];
};

export function AITechWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-tech-news'],
    queryFn: async (): Promise<{ articles: AITechNews[] }> => {
      const response = await fetch('/api/v1/live/ai-tech', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch AI tech news');
      const json = await response.json();
      const data = json.ok ? json.data : json;
      return data;
    },
    staleTime: 300000,
    refetchInterval: 300000,
  });

  if (isLoading) {
    return (
      <Card className="h-full border-0 bg-transparent flex flex-col overflow-hidden items-center justify-center relative">
        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.05),transparent_50%)]" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Cpu className="w-6 h-6 text-blue-400 animate-pulse relative z-10" />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">Connecting to AI Intel...</span>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full border-0 bg-zinc-950/40 flex items-center justify-center">
        <span className="text-[10px] font-mono text-rose-500/80 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20">Feed Offline</span>
      </Card>
    );
  }

  const news = data.articles || [];

  const getCategoryStyles = (category: AITechNews['category']): string => {
    switch (category) {
      case 'LLM': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
      case 'AI_AGENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case 'AI_MODEL': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]';
      case 'BENCHMARK': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      case 'FRAMEWORK': return 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]';
    }
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  };

  const getCategoryIcon = (category: AITechNews['category']) => {
    switch (category) {
      case 'LLM':
      case 'AI_MODEL': return <Sparkles className="w-2.5 h-2.5" />;
      case 'AI_AGENT': return <Cpu className="w-2.5 h-2.5" />;
      case 'BENCHMARK': return <Activity className="w-2.5 h-2.5" />;
      case 'FRAMEWORK': return <Zap className="w-2.5 h-2.5" />;
    }
    return <Globe className="w-2.5 h-2.5" />;
  };

  return (
    <Card className="h-full border-0 bg-transparent flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xl" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      
      <CardHeader className="px-4 py-3 shrink-0 border-b border-white/5 bg-black/20 flex flex-row items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1 min-w-[24px] min-h-[24px] rounded-md bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest drop-shadow-md">AI Tech Intel</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 px-2 flex items-center text-[9px] font-mono border-white/10 bg-black/40 text-zinc-400">
            {news.length} NODES
          </Badge>
          <div className="flex items-center gap-1.5 px-2 shadow-[0_0_10px_rgba(16,185,129,0.1)] h-5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none mt-[1px]">LIVE</span>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 relative z-10 w-full custom-scrollbar">
        <div className="flex flex-col divide-y divide-white/5">
          {news.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <Activity className="w-8 h-8 text-zinc-600 mb-3" />
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">No Intel Found</span>
            </div>
          ) : (
            news.map((item, i) => {
              const categoryStyles = getCategoryStyles(item.category);
              const Icon = getCategoryIcon(item.category);
              const timeAgo = getTimeAgo(item.publishedAt);

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block p-4 hover:bg-white/[0.02] transition-colors duration-300"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500/0 group-hover:bg-blue-500 transition-colors duration-300" />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`h-5 flex items-center gap-1.5 px-1.5 text-[8px] uppercase tracking-wider ${categoryStyles}`}>
                          {Icon}
                          {item.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-zinc-500 font-mono text-[9px] uppercase group-hover:text-zinc-400 transition-colors max-w-[120px] truncate">{item.source}</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-500 font-mono text-[9px] opacity-70 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo}
                      </div>
                    </div>

                    <h3 className="text-[13px] font-semibold text-zinc-200 leading-snug group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_rgba(147,197,253,0.3)] transition-all duration-300">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[9px] text-zinc-500/80 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5 hover:text-zinc-300 hover:border-white/10 transition-colors">
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}
