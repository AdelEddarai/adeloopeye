'use client';

import { useMemo } from 'react';

import { useConflict, useConflictDays } from '@/features/dashboard/queries/conflicts';
import { ConflictTimeline } from '@/features/news/components/ConflictTimeline';

export function ConflictIntelPanel() {
  const { data: conflict } = useConflict();
  const { data: snapshots } = useConflictDays();

  const latest = useMemo(
    () => (snapshots ?? []).slice().sort((a, b) => (a.day < b.day ? -1 : 1)).at(-1),
    [snapshots],
  );

  if (!conflict) return null;

  const statusColor =
    conflict.status === 'ONGOING'
      ? 'var(--danger)'
      : conflict.status === 'PAUSED'
        ? 'var(--warning)'
        : conflict.status === 'CEASEFIRE'
          ? 'var(--info)'
          : 'var(--success)';
  const statusDim = `color-mix(in srgb, ${statusColor} 14%, transparent)`;

  return (
    <div className="border-b border-[var(--bd)] bg-[var(--bg-1)]">
      <div className="px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
            <h2 className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)] tracking-[0.12em]">
              {conflict.name}
            </h2>
          </div>
          <span
            className="mono text-[length:var(--text-tiny)] font-bold px-1.5 py-0.5 border rounded-sm tracking-wider"
            style={{ color: statusColor, borderColor: statusColor, background: statusDim }}
          >
            {conflict.status}
          </span>
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-wider">
            THREAT: {conflict.threatLevel}
          </span>
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-wider">
            {conflict.region}
          </span>
          {latest && (
            <span className="mono text-[length:var(--text-tiny)] text-[var(--t3)] tracking-wider ml-auto">
              LATEST: {latest.dayLabel}
            </span>
          )}
        </div>

        {/* Escalation meter */}
        <div className="mt-3 flex items-center gap-3">
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

        {/* Latest snapshot */}
        {latest && (
          <p className="text-[length:var(--text-label)] text-[var(--t2)] leading-relaxed mt-3 line-clamp-3">
            {latest.summary}
          </p>
        )}

        {/* Key facts chips */}
        {latest && latest.keyFacts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {latest.keyFacts.slice(0, 4).map(fact => (
              <span
                key={fact}
                className="mono text-[length:var(--text-micro)] px-1.5 py-0.5 bg-[var(--bg-2)] border border-[var(--bd)] rounded-sm text-[var(--t3)]"
              >
                {fact}
              </span>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="mt-3">
          <div className="label text-[length:var(--text-micro)] text-[var(--t4)] mb-1.5 tracking-[0.10em]">
            ESCALATION TREND — {limitLabel(snapshots?.length ?? 0)}
          </div>
          <ConflictTimeline snapshots={snapshots ?? []} />
        </div>
      </div>
    </div>
  );
}

function limitLabel(total: number): string {
  return total > 0 ? `LAST ${Math.min(total, 14)} DAYS` : 'NO DATA';
}
