'use client';

import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveNews } from '@/shared/hooks/use-live-news';

type Props = {
  query?: string;
  limit?: number;
};

export function LiveNewsPanel({ query = 'iran israel conflict', limit = 20 }: Props) {
  const { data, isLoading, error, refetch, isFetching } = useLiveNews(query, limit);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
          <span className="section-title">LIVE NEWS</span>
          {data && (
            <span className="mono text-[var(--t4)]">
              {data.count} articles
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
          </div>
        )}

        {error && (
          <div className="p-4 text-[var(--danger)]">
            <p className="font-semibold">Failed to load news</p>
            <p className="text-sm text-[var(--t3)] mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {data && (
          <div className="p-3 space-y-2">
            {data.articles.map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded bg-[var(--bg-2)] border border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--t1)] text-sm line-clamp-2 mb-1">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-[var(--t3)] line-clamp-2 mb-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-[var(--t4)]">
                      <span className="mono">{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-[var(--t4)] flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        )}
      </ScrollArea>

      {data && (
        <div className="px-3 py-2 border-t border-[var(--bd-s)] text-[10px] text-[var(--t4)] mono">
          Last updated: {new Date(data.fetchedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
