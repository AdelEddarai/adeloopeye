import type { Metadata } from 'next';

import { Capabilities } from '@/features/browse/components/landing/Capabilities';
import { Faq } from '@/features/browse/components/landing/Faq';
import { FooterCta } from '@/features/browse/components/landing/FooterCta';
import { Hero } from '@/features/browse/components/landing/Hero';
import { HowItWorks } from '@/features/browse/components/landing/HowItWorks';
import { JsonLd } from '@/features/browse/components/landing/JsonLd';
import { OpenSource } from '@/features/browse/components/landing/OpenSource';
import { Screenshot } from '@/features/browse/components/landing/Screenshot';
import { StatsBar } from '@/features/browse/components/landing/StatsBar';
import { WhoItsFor } from '@/features/browse/components/landing/WhoItsFor';

export const metadata: Metadata = {
  title: 'AdeloopEye — Morocco OSINT Intelligence Platform | Adeloop AI Lab',
  description:
    'Real-time Morocco intelligence dashboard by Adeloop AI Lab. Live map tracking events, weather, traffic, fires across Morocco. Multi-source news aggregation (RSS + API + Telegram), 70+ cities, 24h monitoring. Free and open source.',
  openGraph: {
    title: 'AdeloopEye — Morocco OSINT Intelligence Platform',
    description:
      'Track Morocco in real time. Live event map, AI briefs, weather alerts, traffic monitoring, fire detection. Developed by Adeloop AI Lab.',
    url: 'https://www.adeloopeye.com/browse',
    images: [{ url: '/og-image-1200x630.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdeloopEye — Morocco OSINT Intelligence Platform',
    description:
      'Real-time Morocco intelligence: events, weather, traffic, fires. World Monitor-inspired visualization. By Adeloop AI Lab.',
    images: ['/og-image-1200x630.jpg'],
  },
  alternates: {
    canonical: 'https://www.adeloopeye.com/browse',
  },
};

export default function BrowsePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <Screenshot />
      <StatsBar />
      <Capabilities />
      <HowItWorks />
      <WhoItsFor />
      <OpenSource />
      <Faq />
      <FooterCta />
    </>
  );
}
