'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { BROWSE_SECTIONS } from '@/features/browse/constants';

import { trackNavigationClicked } from '@/shared/lib/analytics';
import { useAnalyticsLayoutMode } from '@/shared/hooks/use-analytics-layout-mode';

type Props = {
  hamburgerSlot?: React.ReactNode;
};

export function BrowseNav({ hamburgerSlot }: Props) {
  const pathname = usePathname();
  const layoutMode = useAnalyticsLayoutMode();

  const trackBrowseNavigation = (destinationPath: string, component: string, ctaVariant?: string) => {
    trackNavigationClicked({
      component,
      cta_variant: ctaVariant,
      destination_path: destinationPath,
      layout_mode: layoutMode,
      pathname,
      surface: 'browse_navigation',
    });
  };

  return (
    <header className="shrink-0 border-b border-[var(--bd)]">
      <div className="h-[3px] bg-[var(--danger)]" />
      <div className="h-11 flex items-center justify-between bg-[var(--bg-app)] px-5">
        <div className="flex items-center gap-5">
          {hamburgerSlot}
          <Link href="/browse" className="no-underline">
            <span className="text-[length:var(--text-subhead)] font-bold text-[var(--t1)] tracking-[0.12em]">
              ADELOOPEYE
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {BROWSE_SECTIONS.map((s) => {
              const isActive = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => {
                    if (isActive) return;
                    trackBrowseNavigation(s.href, 'top_nav');
                  }}
                  className={`no-underline text-[length:var(--text-body-sm)] font-medium px-2.5 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[var(--t1)] border-[var(--blue)]'
                      : 'text-[var(--t3)] border-transparent hover:text-[var(--t1)]'
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
            <Link
              href="/browse/api/reference"
              onClick={() => {
                if (pathname.startsWith('/browse/api/reference')) return;
                trackBrowseNavigation('/browse/api/reference', 'top_nav');
              }}
              className={`no-underline text-[length:var(--text-body-sm)] font-medium px-2.5 py-1 border-b-2 transition-colors ${
                pathname.startsWith('/browse/api/reference')
                  ? 'text-[var(--t1)] border-[var(--blue)]'
                  : 'text-[var(--t3)] border-transparent hover:text-[var(--t1)]'
              }`}
            >
              API
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="xs"
            asChild
            className="hidden md:inline-flex bg-[var(--blue)] text-[var(--bg-app)] font-bold hover:bg-[var(--blue-l)]"
          >
            <Link
              href="/dashboard"
              onClick={() => trackBrowseNavigation('/dashboard', 'header_cta', 'dashboard')}
            >
              Dashboard &rarr;
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
