/**
 * Morocco Intelligence Analyzer
 * Comprehensive analysis of all events, infrastructure, and activities in Morocco
 * Provides government-level situational awareness
 */

import type { NewsArticle } from './api-clients/newsapi-client';

export type MoroccoEventType =
  | 'POLITICAL'
  | 'DIPLOMATIC'
  | 'ECONOMIC'
  | 'INFRASTRUCTURE'
  | 'WEATHER'
  | 'FIRE'
  | 'PROTEST'
  | 'ACCIDENT'
  | 'INVESTMENT'
  | 'TRADE'
  | 'TOURISM'
  | 'AGRICULTURE'
  | 'ENERGY'
  | 'SECURITY'
  | 'HEALTH'
  | 'EDUCATION'
  | 'TRANSPORT';

export type MoroccoEvent = {
  id: string;
  type: MoroccoEventType;
  title: string;
  description: string;
  location: string;
  position: [number, number];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  source: string;
  image?: string; // Article image
  impact: string;
  status: 'ONGOING' | 'RESOLVED' | 'MONITORING';
};

function stableId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function buildMoroccoEventId(article: NewsArticle, type: MoroccoEventType, location: string): string {
  const published = article.publishedAt || 'unknown-time';
  // @ts-ignore
  const source = article.source?.name || article.url || 'unknown-source';
  const title = article.title || '';
  return `morocco-event-${stableId(`${type}|${location}|${published}|${source}|${title}`)}`;
}

function jitterCoordinate(coord: [number, number], scatterRadius = 0.08): [number, number] {
  // Add random offset so multiple events in the same city don't stack perfectly on top of each other.
  const jitterX = (Math.random() - 0.5) * scatterRadius;
  const jitterY = (Math.random() - 0.5) * scatterRadius;
  return [coord[0] + jitterX, coord[1] + jitterY];
}

export type MoroccoConnection = {
  id: string;
  type: 'TRADE_ROUTE' | 'DIPLOMATIC' | 'TRANSPORT' | 'ENERGY' | 'MIGRATION';
  from: string;
  to: string;
  fromPosition: [number, number];
  toPosition: [number, number];
  status: 'ACTIVE' | 'DISRUPTED' | 'CLOSED';
  description: string;
  intensity: number;
};

export type MoroccoInfrastructure = {
  id: string;
  type: 'PORT' | 'AIRPORT' | 'ROAD' | 'RAILWAY' | 'POWER_PLANT' | 'MINE' | 'FACTORY';
  name: string;
  position: [number, number];
  status: 'OPERATIONAL' | 'DISRUPTED' | 'CLOSED' | 'UNDER_CONSTRUCTION';
  capacity?: string;
  description: string;
};

export type MoroccoWeatherAlert = {
  id: string;
  type: 'STORM' | 'DROUGHT' | 'FLOOD' | 'HEAT_WAVE' | 'COLD_WAVE' | 'WIND';
  location: string;
  position: [number, number];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  startTime: string;
  endTime?: string;
  affectedAreas: string[];
};

// Comprehensive Moroccan cities and locations with coordinates
const MOROCCO_CITIES: Record<string, [number, number]> = {
  // Major Cities
  'Rabat': [-6.8498, 33.9716],
  'Casablanca': [-7.5898, 33.5731],
  'Marrakech': [-7.9811, 31.6295],
  'Fes': [-5.0003, 34.0181],
  'Tangier': [-5.8134, 35.7595],
  'Agadir': [-9.5981, 30.4278],
  'Meknes': [-5.5471, 33.8935],
  'Oujda': [-1.9085, 34.6814],
  'Kenitra': [-6.5802, 34.2610],
  'Tetouan': [-5.3684, 35.5889],
  'Safi': [-9.2372, 32.2994],
  'El Jadida': [-8.5007, 33.2316],
  'Nador': [-2.9287, 35.1681],
  'Beni Mellal': [-6.3498, 32.3373],
  'Taza': [-4.0103, 34.2133],
  'Essaouira': [-9.7695, 31.5085],
  'Laayoune': [-13.1994, 27.1536],
  'Dakhla': [-15.9582, 23.7158],
  
  // Additional Major Cities
  'Mohammedia': [-7.3833, 33.6866],
  'Khouribga': [-6.9063, 32.8811],
  'Settat': [-7.6167, 33.0000],
  'Larache': [-6.1561, 35.1933],
  'Ksar El Kebir': [-5.9008, 35.0017],
  'Guelmim': [-10.0574, 28.9870],
  'Berrechid': [-7.5833, 33.2650],
  'Khemisset': [-6.0661, 33.8242],
  'Errachidia': [-4.4244, 31.9314],
  'Ouarzazate': [-6.9370, 30.9335],
  'Tiznit': [-9.7316, 29.6974],
  'Tan-Tan': [-11.1031, 28.4378],
  'Sidi Kacem': [-5.7089, 34.2214],
  'Sidi Slimane': [-5.9264, 34.2642],
  'Sidi Bennour': [-8.4278, 32.6497],
  'Taroudant': [-8.8778, 30.4728],
  'Al Hoceima': [-3.9317, 35.2517],
  'Chefchaouen': [-5.2686, 35.1686],
  'Azrou': [-5.2222, 33.4344],
  'Ifrane': [-5.1106, 33.5228],
  'Midelt': [-4.7372, 32.6800],
  'Zagora': [-5.8372, 30.3297],
  'Tinghir': [-5.5328, 31.5147],
  'Sefrou': [-4.8292, 33.8306],
  'Tiflet': [-6.3167, 33.8978],
  'Youssoufia': [-8.5297, 32.2453],
  'Bouarfa': [-1.9628, 32.5194],
  'Figuig': [-1.2289, 32.1089],
  
  // Regions (for broader area references)
  'Souss-Massa': [-9.5981, 30.4278],
  'Marrakech-Safi': [-7.9811, 31.6295],
  'Casablanca-Settat': [-7.5898, 33.5731],
  'Rabat-Sale-Kenitra': [-6.8498, 33.9716],
  'Fes-Meknes': [-5.0003, 34.0181],
  'Tangier-Tetouan-Al Hoceima': [-5.8134, 35.7595],
  'Oriental': [-1.9085, 34.6814],
  'Draa-Tafilalet': [-4.4244, 31.9314],
  'Beni Mellal-Khenifra': [-6.3498, 32.3373],
  
  // Strategic Areas
  'Rif Mountains': [-4.5000, 35.0000],
  'Atlas Mountains': [-7.9213, 31.0587],
  'Sahara': [-10.0000, 27.0000],
  'Western Sahara': [-13.0000, 24.0000],
  
  // DO NOT use generic Morocco as primary - only as last resort
  'Morocco': [-7.0926, 31.7917],
};

// Key infrastructure locations
const MOROCCO_INFRASTRUCTURE: MoroccoInfrastructure[] = [
  // Ports
  {
    id: 'port-tanger-med',
    type: 'PORT',
    name: 'Tanger Med Port',
    position: [-5.4167, 35.8667],
    status: 'OPERATIONAL',
    capacity: '9M TEU/year',
    description: 'Largest port in Africa and Mediterranean',
  },
  {
    id: 'port-casablanca',
    type: 'PORT',
    name: 'Port of Casablanca',
    position: [-7.6167, 33.6000],
    status: 'OPERATIONAL',
    capacity: '1.3M TEU/year',
    description: 'Major commercial port',
  },
  {
    id: 'port-agadir',
    type: 'PORT',
    name: 'Port of Agadir',
    position: [-9.6400, 30.4200],
    status: 'OPERATIONAL',
    description: 'Fishing and commercial port',
  },

  // Airports
  {
    id: 'airport-casablanca',
    type: 'AIRPORT',
    name: 'Mohammed V International Airport',
    position: [-7.5898, 33.3675],
    status: 'OPERATIONAL',
    capacity: '10M passengers/year',
    description: 'Largest airport in Morocco',
  },
  {
    id: 'airport-marrakech',
    type: 'AIRPORT',
    name: 'Marrakech Menara Airport',
    position: [-8.0363, 31.6069],
    status: 'OPERATIONAL',
    description: 'Major tourist gateway',
  },
  {
    id: 'airport-rabat',
    type: 'AIRPORT',
    name: 'Rabat-Salé Airport',
    position: [-6.7515, 34.0515],
    status: 'OPERATIONAL',
    description: 'Capital city airport',
  },

  // Energy
  {
    id: 'solar-noor',
    type: 'POWER_PLANT',
    name: 'Noor Solar Complex',
    position: [-6.9067, 31.0167],
    status: 'OPERATIONAL',
    capacity: '580 MW',
    description: 'World\'s largest concentrated solar power plant',
  },
  {
    id: 'wind-tarfaya',
    type: 'POWER_PLANT',
    name: 'Tarfaya Wind Farm',
    position: [-12.9333, 27.9333],
    status: 'OPERATIONAL',
    capacity: '301 MW',
    description: 'Major wind energy facility',
  },
];

// Detection patterns for Morocco-specific events
const MOROCCO_PATTERNS = {
  POLITICAL: [
    /morocco.*(?:government|parliament|election|minister|king|policy|vote|law|reform)/i,
    /rabat.*(?:decision|announce|statement|meeting|summit)/i,
    /moroccan.*(?:government|parliament|minister|official|authority)/i,
  ],

  DIPLOMATIC: [
    /morocco.*(?:embassy|ambassador|diplomatic|relations|visit|agreement|treaty|cooperation)/i,
    /morocco.*(?:france|spain|algeria|us|usa|china|saudi|germany|uk|eu|africa).*(?:ties|deal|cooperation|partnership|relations)/i,
    /moroccan.*(?:foreign|diplomatic|international)/i,
  ],

  ECONOMIC: [
    /morocco.*(?:economy|gdp|growth|investment|business|market|trade|export|import)/i,
    /casablanca.*(?:stock|finance|bank|business|economy)/i,
    /moroccan.*(?:economy|business|investment|trade)/i,
  ],

  INFRASTRUCTURE: [
    /morocco.*(?:road|highway|bridge|railway|construction|infrastructure|port|airport)/i,
    /morocco.*(?:build|develop|project|construction)/i,
    /moroccan.*(?:infrastructure|construction|development)/i,
  ],

  WEATHER: [
    /morocco.*(?:weather|storm|rain|flood|drought|temperature|climate|heat|cold)/i,
    /moroccan.*(?:weather|climate|storm|flood)/i,
  ],

  FIRE: [
    /morocco.*(?:fire|blaze|burning|wildfire|flames)/i,
    /moroccan.*(?:fire|wildfire)/i,
  ],

  PROTEST: [
    /morocco.*(?:protest|demonstration|rally|strike|march)/i,
    /moroccan.*(?:protest|demonstration|strike)/i,
  ],

  ACCIDENT: [
    /morocco.*(?:accident|crash|collision|incident|disaster)/i,
    /moroccan.*(?:accident|crash|incident)/i,
  ],

  INVESTMENT: [
    /morocco.*(?:investment|invest|funding|capital|project|billion|million)/i,
    /moroccan.*(?:investment|invest|funding)/i,
  ],

  TRADE: [
    /morocco.*(?:export|import|trade|customs|tariff|commerce)/i,
    /moroccan.*(?:export|import|trade)/i,
  ],

  TOURISM: [
    /morocco.*(?:tourism|tourist|visitor|hotel|travel|destination)/i,
    /marrakech.*(?:tourism|hotel|visitor|travel)/i,
    /moroccan.*(?:tourism|tourist|travel)/i,
  ],

  AGRICULTURE: [
    /morocco.*(?:agriculture|farming|crop|harvest|drought|farmer)/i,
    /moroccan.*(?:agriculture|farming|crop)/i,
  ],

  ENERGY: [
    /morocco.*(?:energy|power|electricity|solar|wind|renewable|oil|gas)/i,
    /moroccan.*(?:energy|power|renewable)/i,
  ],

  SECURITY: [
    /morocco.*(?:security|police|arrest|terror|crime|safety)/i,
    /moroccan.*(?:security|police|arrest)/i,
  ],

  TRANSPORT: [
    /morocco.*(?:transport|traffic|railway|train|bus|metro)/i,
    /moroccan.*(?:transport|railway|train)/i,
  ],

  HEALTH: [
    /morocco.*(?:health|hospital|medical|doctor|patient|disease|covid|vaccine)/i,
    /moroccan.*(?:health|hospital|medical)/i,
  ],

  EDUCATION: [
    /morocco.*(?:education|school|university|student|teacher|college)/i,
    /moroccan.*(?:education|school|university)/i,
  ],
};

/**
 * Analyze news articles for Morocco-specific intelligence
 */
export function analyzeMoroccoIntelligence(articles: NewsArticle[]): {
  events: MoroccoEvent[];
  connections: MoroccoConnection[];
  infrastructure: MoroccoInfrastructure[];
} {
  const events: MoroccoEvent[] = [];
  const connections: MoroccoConnection[] = [];

  console.log(`[Morocco Intel] Analyzing ${articles.length} articles for Morocco content`);

  // Process ALL articles - don't filter first
  let moroccoArticleCount = 0;

  articles.forEach((article, index) => {
    const content = `${article.title} ${article.description || ''}`.toLowerCase();
    const originalContent = `${article.title} ${article.description || ''}`;

    // Check if article is Morocco-related (more flexible matching)
    const isMoroccoRelated =
      content.includes('morocco') ||
      content.includes('moroccan') ||
      content.includes('maroc') ||  // French
      content.includes('rabat') ||
      content.includes('casablanca') ||
      content.includes('marrakech') ||
      content.includes('tangier') ||
      content.includes('maghreb') ||
      content.includes('maghrib');

    if (!isMoroccoRelated) {
      return; // Skip non-Morocco articles
    }

    moroccoArticleCount++;

    if (moroccoArticleCount <= 5) {
      console.log(`[Morocco Intel] Processing article ${moroccoArticleCount}: "${article.title}"`);
    }

    // SIMPLIFIED DETECTION: Check for keywords directly in content
    // This is more flexible than strict regex patterns
    let eventDetected = false;
    let detectedType: MoroccoEventType | null = null;

    // Check each event type with simpler keyword matching
    if (!eventDetected && (content.includes('government') || content.includes('parliament') || content.includes('minister') || content.includes('king') || content.includes('election') || content.includes('policy'))) {
      detectedType = 'POLITICAL';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('embassy') || content.includes('ambassador') || content.includes('diplomatic') || content.includes('relations') || content.includes('visit') || content.includes('agreement') || content.includes('treaty'))) {
      detectedType = 'DIPLOMATIC';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('economy') || content.includes('gdp') || content.includes('growth') || content.includes('business') || content.includes('market') || content.includes('stock'))) {
      detectedType = 'ECONOMIC';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('road') || content.includes('highway') || content.includes('bridge') || content.includes('railway') || content.includes('construction') || content.includes('infrastructure') || content.includes('port') || content.includes('airport'))) {
      detectedType = 'INFRASTRUCTURE';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('weather') || content.includes('storm') || content.includes('rain') || content.includes('flood') || content.includes('drought') || content.includes('temperature') || content.includes('climate'))) {
      detectedType = 'WEATHER';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('fire') || content.includes('blaze') || content.includes('burning') || content.includes('wildfire') || content.includes('flames') || content.includes('incendie'))) {
      detectedType = 'FIRE';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('protest') || content.includes('demonstration') || content.includes('rally') || content.includes('strike') || content.includes('march'))) {
      detectedType = 'PROTEST';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('accident') || content.includes('crash') || content.includes('collision') || content.includes('incident'))) {
      detectedType = 'ACCIDENT';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('investment') || content.includes('invest') || content.includes('funding') || content.includes('capital') || content.includes('billion') || content.includes('million'))) {
      detectedType = 'INVESTMENT';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('export') || content.includes('import') || content.includes('trade') || content.includes('customs') || content.includes('tariff'))) {
      detectedType = 'TRADE';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('tourism') || content.includes('tourist') || content.includes('visitor') || content.includes('hotel') || content.includes('travel'))) {
      detectedType = 'TOURISM';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('agriculture') || content.includes('farming') || content.includes('crop') || content.includes('harvest') || content.includes('farmer'))) {
      detectedType = 'AGRICULTURE';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('energy') || content.includes('power') || content.includes('electricity') || content.includes('solar') || content.includes('wind') || content.includes('renewable'))) {
      detectedType = 'ENERGY';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('security') || content.includes('police') || content.includes('arrest') || content.includes('terror') || content.includes('crime'))) {
      detectedType = 'SECURITY';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('transport') || content.includes('traffic') || content.includes('railway') || content.includes('train') || content.includes('bus') || content.includes('metro'))) {
      detectedType = 'TRANSPORT';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('health') || content.includes('hospital') || content.includes('medical') || content.includes('doctor') || content.includes('patient'))) {
      detectedType = 'HEALTH';
      eventDetected = true;
    }

    if (!eventDetected && (content.includes('education') || content.includes('school') || content.includes('university') || content.includes('student') || content.includes('teacher'))) {
      detectedType = 'EDUCATION';
      eventDetected = true;
    }

    if (eventDetected && detectedType) {
      // Extract location with improved algorithm
      const location = extractMoroccoLocation(originalContent);
      
      // Use the detected location or fallback to "Morocco" with random spread
      const finalLocation = location || 'Morocco';
      const basePosition = MOROCCO_CITIES[finalLocation];
      
      if (!basePosition) {
        // If somehow location not in database, use Morocco center
        console.warn(`[Morocco Intel] Location "${finalLocation}" not found in database, using Morocco center`);
        const fallbackPosition = MOROCCO_CITIES['Morocco'];
        if (!fallbackPosition) return; // Should never happen
        
        // Add random spread for unmapped locations
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 0.015; // ~1.7km
        const position: [number, number] = [
          fallbackPosition[0] + Math.cos(angle) * radius,
          fallbackPosition[1] + Math.sin(angle) * radius,
        ];
        
        try {
          events.push({
            id: buildMoroccoEventId(article, detectedType, 'Morocco'),
            type: detectedType,
            title: article.title,
            description: article.description || article.title,
            location: 'Morocco',
            position,
            severity: calculateSeverity(originalContent, detectedType),
            timestamp: article.publishedAt,
            source: article.url,
            image: (article as any).urlToImage || (article as any).image,
            impact: generateImpactDescription(detectedType, originalContent),
            status: determineStatus(originalContent),
          });
        } catch (error) {
          console.warn(`[Morocco Intel] Skipped event - error:`, error);
        }
        return;
      }

      // For specific cities: use exact coordinates
      // For generic "Morocco": add small random offset to prevent stacking
      let position: [number, number];
      if (location && location !== 'Morocco') {
        // Specific city detected - use EXACT coordinates (no offset)
        position = [basePosition[0], basePosition[1]];
      } else {
        // Generic Morocco - add small random spread (1.5km radius) to prevent stacking
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 0.013; // ~1.5km
        position = [
          basePosition[0] + Math.cos(angle) * radius,
          basePosition[1] + Math.sin(angle) * radius,
        ];
      }

      try {
        events.push({
          id: buildMoroccoEventId(article, detectedType, finalLocation),
          type: detectedType,
          title: article.title,
          description: article.description || article.title,
          location: finalLocation,
          position,
          severity: calculateSeverity(originalContent, detectedType),
          timestamp: article.publishedAt,
          source: article.url,
          image: (article as any).urlToImage || (article as any).image,
          impact: generateImpactDescription(detectedType, originalContent),
          status: determineStatus(originalContent),
        });

        if (moroccoArticleCount <= 5) {
          console.log(`[Morocco Intel]   → Detected ${detectedType} event in ${finalLocation}${(article as any).urlToImage || (article as any).image ? ' (with image)' : ''}`);
        }
      } catch (error) {
        console.warn(`[Morocco Intel] Skipped event - error creating event object:`, error);
      }

      // Detect international connections
      const foreignCountry = extractForeignCountry(originalContent);
      if (finalLocation && foreignCountry && (detectedType === 'DIPLOMATIC' || detectedType === 'ECONOMIC' || detectedType === 'TRADE')) {
        connections.push(createDiplomaticConnection(foreignCountry, article, detectedType as any));

        if (moroccoArticleCount <= 5) {
          console.log(`[Morocco Intel]   → Detected connection to ${foreignCountry}`);
        }
      }
    }
  });

  console.log(`[Morocco Intel] Processed ${moroccoArticleCount} Morocco-related articles`);

  // Add infrastructure status updates based on news
  const infrastructureWithStatus = updateInfrastructureStatus(MOROCCO_INFRASTRUCTURE, articles);

  console.log(`[Morocco Intel] Analysis complete: ${events.length} events, ${connections.length} connections`);
  if (events.length > 0) {
    console.log(`[Morocco Intel] Sample events:`, events.slice(0, 3).map(e => ({ type: e.type, location: e.location, title: e.title.substring(0, 50) })));
  }

  return {
    events,
    connections,
    infrastructure: infrastructureWithStatus,
  };
}

/**
 * Extract Moroccan city from text with improved accuracy
 */
function extractMoroccoLocation(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Remove common dateline patterns to avoid false positives
  // Example: "RABAT (Reuters) -" or "CASABLANCA:"
  const cleanText = lower
    .replace(/^(?:<[^>]+>\s*)*\s*(rabat|casablanca|marrakech|tangier|agadir|fes)\s*\([^)]*\)\s*[-:]\s*/i, ' ')
    .replace(/^(?:<[^>]+>\s*)*\s*(rabat|casablanca|marrakech|tangier|agadir|fes)\s*[-:]\s*/i, ' ');

  // Handle alternate spellings and common variations
  const spellingMap: Record<string, string> = {
    'marrakesh': 'Marrakech',
    'tanger': 'Tangier',
    'tangiers': 'Tangier',
    'fez': 'Fes',
    'fès': 'Fes',
    'meknès': 'Meknes',
    'meknas': 'Meknes',
    'ouarzazate': 'Ouarzazate',
    'aghadir': 'Agadir',
    'al-hoceima': 'Al Hoceima',
    'al hoceima': 'Al Hoceima',
    'alhucemas': 'Al Hoceima',
    'chaouen': 'Chefchaouen',
    'xauen': 'Chefchaouen',
    'el-jadida': 'El Jadida',
    'mazagan': 'El Jadida',
    'laayoune': 'Laayoune',
    'layoune': 'Laayoune',
    'el aaiun': 'Laayoune',
    'saidia': 'Oujda',
    'berkane': 'Oujda',
  };

  // Check alternate spellings first
  for (const [variant, canonical] of Object.entries(spellingMap)) {
    if (cleanText.includes(variant)) {
      return canonical;
    }
  }
  
  const foundCities: Array<{city: string; priority: number; index: number}> = [];
  
  for (const city of Object.keys(MOROCCO_CITIES)) {
    if (city === 'Morocco') continue; // Skip generic fallback
    
    const cityLower = city.toLowerCase();
    const index = cleanText.indexOf(cityLower);
    
    if (index !== -1) {
      // Calculate priority based on:
      // 1. Smaller/specific cities get MUCH higher priority (less likely to be false positive)
      // 2. Earlier mention in text gets boost (mentions in title/beginning more relevant)
      // 3. Avoid capitals that might just be government mentions
      let priority = 100 - index / 20; // Earlier = higher priority
      
      // MAJOR boost for smaller, specific cities (these are rarely mentioned unless truly relevant)
      const smallCities = ['Ifrane', 'Azrou', 'Chefchaouen', 'Essaouira', 'Ouarzazate', 'Zagora', 
                          'Tinghir', 'Tiznit', 'Sefrou', 'Midelt', 'Tiflet', 'Khemisset', 
                          'Al Hoceima', 'Taroudant', 'Guelmim', 'Tan-Tan', 'Errachidia'];
      if (smallCities.includes(city)) priority += 80; // HUGE boost
      
      // Medium boost for mid-size cities
      const midCities = ['Mohammedia', 'Khouribga', 'Settat', 'Larache', 'Ksar El Kebir', 
                        'Berrechid', 'Tetouan', 'Nador', 'Safi', 'El Jadida', 'Beni Mellal'];
      if (midCities.includes(city)) priority += 40;
      
      // Reduce priority for capitals/major cities that might be mentioned in datelines
      if (['Rabat', 'Casablanca'].includes(city)) priority -= 25;
      
      // Regions get much lower priority than cities
      if (city.includes('-') || city.includes('Mountains') || city.includes('Sahara') || city.includes('Region')) {
        priority -= 50;
      }
      
      // Boost if mentioned in title (first 60 chars)
      if (index < 60) priority += 35;
      
      // Check for strong context clues: "in [city]", "near [city]", "from [city]", "[city] area"
      const contextPattern = new RegExp(`(?:in|near|from|at|around)\\s+${cityLower}|${cityLower}\\s+(?:area|region|city)`, 'i');
      if (contextPattern.test(cleanText)) {
        priority += 60; // Strong context = high boost
      }
      
      foundCities.push({ city, priority, index });
    }
  }

  if (foundCities.length === 0) {
    // Try to extract from common patterns like "in [City]" or "near [City]"
    const nearPattern = /(?:in|near|at|from|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
    const matches = [...text.matchAll(nearPattern)];
    for (const match of matches) {
      const candidate = match[1];
      for (const city of Object.keys(MOROCCO_CITIES)) {
        if (city.toLowerCase() === candidate.toLowerCase()) {
          return city;
        }
      }
    }
    
    return null; // Return null = will use generic "Morocco" with spread
  }

  // Sort by priority and return highest
  foundCities.sort((a, b) => {
    // If priority difference is small, prefer earlier mention
    const priorityDiff = b.priority - a.priority;
    if (Math.abs(priorityDiff) < 10) {
      return a.index - b.index; // Earlier mention wins
    }
    return priorityDiff; // Higher priority wins
  });
  
  return foundCities[0].city;
}

/**
 * Extract foreign country mentioned with Morocco
 */
function extractForeignCountry(text: string): string | null {
  const countries = [
    'France', 'Spain', 'Algeria', 'United States', 'China', 'Saudi Arabia',
    'Germany', 'UK', 'Italy', 'Turkey', 'UAE', 'Qatar', 'Egypt',
  ];

  const lower = text.toLowerCase();
  for (const country of countries) {
    if (lower.includes(country.toLowerCase())) {
      return country;
    }
  }

  return null;
}

/**
 * Calculate event severity
 */
function calculateSeverity(content: string, type: MoroccoEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const lower = content.toLowerCase();

  // Critical keywords
  if (lower.includes('crisis') || lower.includes('emergency') || lower.includes('disaster')) {
    return 'CRITICAL';
  }

  // High severity keywords
  if (lower.includes('major') || lower.includes('significant') || lower.includes('serious')) {
    return 'HIGH';
  }

  // Type-specific severity
  if (type === 'FIRE' || type === 'ACCIDENT' || type === 'SECURITY') {
    return lower.includes('casualties') || lower.includes('deaths') ? 'CRITICAL' : 'HIGH';
  }

  if (type === 'WEATHER') {
    return lower.includes('severe') || lower.includes('extreme') ? 'HIGH' : 'MEDIUM';
  }

  if (type === 'PROTEST') {
    return lower.includes('violent') || lower.includes('clash') ? 'HIGH' : 'MEDIUM';
  }

  return 'MEDIUM';
}

/**
 * Generate impact description
 */
function generateImpactDescription(type: MoroccoEventType, content: string): string {
  const lower = content.toLowerCase();

  switch (type) {
    case 'POLITICAL':
      return 'May affect government policy and decision-making';
    case 'DIPLOMATIC':
      return 'Impacts international relations and cooperation';
    case 'ECONOMIC':
      return lower.includes('billion') ? 'Major economic impact' : 'Moderate economic impact';
    case 'INFRASTRUCTURE':
      return 'Affects transportation and logistics';
    case 'WEATHER':
      return 'May disrupt daily activities and agriculture';
    case 'FIRE':
      return 'Risk to life and property';
    case 'PROTEST':
      return 'May cause traffic disruptions and security concerns';
    case 'INVESTMENT':
      return 'Positive economic development';
    case 'TRADE':
      return 'Affects import/export activities';
    case 'TOURISM':
      return 'Impacts tourism sector and economy';
    case 'ENERGY':
      return 'Affects power supply and energy security';
    case 'TRANSPORT':
      return 'May cause delays and disruptions';
    default:
      return 'Monitoring situation';
  }
}

/**
 * Determine event status
 */
function determineStatus(content: string): 'ONGOING' | 'RESOLVED' | 'MONITORING' {
  const lower = content.toLowerCase();

  if (lower.includes('ongoing') || lower.includes('continues') || lower.includes('still')) {
    return 'ONGOING';
  }

  if (lower.includes('resolved') || lower.includes('ended') || lower.includes('completed')) {
    return 'RESOLVED';
  }

  return 'MONITORING';
}

/**
 * Create diplomatic/economic connection
 */
function createDiplomaticConnection(foreignCountry: string, article: NewsArticle, type: 'DIPLOMATIC' | 'ECONOMIC' | 'TRADE' = 'DIPLOMATIC'): MoroccoConnection {
  // Get foreign country coordinates (simplified)
  const foreignCoords: Record<string, [number, number]> = {
    'France': [2.3522, 48.8566],
    'Spain': [-3.7038, 40.4168],
    'Algeria': [3.0588, 36.7538],
    'United States': [-77.0369, 38.9072],
    'China': [116.4074, 39.9042],
    'Saudi Arabia': [46.6753, 24.7136],
    'Germany': [13.4050, 52.5200],
    'UK': [-0.1278, 51.5074],
    'Italy': [12.4964, 41.9028],
    'UAE': [54.3773, 24.4539],
    'Qatar': [51.5310, 25.2854],
    'Turkey': [32.8597, 39.9334],
    'Egypt': [31.2357, 30.0444],
    'Tunisia': [10.1815, 36.8065],
    'Libya': [13.1913, 32.8872],
    'Mauritania': [-15.9785, 18.0735],
    'Senegal': [-17.4677, 14.7167],
    'Mali': [-7.9889, 12.6392],
    'Nigeria': [7.5629, 9.0765],
    'South Africa': [28.0473, -26.2041],
    'Japan': [139.6917, 35.6762],
    'South Korea': [126.9780, 37.5665],
    'India': [77.2090, 28.6139],
    'Brazil': [-47.8825, -15.7942],
    'Canada': [-75.6972, 45.4215],
    'Mexico': [-99.1332, 19.4326],
    'Russia': [37.6173, 55.7558],
  };

  const connectionType = type === 'TRADE' ? 'TRADE_ROUTE' : type === 'ECONOMIC' ? 'ECONOMIC' : 'DIPLOMATIC';

  return {
    id: `morocco-connection-${Date.now()}-${Math.random()}`,
    type: connectionType as any,
    from: 'Rabat',
    to: foreignCountry,
    fromPosition: MOROCCO_CITIES['Rabat'],
    toPosition: foreignCoords[foreignCountry] || [0, 0],
    status: 'ACTIVE',
    description: article.title,
    intensity: 7,
  };
}

/**
 * Update infrastructure status based on news
 */
function updateInfrastructureStatus(
  infrastructure: MoroccoInfrastructure[],
  articles: NewsArticle[]
): MoroccoInfrastructure[] {
  return infrastructure.map(infra => {
    // Check if any article mentions this infrastructure
    const mentioned = articles.some(article => {
      const content = `${article.title} ${article.description}`.toLowerCase();
      return content.includes(infra.name.toLowerCase());
    });

    // If mentioned, check for status keywords
    if (mentioned) {
      const relevantArticle = articles.find(article => {
        const content = `${article.title} ${article.description}`.toLowerCase();
        return content.includes(infra.name.toLowerCase());
      });

      if (relevantArticle) {
        const content = `${relevantArticle.title} ${relevantArticle.description}`.toLowerCase();

        if (content.includes('closed') || content.includes('shutdown')) {
          return { ...infra, status: 'CLOSED' as const };
        }
        if (content.includes('disrupted') || content.includes('delayed')) {
          return { ...infra, status: 'DISRUPTED' as const };
        }
        if (content.includes('construction') || content.includes('building')) {
          return { ...infra, status: 'UNDER_CONSTRUCTION' as const };
        }
      }
    }

    return infra;
  });
}

/**
 * Generate weather alerts for Morocco (mock data - would integrate with weather API)
 */
export function generateMoroccoWeatherAlerts(): MoroccoWeatherAlert[] {
  // This would integrate with a real weather API
  // For now, return empty array - will be populated by real weather data
  return [];
}
