'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { useLiveAlerts } from '@/shared/hooks/use-live-alerts';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';

export function SummaryBar() {
  const { data: alertsData, isLoading: alertsLoading } = useLiveAlerts(true);
  const isLandscapePhone = useIsLandscapePhone();

  if (alertsLoading) {
    return (
      <div className={`flex items-center gap-1.5 shrink-0 overflow-x-auto bg-[var(--bg-app)] border-b border-[var(--bd)] ${isLandscapePhone ? 'h-8 safe-px' : 'h-9 px-4'}`}>
        <Skeleton className="h-3 w-20 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-32 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-40 bg-[var(--bg-3)]" />
        <Skeleton className="h-3 w-32 bg-[var(--bg-3)]" />
      </div>
    );
  }

  const alerts = alertsData?.alerts || [];
  const now = new Date();

  // Create chips from real-time alerts
  const chips = alerts.slice(0, 4).map(alert => {
    const isCritical = alert.severity === 'CRITICAL';
    const isHigh = alert.severity === 'HIGH';
    
    // Truncate title to fit in chip
    let label = alert.title.toUpperCase();
    if (label.length > 60) {
      label = label.slice(0, 57) + '...';
    }
    
    // Add location prefix for Morocco alerts
    if (alert.category === 'MOROCCO' && alert.location) {
      label = `${alert.location.toUpperCase()}: ${label}`;
    }
    
    return {
      label,
      danger: isCritical || isHigh,
      severity: alert.severity,
      category: alert.category,
    };
  });

  // If no alerts, show default message
  if (chips.length === 0) {
    chips.push({
      label: 'NO CRITICAL ALERTS',
      danger: false,
      severity: 'MEDIUM' as const,
      category: 'GLOBAL' as const,
    });
  }

  // Add live timestamp
  const timeStr = now.toISOString().split('T')[1].slice(0, 5); // HH:MM format

  return (
    <div
      className={`flex items-center gap-1.5 shrink-0 overflow-x-auto touch-scroll hide-scrollbar bg-[var(--bg-app)] border-b border-[var(--bd)] ${isLandscapePhone ? 'h-8 safe-px' : 'h-9 px-4'}`}
    >
      <span className="label shrink-0 text-[length:var(--text-tiny)] text-[var(--t4)]">LIVE ALERTS</span>
      <div className="shrink-0 w-px h-3.5 bg-[var(--bd)]" />
      
      {/* Live indicator */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        <span className="mono text-[length:var(--text-tiny)] text-[var(--success)] font-bold">LIVE</span>
      </div>
      
      <div className="shrink-0 w-px h-3.5 bg-[var(--bd)]" />
      
      {chips.map((chip, idx) => (
        <div
          key={`${chip.label}-${idx}`}
          className={`flex items-center shrink-0 px-2 py-0.5 border ${
            chip.danger 
              ? chip.severity === 'CRITICAL'
                ? 'bg-[var(--danger-dim)] border-[var(--danger-bd)]'
                : 'bg-[var(--warning-dim)] border-[var(--warning-bd)]'
              : 'bg-[var(--bg-2)] border-[var(--bd)]'
          }`}
        >
          <span className={`mono text-[length:var(--text-caption)] font-bold tracking-[0.06em] ${
            chip.danger 
              ? chip.severity === 'CRITICAL'
                ? 'text-[var(--danger)]'
                : 'text-[var(--warning)]'
              : 'text-[var(--t2)]'
          }`}>
            {chip.label}
          </span>
        </div>
      ))}
      
      <div className="shrink-0 ml-auto">
        <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
          {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {timeStr} UTC · REAL-TIME
        </span>
      </div>
    </div>
  );
}
