/**
 * Morocco-Specific OSINT Data Client
 * Aggregates Morocco-related intelligence from multiple sources
 */

import { newsAPIClient } from './newsapi-client';

export type MoroccoData = {
  news: Array<{
    id: string;
    title: string;
    description: string;
    source: string;
    url: string;
    publishedAt: string;
    category: 'POLITICS' | 'ECONOMY' | 'SECURITY' | 'TECH' | 'GENERAL';
  }>;
  keyLocations: Array<{
    id: string;
    name: string;
    type: 'CITY' | 'PORT' | 'AIRPORT' | 'MILITARY' | 'INFRASTRUCTURE';
    position: [number, number];
    description: string;
    status: 'ACTIVE' | 'ALERT' | 'NORMAL';
  }>;
  economicIndicators: {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    tradeBalance: string;
  };
  securityAlerts: Array<{
    id: string;
    type: 'BORDER' | 'MARITIME' | 'CYBER' | 'TERRORISM';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location: string;
    description: string;
    timestamp: string;
  }>;
};

// Key Morocco locations
const MOROCCO_LOCATIONS = [
  {
    id: 'rabat',
    name: 'Rabat',
    type: 'CITY' as const,
    position: [-6.8498, 33.9716] as [number, number],
    description: 'Capital city and political center',
    status: 'NORMAL' as const,
  },
  {
    id: 'casablanca',
    name: 'Casablanca',
    type: 'CITY' as const,
    position: [-7.5898, 33.5731] as [number, number],
    description: 'Economic hub and largest city',
    status: 'NORMAL' as const,
  },
  {
    id: 'tangier-port',
    name: 'Tanger-Med Port',
    type: 'PORT' as const,
    position: [-5.4167, 35.7500] as [number, number],
    description: 'Largest port in Africa and Mediterranean',
    status: 'ACTIVE' as const,
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    type: 'CITY' as const,
    position: [-7.9811, 31.6295] as [number, number],
    description: 'Major tourist and cultural center',
    status: 'NORMAL' as const,
  },
  {
    id: 'mohammed-v-airport',
    name: 'Mohammed V International Airport',
    type: 'AIRPORT' as const,
    position: [-7.5898, 33.3675] as [number, number],
    description: 'Main international airport',
    status: 'ACTIVE' as const,
  },
  {
    id: 'agadir',
    name: 'Agadir',
    type: 'CITY' as const,
    position: [-9.5981, 30.4278] as [number, number],
    description: 'Atlantic coast port and resort city',
    status: 'NORMAL' as const,
  },
  {
    id: 'western-sahara',
    name: 'Western Sahara Border',
    type: 'MILITARY' as const,
    position: [-13.0, 24.0] as [number, number],
    description: 'Disputed territory border region',
    status: 'ALERT' as const,
  },
  {
    id: 'ceuta-border',
    name: 'Ceuta Border',
    type: 'INFRASTRUCTURE' as const,
    position: [-5.3213, 35.8894] as [number, number],
    description: 'Spanish enclave border crossing',
    status: 'NORMAL' as const,
  },
];

/**
 * Fetch Morocco-specific news
 */
export async function fetchMoroccoNews() {
  try {
    const articles = await newsAPIClient.searchNews(
      'Morocco OR Maroc OR Rabat OR Casablanca OR Tangier',
      30,
      'en'
    );

    return articles.map(article => {
      // Categorize based on keywords
      let category: 'POLITICS' | 'ECONOMY' | 'SECURITY' | 'TECH' | 'GENERAL' = 'GENERAL';
      const content = `${article.title} ${article.description}`.toLowerCase();
      
      if (content.match(/king|government|parliament|election|diplomatic|minister/)) {
        category = 'POLITICS';
      } else if (content.match(/economy|trade|export|import|investment|business|gdp/)) {
        category = 'ECONOMY';
      } else if (content.match(/security|military|border|police|terrorism|conflict/)) {
        category = 'SECURITY';
      } else if (content.match(/tech|digital|innovation|startup|ai|cyber/)) {
        category = 'TECH';
      }

      return {
        id: article.url,
        title: article.title,
        description: article.description || '',
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        category,
      };
    });
  } catch (error) {
    console.error('Failed to fetch Morocco news:', error);
    return [];
  }
}

/**
 * Get Morocco key locations
 */
export function getMoroccoLocations() {
  return MOROCCO_LOCATIONS;
}

/**
 * Get Morocco economic indicators (simulated - would use World Bank API in production)
 */
export function getMoroccoEconomicIndicators() {
  return {
    gdpGrowth: 3.2, // % (2024 estimate)
    inflation: 6.1, // % (2024)
    unemployment: 11.8, // % (2024)
    tradeBalance: '-$25.3B', // Trade deficit
  };
}

/**
 * Generate Morocco security alerts (based on real-time analysis)
 */
export async function getMoroccoSecurityAlerts() {
  try {
    // Fetch security-related news
    const articles = await newsAPIClient.searchNews(
      'Morocco (security OR border OR military OR terrorism OR cyber)',
      10,
      'en'
    );

    const alerts = articles.slice(0, 5).map((article, i) => {
      const content = `${article.title} ${article.description}`.toLowerCase();
      
      let type: 'BORDER' | 'MARITIME' | 'CYBER' | 'TERRORISM' = 'BORDER';
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
      
      if (content.match(/cyber|hack|breach/)) {
        type = 'CYBER';
        severity = 'HIGH';
      } else if (content.match(/maritime|sea|port|ship/)) {
        type = 'MARITIME';
      } else if (content.match(/terror|attack|threat/)) {
        type = 'TERRORISM';
        severity = 'HIGH';
      } else if (content.match(/border|crossing|migration/)) {
        type = 'BORDER';
      }

      return {
        id: `alert-${i}`,
        type,
        severity,
        location: extractLocation(article.title) || 'Morocco',
        description: article.title,
        timestamp: article.publishedAt,
      };
    });

    return alerts;
  } catch (error) {
    console.error('Failed to fetch Morocco security alerts:', error);
    return [];
  }
}

/**
 * Extract location from text
 */
function extractLocation(text: string): string | null {
  const locations = ['Rabat', 'Casablanca', 'Tangier', 'Marrakech', 'Agadir', 'Fez', 'Western Sahara', 'Ceuta', 'Melilla'];
  for (const loc of locations) {
    if (text.includes(loc)) return loc;
  }
  return null;
}

/**
 * Fetch all Morocco data
 */
export async function fetchMoroccoData(): Promise<MoroccoData> {
  const [news, securityAlerts] = await Promise.allSettled([
    fetchMoroccoNews(),
    getMoroccoSecurityAlerts(),
  ]);

  return {
    news: news.status === 'fulfilled' ? news.value : [],
    keyLocations: getMoroccoLocations(),
    economicIndicators: getMoroccoEconomicIndicators(),
    securityAlerts: securityAlerts.status === 'fulfilled' ? securityAlerts.value : [],
  };
}
