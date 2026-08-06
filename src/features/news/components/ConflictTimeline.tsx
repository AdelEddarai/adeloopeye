'use client';

import type { ConflictDaySnapshot } from '@/types/domain';

type Props = {
  snapshots: ConflictDaySnapshot[];
  limit?: number;
};

function shortDay(day: string): string {
  return day.length >= 10 ? day.slice(5).replace('-', '/') : day;
}

export function ConflictTimeline({ snapshots, limit = 14 }: Props) {
  const days = snapshots
    .slice()
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .slice(-limit);

  if (days.length === 0) {
    return (
      <div className="mono text-[length:var(--text-micro)] text-[var(--t4)] py-2">
        NO DAY SNAPSHOTS
      </div>
    );
  }

  const max = Math.max(...days.map(d => d.escalation), 1);

  return (
    <div>
      <div className="flex gap-[3px]">
        {days.map(d => (
          <div
            key={d.day}
            className="flex-1 flex flex-col justify-end"
            style={{ height: 40 }}
            title={`${d.dayLabel} — escalation ${d.escalation}`}
          >
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(4, (d.escalation / max) * 100)}%`,
                background:
                  d.escalation >= 70
                    ? 'var(--danger)'
                    : d.escalation >= 45
                      ? 'var(--warning)'
                      : 'var(--info)',
                opacity: 0.9,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[3px] mt-1">
        {days.map(d => (
          <div key={d.day} className="flex-1 text-center overflow-hidden">
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)]">
              {shortDay(d.day)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
