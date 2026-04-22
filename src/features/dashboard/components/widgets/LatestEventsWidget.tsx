'use client';

import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';

import { useLiveNews } from '@/shared/hooks/use-live-news';

export function LatestEventsWidget() {
  const { data, isLoading, error } = useLiveNews('iran israel conflict', 30);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="text-sm text-[var(--danger)]">Failed to load news</span>
      </div>
    );
  }

  const articles = data?.articles || [];

  return (
    <div className="h-full overflow-y-auto">
      {articles.map((article, i) => {
        const publishTime = new Date(article.publishedAt);
        const timeStr = publishTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });

        return (
          <a 
            key={i} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="no-underline"
          >
            <div
              className="flex gap-3 items-start px-4 py-2 cursor-pointer hover:bg-[var(--bg-3)] transition-colors"
              style={{ borderBottom: i < articles.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
            >
              <div className="shrink-0 flex flex-col gap-1 w-20">
                <span className="sev sev-std">NEWS</span>
                <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">{timeStr}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--t1)] leading-snug mb-0.5 break-words">{article.title}</p>
                <span className="mono text-[length:var(--text-caption)] text-[var(--t4)] truncate block">
                  {article.source}
                </span>
              </div>
              <div className="shrink-0 flex items-center">
                <div className="w-1 h-full min-h-[32px] mr-2 opacity-40" style={{ background: 'var(--blue)' }} />
                <ExternalLink size={10} strokeWidth={1.5} className="text-[var(--t4)]" />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
