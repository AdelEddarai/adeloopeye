import type { Metadata } from 'next';

/**
 * Force all dashboard routes to be dynamically rendered at request time.
 * Every dashboard page uses useSearchParams / useConflictDay / browser-only hooks
 * that crash Next.js static prerendering workers during `next build`.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Overview',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
