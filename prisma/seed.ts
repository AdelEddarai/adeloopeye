/**
 * prisma/seed.ts
 * Seeds real reference configuration (RSS feed sources, economic index
 * definitions, prediction market groups). The conflict feed itself is NOT
 * seeded — it is populated from real-time sources by the real-time sync layer
 * (src/server/lib/real-time-sync.ts) on first request / on a schedule.
 *
 * Run: npx prisma db seed
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { getDatabaseUrl } from '@/shared/lib/env';

import { PrismaClient } from '@/generated/prisma/client';
import { RSS_FEEDS, CONFLICT_COLLECTIONS } from './seed-data/rss-feeds.js';
import { ECONOMIC_INDEXES } from './seed-data/economic-indexes.js';
import { MARKET_GROUPS } from './seed-data/prediction-groups.js';

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding reference configuration...\n');

  // ─── 1. RSS Feeds ─────────────────────────────────────────────────────────
  console.log('1. RSS feeds...');
  await prisma.rssFeed.deleteMany();
  await prisma.rssFeed.createMany({
    data: RSS_FEEDS.map(f => ({
      id: f.id,
      name: f.name,
      url: f.url,
      perspective: f.perspective as 'WESTERN' | 'US_GOV' | 'ISRAELI' | 'IRANIAN' | 'ARAB' | 'RUSSIAN' | 'CHINESE' | 'INDEPENDENT' | 'INTL_ORG',
      country: f.country,
      tags: f.tags,
      stateFunded: f.stateFunded ?? false,
      tier: f.tier,
    })),
  });
  console.log(`   ✓ ${RSS_FEEDS.length} feeds`);

  // ─── 2. Conflict Collections + Channels + ChannelFeeds ────────────────────
  console.log('2. Conflict collections...');
  await prisma.channelFeed.deleteMany();
  await prisma.conflictChannel.deleteMany();
  await prisma.conflictCollection.deleteMany();
  for (const coll of CONFLICT_COLLECTIONS) {
    const collection = await prisma.conflictCollection.create({
      data: {
        conflictId: 'iran-2026',
        name: coll.name,
        description: coll.description,
      },
    });

    for (let i = 0; i < coll.channels.length; i++) {
      const ch = coll.channels[i];
      const channel = await prisma.conflictChannel.create({
        data: {
          collectionId: collection.id,
          label: ch.label,
          description: ch.description,
          perspective: ch.perspective,
          color: ch.color,
          ord: i,
        },
      });

      for (let j = 0; j < ch.feedIds.length; j++) {
        await prisma.channelFeed.create({
          data: {
            channelId: channel.id,
            feedId: ch.feedIds[j],
            ord: j,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${CONFLICT_COLLECTIONS.length} collections`);

  // ─── 3. Economic Indexes ───────────────────────────────────────────────────
  console.log('3. Economic indexes...');
  await prisma.economicIndex.deleteMany();
  await prisma.economicIndex.createMany({
    data: ECONOMIC_INDEXES.map(idx => ({
      id: idx.id,
      ticker: idx.ticker,
      name: idx.name,
      shortName: idx.shortName,
      category: idx.category,
      tier: idx.tier,
      unit: idx.unit,
      description: idx.description,
      color: idx.color,
    })),
  });
  console.log(`   ✓ ${ECONOMIC_INDEXES.length} indexes`);

  // ─── 4. Prediction Groups ──────────────────────────────────────────────────
  console.log('4. Prediction groups...');
  await prisma.predictionGroup.deleteMany();
  await prisma.predictionGroup.createMany({
    data: MARKET_GROUPS.map((g, i) => ({
      id: g.id,
      label: g.label,
      description: g.description,
      color: g.color,
      bg: g.bg,
      border: g.border,
      titleMatches: g.titleMatches,
      ord: i,
    })),
  });
  console.log(`   ✓ ${MARKET_GROUPS.length} groups`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n=== Seed complete ===');
  const counts = {
    rssFeeds: await prisma.rssFeed.count(),
    collections: await prisma.conflictCollection.count(),
    channels: await prisma.conflictChannel.count(),
    econIndexes: await prisma.economicIndex.count(),
    predictionGroups: await prisma.predictionGroup.count(),
  };
  console.table(counts);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
