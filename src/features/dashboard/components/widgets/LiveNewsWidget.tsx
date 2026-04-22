'use client';

import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLiveNews } from '@/shared/hooks/use-live-news';

export function LiveNewsWidget() {
  const { data, isLoading, error, refetch, isFetching } = useLiveNews('iran israel conflict', 15);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[var(--danger)]">
        <p className="font-semibold">Failed to load live news</p>
        <p className="text-sm text-[var(--t3)] mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd-s)]">
        <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
        <span className="mono text-[10px] text-[var(--t4)]">
          {data?.count || 0} articles • Live
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {data?.articles.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2.5 rounded bg-[var(--bg-2)] border border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--t1)] text-xs line-clamp-2 mb-1">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-[10px] text-[var(--t3)] line-clamp-2 mb-1.5">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[9px] text-[var(--t4)]">
                  <span className="mono">{article.source}</span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleTimeString()}</span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[var(--t4)] flex-shrink-0 mt-0.5" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
