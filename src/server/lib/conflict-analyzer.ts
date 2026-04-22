/**
 * Conflict Relationship Analyzer
 * Analyzes news articles to detect country-to-country conflicts
 */

import type { NewsArticle } from './api-clients/newsapi-client';

export type ConflictRelationship = {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  sourcePosition: [number, number];
  targetPosition: [number, number];
  intensity: number; // 1-10
  type: 'MILITARY' | 'DIPLOMATIC' | 'ECONOMIC';
  description: string;
  timestamp: string;
  articles: string[]; // URLs
};

// Country coordinates (capitals)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // Middle East
  'Iran': [51.3890, 35.6892],
  'Israel': [35.2137, 31.7683],
  'Syria': [36.2765, 33.5138],
  'Lebanon': [35.4955, 33.8886],
  'Iraq': [44.3661, 33.3152],
  'Yemen': [44.2075, 15.5527],
  'Saudi Arabia': [46.6753, 24.7136],
  'Turkey': [32.8597, 39.9334],
  'Egypt': [31.2357, 30.0444],
  'Jordan': [35.9239, 31.9454],
  'UAE': [54.3773, 24.4539],
  'Qatar': [51.5310, 25.2854],
  'Kuwait': [47.9774, 29.3759],
  'Bahrain': [50.5577, 26.0667],
  'Oman': [58.4059, 23.5880],
  'Afghanistan': [69.2075, 34.5553],
  'Pakistan': [73.0479, 33.6844],
  
  // Major Powers
  'United States': [-77.0369, 38.9072],
  'Russia': [37.6173, 55.7558],
  'China': [116.4074, 39.9042],
  
  // Europe
  'UK': [-0.1278, 51.5074],
  'France': [2.3522, 48.8566],
  'Germany': [13.4050, 52.5200],
  'Italy': [12.4964, 41.9028],
  'Spain': [-3.7038, 40.4168],
  'Poland': [21.0122, 52.2297],
  'Ukraine': [30.5234, 50.4501],
  'Netherlands': [4.8952, 52.3702],
  'Belgium': [4.3517, 50.8503],
  'Greece': [23.7275, 37.9838],
  
  // Asia-Pacific
  'India': [77.2090, 28.6139],
  'Japan': [139.6917, 35.6762],
  'South Korea': [126.9780, 37.5665],
  'North Korea': [125.7625, 39.0392],
  'Taiwan': [121.5654, 25.0330],
  'Vietnam': [105.8342, 21.0278],
  'Thailand': [100.5018, 13.7563],
  'Philippines': [120.9842, 14.5995],
  'Indonesia': [106.8456, -6.2088],
  'Malaysia': [101.6869, 3.1390],
  'Singapore': [103.8198, 1.3521],
  'Australia': [149.1300, -35.2809],
  
  // Americas
  'Canada': [-75.6972, 45.4215],
  'Mexico': [-99.1332, 19.4326],
  'Brazil': [-47.8825, -15.7942],
  'Argentina': [-58.3816, -34.6037],
  'Venezuela': [-66.9036, 10.4806],
  'Cuba': [-82.3666, 23.1136],
  'Colombia': [-74.0721, 4.7110],
  'Chile': [-70.6693, -33.4489],
  
  // Africa
  'Libya': [13.1913, 32.8872],
  'Sudan': [32.5599, 15.5007],
  'Ethiopia': [38.7469, 9.0320],
  'Somalia': [45.3182, 2.0469],
  'Nigeria': [7.5629, 9.0765],
  'South Africa': [28.0473, -26.2041],
  'Kenya': [36.8219, -1.2921],
  'Algeria': [3.0588, 36.7538],
  'Morocco': [-6.8498, 33.9716],
  'Tunisia': [10.1815, 36.8065],
};

// Conflict detection patterns
const CONFLICT_PATTERNS = {
  MILITARY: [
    /(\w+)\s+(?:attacks?|strikes?|bombs?|raids?|invades?|assaults?)\s+(\w+)/i,
    /(\w+)\s+(?:launches?|fires?)\s+(?:missiles?|rockets?)\s+(?:at|into|toward)\s+(\w+)/i,
    /(\w+)\s+(?:military|forces?|troops)\s+(?:in|against)\s+(\w+)/i,
    /(\w+)\s+(?:airstrikes?|bombardment)\s+(?:on|in)\s+(\w+)/i,
  ],
  DIPLOMATIC: [
    /(\w+)\s+(?:sanctions?|condemns?|criticizes?|warns?)\s+(\w+)/i,
    /(\w+)\s+(?:tensions?|dispute|conflict)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:breaks?|suspends?)\s+(?:ties|relations)\s+(?:with)\s+(\w+)/i,
  ],
  ECONOMIC: [
    /(\w+)\s+(?:sanctions?|embargo|trade\s+war)\s+(?:on|against)\s+(\w+)/i,
    /(\w+)\s+(?:cuts?|halts?)\s+(?:trade|exports?|imports?)\s+(?:to|from)\s+(\w+)/i,
  ],
};

/**
 * Analyze news articles for conflict relationships
 */
export function analyzeConflictRelationships(articles: NewsArticle[]): ConflictRelationship[] {
  const relationships = new Map<string, ConflictRelationship>();
  
  articles.forEach(article => {
    const content = `${article.title} ${article.description}`;
    
    // Try each conflict type
    for (const [type, patterns] of Object.entries(CONFLICT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const source = normalizeCountryName(match[1]);
          const target = normalizeCountryName(match[2]);
          
          if (source && target && COUNTRY_COORDS[source] && COUNTRY_COORDS[target]) {
            const key = `${source}-${target}`;
            
            if (relationships.has(key)) {
              // Increase intensity for repeated mentions
              const existing = relationships.get(key)!;
              existing.intensity = Math.min(10, existing.intensity + 1);
              existing.articles.push(article.url);
            } else {
              // Create new relationship
              relationships.set(key, {
                id: `conflict-${key}-${Date.now()}`,
                sourceCountry: source,
                targetCountry: target,
                sourcePosition: COUNTRY_COORDS[source],
                targetPosition: COUNTRY_COORDS[target],
                intensity: calculateIntensity(content, type as any),
                type: type as 'MILITARY' | 'DIPLOMATIC' | 'ECONOMIC',
                description: article.title,
                timestamp: article.publishedAt,
                articles: [article.url],
              });
            }
          }
        }
      }
    }
  });
  
  return Array.from(relationships.values());
}

/**
 * Normalize country names from text
 */
function normalizeCountryName(name: string): string | null {
  const normalized = name.trim();
  
  // Direct matches
  if (COUNTRY_COORDS[normalized]) return normalized;
  
  // Common variations
  const variations: Record<string, string> = {
    'US': 'United States',
    'USA': 'United States',
    'America': 'United States',
    'American': 'United States',
    'Israeli': 'Israel',
    'IDF': 'Israel',
    'Iranian': 'Iran',
    'Tehran': 'Iran',
    'Russian': 'Russia',
    'Moscow': 'Russia',
    'Syrian': 'Syria',
    'Damascus': 'Syria',
    'Lebanese': 'Lebanon',
    'Beirut': 'Lebanon',
    'Iraqi': 'Iraq',
    'Baghdad': 'Iraq',
    'Yemeni': 'Yemen',
    'Houthi': 'Yemen',
    'Saudi': 'Saudi Arabia',
    'Riyadh': 'Saudi Arabia',
    'Turkish': 'Turkey',
    'Ankara': 'Turkey',
    'Egyptian': 'Egypt',
    'Cairo': 'Egypt',
    'Chinese': 'China',
    'Beijing': 'China',
    'British': 'UK',
    'London': 'UK',
    'French': 'France',
    'Paris': 'France',
    'German': 'Germany',
    'Berlin': 'Germany',
  };
  
  return variations[normalized] || null;
}

/**
 * Calculate conflict intensity based on keywords
 */
function calculateIntensity(content: string, type: 'MILITARY' | 'DIPLOMATIC' | 'ECONOMIC'): number {
  const lower = content.toLowerCase();
  let intensity = 3; // Base intensity
  
  // Military conflicts are more intense
  if (type === 'MILITARY') {
    intensity = 7;
    if (lower.includes('war') || lower.includes('invasion')) intensity = 10;
    if (lower.includes('killed') || lower.includes('casualties')) intensity = Math.min(10, intensity + 2);
    if (lower.includes('missile') || lower.includes('airstrike')) intensity = Math.min(10, intensity + 1);
  }
  
  // Diplomatic tensions
  if (type === 'DIPLOMATIC') {
    intensity = 4;
    if (lower.includes('crisis') || lower.includes('escalation')) intensity = 6;
    if (lower.includes('war') || lower.includes('threat')) intensity = 7;
  }
  
  // Economic conflicts
  if (type === 'ECONOMIC') {
    intensity = 5;
    if (lower.includes('embargo') || lower.includes('blockade')) intensity = 7;
  }
  
  return Math.min(10, intensity);
}
