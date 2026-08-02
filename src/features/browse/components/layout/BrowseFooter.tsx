'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { useCookieConsent } from '@/shared/components/privacy/CookieConsentProvider';

import { SHOW_COOKIE_CONTROLS } from '@/shared/config/privacy';

export function BrowseFooter() {
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="border-t border-[var(--bd)] bg-[var(--bg-app)] px-5 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="mono text-xs font-bold text-[var(--t1)] tracking-[0.14em]">
              ADELOOPEYE
            </span>
            <span className="text-xs text-[var(--t4)]">
              Morocco OSINT Intelligence Platform • Developed by Adeloop AI Lab 🇲🇦
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/browse"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/privacy"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/cookies"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/terms"
              className="no-underline text-xs text-[var(--t3)] hover:text-[var(--t1)] transition-colors"
            >
              Terms
            </Link>
            {SHOW_COOKIE_CONTROLS ? (
              <Button
                variant="ghost"
                size="xs"
                className="h-auto px-0 py-0 text-xs font-normal text-[var(--t3)] hover:bg-transparent hover:text-[var(--t1)]"
                onClick={openPreferences}
              >
                Cookie settings
              </Button>
            ) : null}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-[var(--bd-s)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[length:var(--text-body-sm)] text-[var(--t4)]">
            AGPL-3.0 License • Open Source
          </span>
          <span className="text-[length:var(--text-body-sm)] text-[var(--t4)]">
            adeloopeye.com
          </span>
        </div>
      </div>
    </footer>
  );
}
