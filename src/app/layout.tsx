import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import { Toaster } from '@/components/ui/sonner';

import { SITE_URL } from '@/features/browse/constants';
import { CookieConsentProvider } from '@/shared/components/privacy/CookieConsentProvider';
import { GoogleAnalytics } from '@/lib/analytics';

import { QueryProvider } from '@/shared/lib/query-provider';
import { ReduxProvider } from '@/shared/state/redux-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'AdeloopEye',
  title: {
    default: 'AdeloopEye — Morocco OSINT Intelligence Platform | Adeloop AI Lab',
    template: '%s | AdeloopEye',
  },
  description: 'AdeloopEye is Morocco\'s real-time OSINT intelligence platform developed by Adeloop AI Lab. Live event tracking, weather monitoring, traffic intelligence, and fire detection across 70+ Moroccan cities with World Monitor-inspired visualization.',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'AdeloopEye',
    title: 'AdeloopEye — Morocco OSINT Intelligence Platform',
    description: 'Real-time Morocco intelligence dashboard by Adeloop AI Lab. Live map, multi-source news aggregation, weather alerts, traffic monitoring, fire detection. 70+ cities, 24h monitoring.',
    images: [
      {
        url: '/og-image-1200x630.jpg',
        width: 1200,
        height: 630,
        alt: 'AdeloopEye - Morocco OSINT Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdeloopEye — Morocco OSINT Intelligence Platform',
    description: 'Real-time Morocco intelligence: events, weather, traffic, fires. World Monitor-inspired visualization. By Adeloop AI Lab 🇲🇦',
    images: ['/og-image-1200x630.jpg'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body>
        {gaId && (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={gaId} />
          </Suspense>
        )}
        <CookieConsentProvider>
          <ReduxProvider>
            <QueryProvider>
              {children}
              <Toaster theme="dark" position="bottom-right" />
            </QueryProvider>
          </ReduxProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
