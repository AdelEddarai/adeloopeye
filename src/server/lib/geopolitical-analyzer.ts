/**
 * Comprehensive Geopolitical Relationship Analyzer
 * Analyzes multiple types of country-to-country relationships:
 * - Military conflicts
 * - Trade routes & economic partnerships
 * - Diplomatic relations & alliances
 * - Supply chains & logistics
 * - Energy dependencies
 * - Migration flows
 */

import type { NewsArticle } from './api-clients/newsapi-client';

export type RelationshipType = 
  | 'MILITARY_CONFLICT'
  | 'TRADE_ROUTE'
  | 'ALLIANCE'
  | 'DIPLOMATIC_TENSION'
  | 'SUPPLY_CHAIN'
  | 'ENERGY_DEPENDENCY'
  | 'MIGRATION_FLOW'
  | 'ECONOMIC_PARTNERSHIP';

export type GeopoliticalRelationship = {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  sourcePosition: [number, number];
  targetPosition: [number, number];
  intensity: number; // 1-10
  type: RelationshipType;
  description: string;
  timestamp: string;
  articles: string[]; // URLs
  bidirectional?: boolean; // For trade, alliances, etc.
};

// Country coordinates (capitals) - EXPANDED
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
  'Norway': [10.7522, 59.9139],
  'Sweden': [18.0686, 59.3293],
  'Finland': [24.9384, 60.1699],
  
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
  'New Zealand': [174.7633, -41.2865],
  
  // Americas
  'Canada': [-75.6972, 45.4215],
  'Mexico': [-99.1332, 19.4326],
  'Brazil': [-47.8825, -15.7942],
  'Argentina': [-58.3816, -34.6037],
  'Venezuela': [-66.9036, 10.4806],
  'Cuba': [-82.3666, 23.1136],
  'Colombia': [-74.0721, 4.7110],
  'Chile': [-70.6693, -33.4489],
  'Peru': [-77.0428, -12.0464],
  
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
  'Ghana': [-0.1870, 5.6037],
};

// Detection patterns for different relationship types
const RELATIONSHIP_PATTERNS = {
  MILITARY_CONFLICT: [
    /(\w+)\s+(?:attacks?|strikes?|bombs?|raids?|invades?|assaults?)\s+(\w+)/i,
    /(\w+)\s+(?:launches?|fires?)\s+(?:missiles?|rockets?)\s+(?:at|into|toward)\s+(\w+)/i,
    /(\w+)\s+(?:military|forces?|troops)\s+(?:in|against)\s+(\w+)/i,
    /(\w+)\s+(?:airstrikes?|bombardment)\s+(?:on|in)\s+(\w+)/i,
    /(\w+)\s+(?:war|conflict|combat)\s+(?:with|against)\s+(\w+)/i,
  ],
  
  TRADE_ROUTE: [
    /(\w+)\s+(?:exports?|imports?|trades?)\s+(?:with|to|from)\s+(\w+)/i,
    /(\w+)\s+(?:trade\s+deal|trade\s+agreement)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:shipping|cargo|goods)\s+(?:to|from)\s+(\w+)/i,
    /(\w+)\s+(?:bilateral\s+trade)\s+(?:with)\s+(\w+)/i,
  ],
  
  ALLIANCE: [
    /(\w+)\s+(?:allies?|partners?|coalition)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:supports?|backs?|defends?)\s+(\w+)/i,
    /(\w+)\s+(?:treaty|pact|agreement)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:NATO|alliance)\s+(?:with|member)\s+(\w+)/i,
  ],
  
  DIPLOMATIC_TENSION: [
    /(\w+)\s+(?:sanctions?|condemns?|criticizes?|warns?)\s+(\w+)/i,
    /(\w+)\s+(?:tensions?|dispute|rift)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:breaks?|suspends?)\s+(?:ties|relations)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:expels?|recalls?)\s+(?:ambassador|diplomat)\s+(?:from|to)\s+(\w+)/i,
  ],
  
  SUPPLY_CHAIN: [
    /(\w+)\s+(?:supplies?|provides?|delivers?)\s+(?:to)\s+(\w+)/i,
    /(\w+)\s+(?:manufacturing|production)\s+(?:in|from)\s+(\w+)/i,
    /(\w+)\s+(?:supply\s+chain|logistics)\s+(?:with|to|from)\s+(\w+)/i,
  ],
  
  ENERGY_DEPENDENCY: [
    /(\w+)\s+(?:oil|gas|energy)\s+(?:from|to)\s+(\w+)/i,
    /(\w+)\s+(?:pipeline|LNG)\s+(?:to|from)\s+(\w+)/i,
    /(\w+)\s+(?:energy\s+deal|gas\s+deal)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:depends?\s+on)\s+(\w+)\s+(?:for\s+energy|for\s+oil|for\s+gas)/i,
  ],
  
  MIGRATION_FLOW: [
    /(\w+)\s+(?:refugees?|migrants?|asylum)\s+(?:to|from|in)\s+(\w+)/i,
    /(\w+)\s+(?:immigration|emigration)\s+(?:to|from)\s+(\w+)/i,
    /(\w+)\s+(?:border|crossing)\s+(?:with|to|from)\s+(\w+)/i,
  ],
  
  ECONOMIC_PARTNERSHIP: [
    /(\w+)\s+(?:investment|invests?)\s+(?:in)\s+(\w+)/i,
    /(\w+)\s+(?:economic\s+cooperation|partnership)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:FDI|foreign\s+investment)\s+(?:in|to)\s+(\w+)/i,
  ],
};

/**
 * Analyze news articles for all types of geopolitical relationships
 */
export function analyzeGeopoliticalRelationships(articles: NewsArticle[]): GeopoliticalRelationship[] {
  const relationships = new Map<string, GeopoliticalRelationship>();
  
  articles.forEach(article => {
    const content = `${article.title} ${article.description}`;
    
    // Try each relationship type
    for (const [type, patterns] of Object.entries(RELATIONSHIP_PATTERNS)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const source = normalizeCountryName(match[1]);
          const target = normalizeCountryName(match[2]);
          
          if (source && target && COUNTRY_COORDS[source] && COUNTRY_COORDS[target]) {
            // For bidirectional relationships (trade, alliances), use sorted key
            const isBidirectional = ['TRADE_ROUTE', 'ALLIANCE', 'ECONOMIC_PARTNERSHIP'].includes(type);
            const key = isBidirectional && source > target 
              ? `${target}-${source}-${type}`
              : `${source}-${target}-${type}`;
            
            if (relationships.has(key)) {
              // Increase intensity for repeated mentions
              const existing = relationships.get(key)!;
              existing.intensity = Math.min(10, existing.intensity + 1);
              existing.articles.push(article.url);
            } else {
              // Create new relationship
              relationships.set(key, {
                id: `geo-${key}-${Date.now()}`,
                sourceCountry: source,
                targetCountry: target,
                sourcePosition: COUNTRY_COORDS[source],
                targetPosition: COUNTRY_COORDS[target],
                intensity: calculateIntensity(content, type as RelationshipType),
                type: type as RelationshipType,
                description: article.title,
                timestamp: article.publishedAt,
                articles: [article.url],
                bidirectional: isBidirectional,
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
    'Ukrainian': 'Ukraine',
    'Kyiv': 'Ukraine',
    'Indian': 'India',
    'Delhi': 'India',
    'Japanese': 'Japan',
    'Tokyo': 'Japan',
    'Korean': 'South Korea',
    'Seoul': 'South Korea',
  };
  
  return variations[normalized] || null;
}

/**
 * Calculate relationship intensity based on keywords and type
 */
function calculateIntensity(content: string, type: RelationshipType): number {
  const lower = content.toLowerCase();
  let intensity = 3; // Base intensity
  
  switch (type) {
    case 'MILITARY_CONFLICT':
      intensity = 7;
      if (lower.includes('war') || lower.includes('invasion')) intensity = 10;
      if (lower.includes('killed') || lower.includes('casualties')) intensity = Math.min(10, intensity + 2);
      if (lower.includes('missile') || lower.includes('airstrike')) intensity = Math.min(10, intensity + 1);
      break;
      
    case 'DIPLOMATIC_TENSION':
      intensity = 4;
      if (lower.includes('crisis') || lower.includes('escalation')) intensity = 6;
      if (lower.includes('war') || lower.includes('threat')) intensity = 7;
      if (lower.includes('breaks ties') || lower.includes('expels')) intensity = 8;
      break;
      
    case 'TRADE_ROUTE':
      intensity = 5;
      if (lower.includes('billion') || lower.includes('major')) intensity = 7;
      if (lower.includes('largest') || lower.includes('record')) intensity = 8;
      break;
      
    case 'ALLIANCE':
      intensity = 6;
      if (lower.includes('nato') || lower.includes('treaty')) intensity = 8;
      if (lower.includes('defense') || lower.includes('military')) intensity = 9;
      break;
      
    case 'SUPPLY_CHAIN':
      intensity = 5;
      if (lower.includes('critical') || lower.includes('essential')) intensity = 7;
      if (lower.includes('shortage') || lower.includes('disruption')) intensity = 8;
      break;
      
    case 'ENERGY_DEPENDENCY':
      intensity = 6;
      if (lower.includes('pipeline') || lower.includes('major')) intensity = 8;
      if (lower.includes('cuts') || lower.includes('halts')) intensity = 9;
      break;
      
    case 'MIGRATION_FLOW':
      intensity = 4;
      if (lower.includes('crisis') || lower.includes('thousands')) intensity = 6;
      if (lower.includes('millions') || lower.includes('mass')) intensity = 8;
      break;
      
    case 'ECONOMIC_PARTNERSHIP':
      intensity = 5;
      if (lower.includes('billion') || lower.includes('major')) intensity = 7;
      if (lower.includes('strategic') || lower.includes('landmark')) intensity = 8;
      break;
  }
  
  return Math.min(10, intensity);
}

// Export for backward compatibility
export type ConflictRelationship = GeopoliticalRelationship;
export const analyzeConflictRelationships = analyzeGeopoliticalRelationships;
