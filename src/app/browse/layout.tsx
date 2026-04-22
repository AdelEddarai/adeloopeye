import { BrowseShell } from '@/features/browse/components/layout/BrowseShell';
import { ViewportHeightSync } from '@/shared/components/layout/ViewportHeightSync';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ViewportHeightSync />
      <div data-theme="auto" className="browse-shell bg-[var(--bg-app)]">
        <BrowseShell>{children}</BrowseShell>
      </div>
    </>
  );
}
