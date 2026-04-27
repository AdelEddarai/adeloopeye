/**
 * Live Data Transformer
 * Transforms real API data into application data structures
 */

import type { NewsArticle } from './api-clients/newsapi-client';
import type { OpenSkyFlight } from './api-clients/opensky-client';

// Transform news articles into Intel Events
export function transformNewsToEvents(articles: NewsArticle[]) {
  return articles.map((article, idx) => {
    // Determine severity based on keywords
    let severity: 'CRITICAL' | 'HIGH' | 'STANDARD' = 'STANDARD';
    const content = (article.title + ' ' + article.description).toLowerCase();
    
    if (content.includes('attack') || content.includes('strike') || content.includes('missile') || content.includes('killed')) {
      severity = 'CRITICAL';
    } else if (content.includes('tension') || content.includes('threat') || content.includes('military') || content.includes('warning')) {
      severity = 'HIGH';
    }

    // Determine type
    let type: 'MILITARY' | 'DIPLOMATIC' | 'INTELLIGENCE' | 'ECONOMIC' | 'HUMANITARIAN' | 'POLITICAL' = 'POLITICAL';
    if (content.includes('military') || content.includes('attack') || content.includes('strike') || content.includes('troops')) {
      type = 'MILITARY';
    } else if (content.includes('diplomat') || content.includes('negotiat') || content.includes('talks')) {
      type = 'DIPLOMATIC';
    } else if (content.includes('economic') || content.includes('sanction') || content.includes('trade') || content.includes('oil')) {
      type = 'ECONOMIC';
    } else if (content.includes('humanitarian') || content.includes('refugee') || content.includes('aid')) {
      type = 'HUMANITARIAN';
    }

    // Extract location from content (simple heuristic)
    let location = 'Unknown';
    const locations = ['Tehran', 'Jerusalem', 'Tel Aviv', 'Baghdad', 'Damascus', 'Beirut', 'Gaza', 'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Saudi Arabia'];
    for (const loc of locations) {
      if (content.includes(loc.toLowerCase())) {
        location = loc;
        break;
      }
    }

    return {
      id: `live-evt-${idx}-${Date.now()}`,
      conflictId: 'iran-2026',
      timestamp: article.publishedAt,
      createdAt: article.publishedAt,
      severity,
      type,
      title: article.title,
      location,
      summary: article.description || article.title,
      fullContent: article.content || article.description || article.title,
      verified: true,
      sources: [{
        name: article.source,
        tier: 1,
        reliability: 90,
        url: article.url,
      }],
      actorResponses: [],
      tags: [type.toLowerCase()],
    };
  });
}

// Transform news articles into X Posts (signals)
export function transformNewsToXPosts(articles: NewsArticle[]) {
  return articles.map((article, idx) => {
    // Determine significance
    let significance: 'BREAKING' | 'HIGH' | 'STANDARD' = 'STANDARD';
    const content = (article.title + ' ' + article.description).toLowerCase();
    
    if (content.includes('breaking') || content.includes('urgent') || content.includes('alert') || content.includes('just in')) {
      significance = 'BREAKING';
    } else if (content.includes('major') || content.includes('significant') || content.includes('critical')) {
      significance = 'HIGH';
    }

    return {
      id: `live-post-${idx}-${Date.now()}`,
      conflictId: 'iran-2026',
      tweetId: null,
      postType: 'NEWS_ARTICLE' as const,
      handle: article.source.toLowerCase().replace(/\s+/g, ''),
      displayName: article.source,
      avatar: '',
      avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
      verified: true,
      accountType: 'journalist' as const,
      significance,
      timestamp: article.publishedAt,
      content: article.title,
      images: article.imageUrl ? [article.imageUrl] : [],
      videoThumb: null,
      likes: 0,
      retweets: 0,
      replies: 0,
      views: 0,
      adeloopeyeNote: article.description,
      eventId: null,
      actorId: null,
      verificationStatus: 'VERIFIED' as const,
      verifiedAt: article.publishedAt,
      xaiCitations: [article.url],
    };
  });
}

// Transform flights into map features (Assets)
export function transformFlightsToMapFeatures(flights: OpenSkyFlight[]) {
  return flights
    .filter(f => f.latitude !== null && f.longitude !== null)
    .map((flight) => {
      // Determine actor based on origin country
      let actor = 'unknown';
      const country = flight.origin_country?.toLowerCase() || '';
      if (country.includes('united states') || country.includes('usa')) actor = 'us';
      else if (country.includes('israel')) actor = 'israel';
      else if (country.includes('iran')) actor = 'iran';
      else if (country.includes('russia')) actor = 'russia';
      else if (country.includes('china')) actor = 'china';
      
      // Determine priority based on altitude and velocity
      let priority: 'P1' | 'P2' | 'P3' = 'P3';
      if (flight.baro_altitude && flight.baro_altitude > 10000) priority = 'P2';
      if (flight.velocity && flight.velocity > 200) priority = 'P1';
      
      // Determine status
      const status = flight.on_ground ? 'INACTIVE' : 'ACTIVE';
      
      // Get heading for airplane rotation (true_track is in degrees from north)
      const heading = flight.true_track || 0;
      
      return {
        id: `flight-${flight.icao24}`,
        sourceEventId: null,
        actor,
        priority,
        category: 'ASSET' as const,
        type: 'AIRCRAFT' as const,
        status,
        timestamp: new Date(flight.last_contact * 1000).toISOString(),
        name: flight.callsign?.trim() || flight.icao24,
        position: [flight.longitude!, flight.latitude!] as [number, number],
        description: `${flight.origin_country} - Alt: ${Math.round(flight.baro_altitude || 0)}m, Speed: ${Math.round(flight.velocity || 0)}m/s, Heading: ${Math.round(heading)}°`,
        heading, // Store heading for icon rotation
        velocity: flight.velocity,
        altitude: flight.baro_altitude,
      };
    });
}

// Generate coordinates for locations mentioned in news
export function extractLocationCoordinates(location: string): [number, number] | null {
  const coords: Record<string, [number, number]> = {
    'Tehran': [51.3890, 35.6892],
    'Jerusalem': [35.2137, 31.7683],
    'Tel Aviv': [34.7818, 32.0853],
    'Baghdad': [44.3661, 33.3152],
    'Damascus': [36.2765, 33.5138],
    'Beirut': [35.4955, 33.8886],
    'Gaza': [34.4668, 31.5000],
    'Iran': [53.6880, 32.4279],
    'Israel': [34.8516, 31.0461],
    'Lebanon': [35.8623, 33.8547],
    'Syria': [38.9968, 34.8021],
    'Iraq': [43.6793, 33.2232],
    'Yemen': [48.5164, 15.5527],
    'Saudi Arabia': [45.0792, 23.8859],
  };

  return coords[location] || null;
}

// Transform news into critical event markers (fires, explosions, attacks)
export function transformNewsToCriticalEvents(articles: NewsArticle[]) {
  const criticalEvents: any[] = [];
  
  articles.forEach((article, idx) => {
    const content = (article.title + ' ' + article.description).toLowerCase();
    
    // Detect critical event types
    let eventType: 'FIRE' | 'EXPLOSION' | 'ATTACK' | 'STRIKE' | 'INCIDENT' | null = null;
    let severity: 'CRITICAL' | 'HIGH' | 'STANDARD' = 'STANDARD';
    
    if (content.includes('fire') || content.includes('burning') || content.includes('blaze')) {
      eventType = 'FIRE';
      severity = 'HIGH';
    } else if (content.includes('explosion') || content.includes('blast') || content.includes('detonation')) {
      eventType = 'EXPLOSION';
      severity = 'CRITICAL';
    } else if (content.includes('attack') || content.includes('assault') || content.includes('raid')) {
      eventType = 'ATTACK';
      severity = 'CRITICAL';
    } else if (content.includes('strike') || content.includes('airstrike') || content.includes('missile')) {
      eventType = 'STRIKE';
      severity = 'CRITICAL';
    } else if (content.includes('incident') || content.includes('clash') || content.includes('combat')) {
      eventType = 'INCIDENT';
      severity = 'HIGH';
    }
    
    if (!eventType) return; // Skip non-critical events
    
    // Extract location
    const locations = ['Tehran', 'Jerusalem', 'Tel Aviv', 'Baghdad', 'Damascus', 'Beirut', 'Gaza', 'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Saudi Arabia'];
    let location = null;
    let coords: [number, number] | null = null;
    
    for (const loc of locations) {
      if (content.includes(loc.toLowerCase())) {
        location = loc;
        coords = extractLocationCoordinates(loc);
        break;
      }
    }
    
    if (!coords) return; // Skip if no location found
    
    // Determine actor
    let actor = 'unknown';
    if (content.includes('israel') || content.includes('idf')) actor = 'israel';
    else if (content.includes('iran') || content.includes('iranian')) actor = 'iran';
    else if (content.includes('us ') || content.includes('american') || content.includes('united states')) actor = 'us';
    
    criticalEvents.push({
      id: `critical-${eventType.toLowerCase()}-${idx}-${Date.now()}`,
      sourceEventId: null,
      actor,
      priority: severity === 'CRITICAL' ? 'P1' : 'P2',
      category: 'CRITICAL_EVENT' as const,
      type: eventType,
      status: 'ACTIVE',
      timestamp: article.publishedAt,
      name: article.title.slice(0, 80),
      position: coords,
      description: article.description || article.title,
      severity,
      source: article.source,
      url: article.url,
    });
  });
  
  return criticalEvents;
}
// Transform news into map heat points
export function transformNewsToHeatPoints(articles: NewsArticle[]) {
  const heatPoints: any[] = [];
  
  articles.forEach((article, idx) => {
    const content = (article.title + ' ' + article.description).toLowerCase();
    
    // Extract locations and create heat points
    const locations = ['Tehran', 'Jerusalem', 'Tel Aviv', 'Baghdad', 'Damascus', 'Beirut', 'Gaza', 'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Saudi Arabia'];
    
    for (const location of locations) {
      if (content.includes(location.toLowerCase())) {
        const coords = extractLocationCoordinates(location);
        if (coords) {
          // Weight based on severity keywords
          let weight = 1;
          if (content.includes('attack') || content.includes('strike') || content.includes('killed')) weight = 3;
          else if (content.includes('tension') || content.includes('military') || content.includes('threat')) weight = 2;
          
          heatPoints.push({
            id: `heat-${location}-${idx}-${Date.now()}`,
            sourceEventId: null,
            actor: 'news',
            priority: 'STANDARD',
            position: coords,
            weight,
          });
        }
      }
    }
  });

  return heatPoints;
}
