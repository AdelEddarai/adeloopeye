'use client';

import { ExternalLink } from 'lucide-react';

import type { DisinfoArticle } from '@/shared/hooks/use-live-disinformation';
import { timeAgo } from '@/shared/lib/format';

type Props = {
  articles: DisinfoArticle[];
};

export function DisinformationFeed({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">NO INTEL ARTICLES</span>
        <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1">
          GDELT returned no matching coverage for this window
        </span>
      </div>
    );
  }

  return (
    <div>
      {articles.map((a, i) => (
        <div
          key={a.id}
          className="px-4 py-3 hover:bg-[var(--bg-3)] transition-colors"
          style={{
            borderBottom: i < articles.length - 1 ? '1px solid var(--bd-s)' : 'none',
          }}
        >
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline block"
          >
            <span className="block text-[length:var(--text-label)] text-[var(--t1)] leading-snug mb-1.5 hover:text-[var(--blue-l)] transition-colors">
              {a.title}
            </span>
          </a>
          <div className="flex flex-wrap items-center gap-2 text-[length:var(--text-tiny)] text-[var(--t4)]">
            <span className="mono flex items-center gap-1">
              <ExternalLink size={10} />
              {a.domain}
            </span>
            <span className="mono">·</span>
            <span className="mono">{timeAgo(a.date)}</span>
            {a.countries.length > 0 && (
              <>
                <span className="mono">·</span>
                <span className="flex flex-wrap gap-1">
                  {a.countries.map(code => (
                    <span
                      key={code}
                      className="mono text-[length:var(--text-micro)] px-1 py-0.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm text-[var(--info)]"
                    >
                      {code}
                    </span>
                  ))}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
