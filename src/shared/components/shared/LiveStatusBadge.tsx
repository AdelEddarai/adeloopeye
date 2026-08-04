import { cn } from '@/shared/lib/utils';

type Props = {
  /** Short label shown after the live dot, e.g. "GDELT", "AUTO-REFRESH" */
  label?: string;
  className?: string;
};

/**
 * Pulsing LIVE indicator used to signal that the surrounding data is pulled
 * from real-time sources (not static/seed data).
 */
export function LiveStatusBadge({ label = 'LIVE', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-[var(--success)]/40 bg-[var(--success)]/10',
        className,
      )}
      title="This view is fed from real-time data sources"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
      </span>
      <span className="mono text-[length:var(--text-micro)] font-bold tracking-[0.08em] text-[var(--success)]">
        {label}
      </span>
    </span>
  );
}
