'use client';

import { useMemo } from 'react';

import { useConflict, useConflictDays } from '@/features/dashboard/queries/conflicts';
import { useRssCollections, useRssFeedItems, useRssFeeds } from '@/features/news/queries';
import { ConflictTimeline } from '@/features/news/components/ConflictTimeline';

import { timeAgo } from '@/shared/lib/format';

export function ConflictNewsWidget() {
  const { data: conflict } = useConflict();
  const { data: snapshots } = useConflictDays();
  const { data: feeds } = useRssFeeds();
  const { data: collections } = useRssCollections();

  const feedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of collections ?? []) {
      for (const ch of c.channels) {
        for (const id of ch.feedIds) ids.add(id);
      }
    }
    return [...ids];
  }, [collections]);

  const { data: feedData } = useRssFeedItems(feedIds);

  const headlines = useMemo(() => {
    if (!feedData) return [];
    const items: { title: string; link: string; date: string; feedName: string }[] = [];
    feedData.forEach((feedItems, feedId) => {
      const feed = feeds?.find(f => f.id === feedId);
      for (const item of feedItems) {
        if (!item.title) continue;
        items.push({
          title: item.title,
          link: item.link,
          date: item.isoDate ?? item.pubDate,
          feedName: feed?.name ?? feedId,
        });
      }
    });
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [feedData, feeds]);

  const latest = useMemo(
    () => (snapshots ?? []).slice().sort((a, b) => (a.day < b.day ? -1 : 1)).at(-1),
    [snapshots],
  );

  const statusColor =
    conflict?.status === 'ONGOING'
      ? 'var(--danger)'
      : conflict?.status === 'PAUSED'
        ? 'var(--warning)'
        : conflict?.status === 'CEASEFIRE'
          ? 'var(--info)'
          : 'var(--success)';
  const statusDim = `color-mix(in srgb, ${statusColor} 14%, transparent)`;

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      {/* Conflict header */}
      <div className="px-4 py-2.5 bg-[var(--bg-2)] border-b border-[var(--bd)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)] tracking-[0.12em]">
            {conflict?.name ?? 'CONFLICT'}
          </span>
          {conflict?.status && (
            <span
              className="mono text-[length:var(--text-micro)] font-bold px-1.5 py-0.5 border rounded-sm tracking-wider"
              style={{ color: statusColor, borderColor: statusColor, background: statusDim }}
            >
              {conflict.status}
            </span>
          )}
          <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] tracking-wider ml-auto">
            {latest?.dayLabel ?? ''}
          </span>
        </div>
        {conflict && (
          <div className="mt-2 flex items-center gap-2">
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] tracking-[0.10em] shrink-0">
              ESCALATION
            </span>
            <div className="flex-1 h-1.5 bg-[var(--bg-3)] rounded-sm overflow-hidden">
              <div
                className="h-full bg-[var(--danger)] rounded-sm transition-all"
                style={{ width: `${conflict.escalation}%` }}
              />
            </div>
            <span className="mono text-[length:var(--text-caption)] font-bold text-[var(--danger)] leading-none shrink-0">
              {conflict.escalation}
            </span>
          </div>
        )}
      </div>

      {/* Headlines */}
      <div className="shrink-0 px-4 pt-2.5 pb-1 border-b border-[var(--bd)]">
        <div className="label text-[length:var(--text-micro)] text-[var(--t4)] mb-1 tracking-[0.10em]">
          CONFLICT HEADLINES
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {headlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)]">NO HEADLINES</span>
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1">feeds not yet fetched</span>
          </div>
        ) : (
          headlines.map((h, i) => (
            <a
              key={`${h.link}-${i}`}
              href={h.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline px-4 py-2 hover:bg-[var(--bg-3)] transition-colors"
              style={{ borderBottom: i < headlines.length - 1 ? '1px solid var(--bd-s)' : 'none' }}
            >
              <p className="text-[length:var(--text-label)] text-[var(--t1)] leading-snug line-clamp-2 mb-1">
                {h.title}
              </p>
              <span className="mono text-[length:var(--text-micro)] text-[var(--t4)]">
                {h.feedName} · {timeAgo(h.date)}
              </span>
            </a>
          ))
        )}
      </div>

      {/* Escalation timeline */}
      <div className="shrink-0 px-4 py-2.5 border-t border-[var(--bd)] bg-[var(--bg-2)]">
        <div className="label text-[length:var(--text-micro)] text-[var(--t4)] mb-1.5 tracking-[0.10em]">
          ESCALATION TIMELINE
        </div>
        <ConflictTimeline snapshots={snapshots ?? []} limit={10} />
      </div>
    </div>
  );
}
