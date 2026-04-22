import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchCyberThreats } from '@/server/lib/api-clients/cyber-threat-client';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';
import { openSkyClient } from '@/server/lib/api-clients/opensky-client';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  
  try {
    console.log('[Map Stories] Generating stories...');
    
    const [articles, flights, cyberThreats] = await Promise.allSettled([
      newsAPIClient.searchNews('iran OR israel OR syria OR iraq OR ukraine OR russia attack OR strike OR war OR conflict', 20, 'en').catch(() => []),
      openSkyClient.getAllFlights().catch(() => []),
      fetchCyberThreats().catch(() => []),
    ]);

    const articlesData = articles.status === 'fulfilled' ? articles.value : [];
    const flightsData = flights.status === 'fulfilled' ? flights.value : [];
    const cyberThreatsData = cyberThreats.status === 'fulfilled' ? cyberThreats.value : [];

    const stories = [];
    const now = new Date().toISOString();

    // Story 1: Global Flight Activity
    if (flightsData.length > 0) {
      const airborne = flightsData.filter(f => !f.on_ground);
      stories.push({
        id: 'story-flights',
        conflictId: 'iran-2026',
        title: `${airborne.length} Aircraft Tracked`,
        subtitle: 'Real-time monitoring',
        narrative: `Tracking ${airborne.length} airborne aircraft worldwide.`,
        timestamp: now,
        category: 'INTELLIGENCE',
        iconName: 'plane',
        primaryEventId: null,
        sourceEventIds: [],
        highlightStrikeIds: [],
        highlightMissileIds: [],
        highlightTargetIds: [],
        highlightAssetIds: [],
        viewState: { 
          longitude: 0, 
          latitude: 30, 
          zoom: 2, 
          pitch: 0, 
          bearing: 0,
          transitionDuration: 1200,
        },
        events: [],
      });
    }

    // Story 2: Cyber Threats
    if (cyberThreatsData.length > 0) {
      const critical = cyberThreatsData.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH');
      stories.push({
        id: 'story-cyber',
        conflictId: 'iran-2026',
        title: `${cyberThreatsData.length} Cyber Threats`,
        subtitle: `${critical.length} critical`,
        narrative: `${cyberThreatsData.length} active threats detected, ${critical.length} require immediate attention.`,
        timestamp: now,
        category: 'CYBER',
        iconName: 'shield-alert',
        primaryEventId: null,
        sourceEventIds: [],
        highlightStrikeIds: [],
        highlightMissileIds: [],
        highlightTargetIds: [],
        highlightAssetIds: [],
        viewState: { 
          longitude: 0, 
          latitude: 30, 
          zoom: 2, 
          pitch: 0, 
          bearing: 0,
          transitionDuration: 1200,
        },
        events: [],
      });
    }

    // Story 3-7: War & Conflict News Stories
    const warKeywords = ['war', 'attack', 'strike', 'military', 'conflict', 'invasion', 'bombing'];
    const warArticles = articlesData.filter(a => {
      const text = `${a.title} ${a.description}`.toLowerCase();
      return warKeywords.some(kw => text.includes(kw));
    });

    for (let i = 0; i < Math.min(5, warArticles.length); i++) {
      const article = warArticles[i];
      const text = `${article.title} ${article.description}`.toLowerCase();
      
      // Determine category and location
      let category: 'STRIKE' | 'RETALIATION' | 'DIPLOMATIC' | 'BREAKING' = 'BREAKING';
      let location: [number, number] = [35, 33]; // Default Middle East
      
      if (text.includes('strike') || text.includes('attack')) {
        category = 'STRIKE';
      } else if (text.includes('retaliat') || text.includes('response')) {
        category = 'RETALIATION';
      } else if (text.includes('diplomatic') || text.includes('talks')) {
        category = 'DIPLOMATIC';
      }
      
      // Determine location
      if (text.includes('ukraine') || text.includes('kyiv') || text.includes('russia')) {
        location = [30.5234, 50.4501]; // Kyiv
      } else if (text.includes('israel') || text.includes('gaza') || text.includes('tel aviv')) {
        location = [34.7818, 32.0853]; // Tel Aviv
      } else if (text.includes('iran') || text.includes('tehran')) {
        location = [51.3890, 35.6892]; // Tehran
      } else if (text.includes('syria') || text.includes('damascus')) {
        location = [36.2765, 33.5138]; // Damascus
      } else if (text.includes('iraq') || text.includes('baghdad')) {
        location = [44.3661, 33.3152]; // Baghdad
      }
      
      stories.push({
        id: `story-war-${i}`,
        conflictId: 'iran-2026',
        title: article.title.substring(0, 80),
        subtitle: article.source,
        narrative: article.description || article.title,
        timestamp: article.publishedAt,
        category,
        iconName: category === 'STRIKE' ? 'crosshair' : category === 'RETALIATION' ? 'shield' : 'alert-circle',
        primaryEventId: null,
        sourceEventIds: [],
        highlightStrikeIds: [],
        highlightMissileIds: [],
        highlightTargetIds: [],
        highlightAssetIds: [],
        viewState: { 
          longitude: location[0], 
          latitude: location[1], 
          zoom: 6, 
          pitch: 0, 
          bearing: 0,
          transitionDuration: 1200,
        },
        events: [],
      });
    }

    console.log(`[Map Stories] Generated ${stories.length} stories`);

    return ok(stories, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('[Map Stories] Error:', error);
    return ok([], { headers: { 'Cache-Control': 'public, max-age=10' } });
  }
}
