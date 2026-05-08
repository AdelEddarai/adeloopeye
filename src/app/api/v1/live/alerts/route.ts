import { NextRequest } from 'next/server';
import { ok } from '@/server/lib/api-utils';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';

export type LiveAlert = {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'MOROCCO' | 'GLOBAL';
  timestamp: string;
  source: string;
  location?: string;
};

/**
 * GET /api/v1/live/alerts
 * Real-time breaking news alerts for Morocco and global serious events
 * Returns top 5 most critical/recent alerts
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Live Alerts] Fetching breaking news...');

    // Fetch Morocco-specific news
    const moroccoNewsPromise = multiNewsClient.searchNews(
      'Morocco OR Maroc OR Rabat OR Casablanca OR Tangier earthquake OR fire OR explosion OR attack OR protest OR crisis OR emergency',
      10,
      'en'
    ).catch(() => []);

    // Fetch global critical news
    const globalNewsPromise = multiNewsClient.searchNews(
      'breaking OR urgent OR alert earthquake OR tsunami OR attack OR explosion OR war OR crisis OR disaster OR emergency',
      10,
      'en'
    ).catch(() => []);

    const [moroccoArticles, globalArticles] = await Promise.all([
      moroccoNewsPromise,
      globalNewsPromise,
    ]);

    console.log(`[Live Alerts] Fetched ${moroccoArticles.length} Morocco + ${globalArticles.length} global articles`);

    const alerts: LiveAlert[] = [];

    // Process Morocco articles
    moroccoArticles.forEach((article, idx) => {
      const content = (article.title + ' ' + (article.description || '')).toLowerCase();
      
      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
      if (
        content.includes('earthquake') ||
        content.includes('attack') ||
        content.includes('explosion') ||
        content.includes('killed') ||
        content.includes('dead') ||
        content.includes('disaster')
      ) {
        severity = 'CRITICAL';
      } else if (
        content.includes('fire') ||
        content.includes('protest') ||
        content.includes('crisis') ||
        content.includes('emergency') ||
        content.includes('breaking')
      ) {
        severity = 'HIGH';
      }

      // Extract location
      let location = 'Morocco';
      const cities = ['Rabat', 'Casablanca', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Meknes', 'Oujda'];
      for (const city of cities) {
        if (content.includes(city.toLowerCase())) {
          location = city;
          break;
        }
      }

      alerts.push({
        id: `morocco-${idx}-${Date.now()}`,
        title: article.title,
        severity,
        category: 'MOROCCO',
        timestamp: article.publishedAt,
        source: article.source,
        location,
      });
    });

    // Process global articles
    globalArticles.forEach((article, idx) => {
      const content = (article.title + ' ' + (article.description || '')).toLowerCase();
      
      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
      if (
        content.includes('earthquake') ||
        content.includes('tsunami') ||
        content.includes('nuclear') ||
        content.includes('war') ||
        content.includes('attack') ||
        content.includes('explosion') ||
        content.includes('killed') ||
        content.includes('dead') ||
        content.includes('disaster')
      ) {
        severity = 'CRITICAL';
      } else if (
        content.includes('breaking') ||
        content.includes('urgent') ||
        content.includes('crisis') ||
        content.includes('emergency')
      ) {
        severity = 'HIGH';
      }

      // Extract location from content
      let location = 'Global';
      const countries = [
        'USA', 'United States', 'China', 'Russia', 'India', 'Japan', 'Germany', 'France',
        'UK', 'Britain', 'Israel', 'Iran', 'Ukraine', 'Syria', 'Iraq', 'Yemen', 'Gaza',
        'Turkey', 'Egypt', 'Saudi Arabia', 'Pakistan', 'Afghanistan', 'Korea', 'Taiwan'
      ];
      for (const country of countries) {
        if (content.includes(country.toLowerCase())) {
          location = country;
          break;
        }
      }

      alerts.push({
        id: `global-${idx}-${Date.now()}`,
        title: article.title,
        severity,
        category: 'GLOBAL',
        timestamp: article.publishedAt,
        source: article.source,
        location,
      });
    });

    // Sort by severity (CRITICAL first) then by timestamp (newest first)
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Return top 5 alerts
    const topAlerts = alerts.slice(0, 5);

    console.log(`[Live Alerts] Returning ${topAlerts.length} alerts:`, topAlerts.map(a => `${a.severity} - ${a.title.slice(0, 50)}`));

    return ok(
      {
        alerts: topAlerts,
        count: topAlerts.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120', // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    console.error('[Live Alerts] Error:', error);
    return ok(
      {
        alerts: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }
}
