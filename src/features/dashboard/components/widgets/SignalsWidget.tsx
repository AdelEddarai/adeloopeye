'use client';

import { Loader2 } from 'lucide-react';

import { useLiveNews } from '@/shared/hooks/use-live-news';

export function SignalsWidget() {
  const { data, isLoading, error } = useLiveNews('breaking news iran israel', 20);

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
        <span className="text-sm text-[var(--danger)]">Failed to load signals</span>
      </div>
    );
  }

  const articles = data?.articles || [];

  return (
    <div className="h-full overflow-y-auto p-2.5">
      {articles.map((article, idx) => (
        <a
          key={idx}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-2.5 p-3 rounded bg-[var(--bg-2)] border border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors no-underline"
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="mono text-xs text-[var(--t2)] font-semibold">{article.source}</span>
                <span className="text-[10px] text-[var(--t4)]">
                  {new Date(article.publishedAt).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-sm text-[var(--t1)] font-semibold leading-snug mb-1">
                {article.title}
              </h3>
              {article.description && (
                <p className="text-xs text-[var(--t3)] leading-snug line-clamp-2">
                  {article.description}
                </p>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
