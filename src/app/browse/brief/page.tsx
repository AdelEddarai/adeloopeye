import type { Metadata } from 'next';

import { BriefList } from '@/features/browse/components/briefs/BriefList';
import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';
import { BrowsePagination } from '@/features/browse/components/layout/BrowsePagination';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import {
  buildBrowseMetadata,
  buildDescription,
  getCanonicalListPath,
} from '@/features/browse/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from '@/features/browse/lib/structured-data';
import { getBriefs, PAGE_SIZE } from '@/features/browse/queries';
import { LiveStatusBadge } from '@/shared/components/shared/LiveStatusBadge';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const path = getCanonicalListPath('/browse/brief', page);
  const title = page > 1 ? `Conflict Daily Briefs - Page ${page}` : 'Conflict Daily Briefs';
  const description = buildDescription('Read daily conflict briefs with escalation scoring, key facts, casualties, economic impact, and scenario analysis updated throughout the crisis.');

  return buildBrowseMetadata({
    title,
    description,
    path,
    image: { alt: 'Conflict daily briefs on Conflicts.app' },
  });
}

export default async function BrowseBriefPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { briefs, total } = await getBriefs({ page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const canonicalPath = getCanonicalListPath('/browse/brief', page);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Briefs', path: '/browse/brief' },
    ]),
    buildCollectionPageJsonLd({
      name: 'Conflict Daily Briefs',
      description: 'Daily intelligence briefs covering escalation, casualties, economic impact, and scenario analysis across the tracked conflict.',
      path: canonicalPath,
    }),
    buildItemListJsonLd({
      name: 'Conflict Daily Briefs',
      path: canonicalPath,
      items: briefs.map((brief) => ({
        name: brief.dayLabel,
        url: `/browse/brief/${brief.day}`,
        description: brief.summary,
      })),
    }),
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />
      <BrowsePageHeader crumbs={[{ label: 'Briefs' }]} hasAutoRefresh />
      <header className="mt-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <p className="label">Intelligence briefs</p>
          <LiveStatusBadge />
        </div>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Daily Briefs</h1>
        <p className="text-xs text-[var(--t3)]">
          {total > PAGE_SIZE ? `Showing ${from}–${to} of ${total} briefs` : `${total} briefs`} compiled from real-time reporting
        </p>
      </header>
      <BriefList briefs={briefs} />
      {totalPages > 1 && (
        <div className="mt-10">
          <BrowsePagination page={page} totalPages={totalPages} basePath="/browse/brief" />
        </div>
      )}
    </div>
  );
}
