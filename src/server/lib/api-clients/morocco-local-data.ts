/**
 * Morocco Local Data Client
 * Fetches weather, traffic, commodities, fires, and other local data
 */

export type MoroccoWeather = {
  city: string;
  position: [number, number];
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  alert?: {
    type: 'HEAT' | 'STORM' | 'WIND' | 'RAIN' | 'COLD';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  };
};

export type MoroccoTraffic = {
  id: string;
  type: 'ACCIDENT' | 'CONGESTION' | 'ROAD_CLOSED' | 'CONSTRUCTION' | 'INCIDENT';
  location: string;
  position: [number, number];
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  timestamp: string;
};

export type MoroccoCommodity = {
  name: string;
  category: 'AGRICULTURE' | 'ENERGY' | 'MINERALS' | 'FOOD';
  price: number;
  unit: string;
  change: number; // Percentage change
  market: string;
  timestamp: string;
};

export type MoroccoFire = {
  id: string;
  location: string;
  position: [number, number];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  area: number; // Hectares
  status: 'ACTIVE' | 'CONTAINED' | 'EXTINGUISHED';
  description: string;
  timestamp: string;
  image?: string;
  brightness?: number; // Fire brightness from satellite
  confidence?: number; // Detection confidence %
};

// Major Moroccan cities for weather
const MOROCCO_CITIES = [
  { name: 'Rabat', position: [-6.8498, 33.9716] as [number, number] },
  { name: 'Casablanca', position: [-7.5898, 33.5731] as [number, number] },
  { name: 'Marrakech', position: [-7.9811, 31.6295] as [number, number] },
  { name: 'Fes', position: [-5.0003, 34.0181] as [number, number] },
  { name: 'Tangier', position: [-5.8134, 35.7595] as [number, number] },
  { name: 'Agadir', position: [-9.5981, 30.4278] as [number, number] },
  { name: 'Meknes', position: [-5.5471, 33.8935] as [number, number] },
  { name: 'Oujda', position: [-1.9085, 34.6814] as [number, number] },
  { name: 'Kenitra', position: [-6.5802, 34.2610] as [number, number] },
  { name: 'Tetouan', position: [-5.3684, 35.5889] as [number, number] },
  { name: 'Safi', position: [-9.2372, 32.2994] as [number, number] },
  { name: 'El Jadida', position: [-8.5007, 33.2316] as [number, number] },
  { name: 'Nador', position: [-2.9287, 35.1681] as [number, number] },
  { name: 'Beni Mellal', position: [-6.3498, 32.3373] as [number, number] },
  { name: 'Taza', position: [-4.0103, 34.2133] as [number, number] },
  { name: 'Essaouira', position: [-9.7695, 31.5085] as [number, number] },
  { name: 'Ouarzazate', position: [-6.9067, 30.9189] as [number, number] },
  { name: 'Errachidia', position: [-4.4267, 31.9314] as [number, number] },
  { name: 'Laayoune', position: [-13.1994, 27.1536] as [number, number] },
  { name: 'Dakhla', position: [-15.9582, 23.7158] as [number, number] },
  { name: 'Chefchaouen', position: [-5.2636, 35.1688] as [number, number] },
  { name: 'Ifrane', position: [-5.1100, 33.5333] as [number, number] },
  { name: 'Ksar El Kebir', position: [-5.9061, 35.0017] as [number, number] },
  { name: 'Taroudant', position: [-8.8746, 30.4703] as [number, number] },
  { name: 'Guelmim', position: [-10.0667, 28.9833] as [number, number] },
  { name: 'Al Hoceima', position: [-3.9372, 35.2517] as [number, number] },
  { name: 'Settat', position: [-7.6204, 33.0010] as [number, number] },
  { name: 'Khouribga', position: [-6.9116, 32.8847] as [number, number] },
];

/**
 * Fetch weather data for Moroccan cities using Open-Meteo API
 * FREE - No API key required!
 * https://open-meteo.com/en/docs
 */
export async function fetchMoroccoWeather(): Promise<MoroccoWeather[]> {
  console.log('[Morocco Weather] Fetching weather from Open-Meteo API (FREE)...');
  
  const limit = Math.max(6, Math.min(60, Number(process.env.MOROCCO_WEATHER_CITY_LIMIT ?? 30)));
  const cities = MOROCCO_CITIES.slice(0, limit);

  async function fetchCity(city: (typeof MOROCCO_CITIES)[number]): Promise<MoroccoWeather | null> {
    try {
      const [lng, lat] = city.position;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MoroccoIntelligenceApp/1.0' },
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.current) return null;
      const current = data.current;

      const weatherCode = current.weather_code || 0;
      const { condition, description, icon } = mapWeatherCode(weatherCode);

      let alert = undefined;
      if (current.temperature_2m > 40) {
        alert = { type: 'HEAT' as const, severity: 'HIGH' as const, description: `Extreme heat: ${Math.round(current.temperature_2m)}°C` };
      } else if (current.wind_speed_10m > 50) {
        alert = { type: 'WIND' as const, severity: 'HIGH' as const, description: `Strong winds: ${Math.round(current.wind_speed_10m)} km/h` };
      } else if (weatherCode >= 95) {
        alert = { type: 'STORM' as const, severity: 'MEDIUM' as const, description: 'Thunderstorm warning' };
      }

      return {
        city: city.name,
        position: city.position,
        temperature: Math.round(current.temperature_2m),
        condition,
        humidity: Math.round(current.relative_humidity_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        description,
        icon,
        alert,
      };
    } catch {
      return null;
    }
  }

  const CONCURRENCY = 8;
  const out: MoroccoWeather[] = [];
  for (let i = 0; i < cities.length; i += CONCURRENCY) {
    const chunk = cities.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(chunk.map(fetchCity));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) out.push(r.value);
    }
  }

  console.log('[Morocco Weather] Fetched weather for', out.length, 'cities');
  return out;
}

/**
 * Map WMO weather codes to human-readable conditions
 * https://open-meteo.com/en/docs
 */
function mapWeatherCode(code: number): { condition: string; description: string; icon: string } {
  if (code === 0) return { condition: 'Clear', description: 'Clear sky', icon: '01d' };
  if (code <= 3) return { condition: 'Clouds', description: 'Partly cloudy', icon: '02d' };
  if (code <= 48) return { condition: 'Fog', description: 'Foggy', icon: '50d' };
  if (code <= 57) return { condition: 'Drizzle', description: 'Light drizzle', icon: '09d' };
  if (code <= 67) return { condition: 'Rain', description: 'Rainy', icon: '10d' };
  if (code <= 77) return { condition: 'Snow', description: 'Snowy', icon: '13d' };
  if (code <= 82) return { condition: 'Rain', description: 'Rain showers', icon: '09d' };
  if (code <= 86) return { condition: 'Snow', description: 'Snow showers', icon: '13d' };
  if (code >= 95) return { condition: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' };
  return { condition: 'Unknown', description: 'Unknown', icon: '02d' };
}

/**
 * Fetch traffic incidents from news and social media
 * This would integrate with local traffic APIs or scrape traffic websites
 */
export async function fetchMoroccoTraffic(): Promise<MoroccoTraffic[]> {
  console.log('[Morocco Traffic] Fetching traffic data...');
  
  // This would integrate with:
  // - Moroccan traffic authority APIs
  // - Google Maps Traffic API
  // - Waze API
  // - Local news sources
  
  // For now, return empty array
  // In production, this would fetch real traffic data
  return [];
}

/**
 * Fetch commodity prices from Moroccan markets
 * This would integrate with:
 * - Casablanca Stock Exchange
 * - Agricultural markets
 * - Energy prices
 */
export async function fetchMoroccoCommodities(): Promise<MoroccoCommodity[]> {
  console.log('[Morocco Commodities] Fetching commodity prices...');
  
  // Mock data for demonstration
  // In production, integrate with real commodity APIs
  const commodities: MoroccoCommodity[] = [
    {
      name: 'Wheat',
      category: 'AGRICULTURE',
      price: 3200,
      unit: 'MAD/ton',
      change: 2.5,
      market: 'Casablanca',
      timestamp: new Date().toISOString(),
    },
    {
      name: 'Olive Oil',
      category: 'AGRICULTURE',
      price: 45,
      unit: 'MAD/L',
      change: -1.2,
      market: 'Marrakech',
      timestamp: new Date().toISOString(),
    },
    {
      name: 'Phosphate',
      category: 'MINERALS',
      price: 850,
      unit: 'USD/ton',
      change: 3.8,
      market: 'Casablanca',
      timestamp: new Date().toISOString(),
    },
  ];
  
  return commodities;
}

/**
 * Detect fires from NASA FIRMS API (FREE with API key)
 * https://firms.modaps.eosdis.nasa.gov/api/
 * 
 * Also detects from news articles as fallback
 */
export async function detectMoroccoFires(articles: any[]): Promise<MoroccoFire[]> {
  console.log('[Morocco Fires] Detecting fires...');
  
  const fires: MoroccoFire[] = [];
  
  // Strategy 1: Try NASA FIRMS API (requires free API key)
  const nasaApiKey = process.env.NASA_FIRMS_API_KEY;
  
  if (nasaApiKey) {
    try {
      console.log('[Morocco Fires] Fetching from NASA FIRMS API...');
      
      // Morocco bounding box: [lng_min, lat_min, lng_max, lat_max]
      const bbox = '-17,21,-1,36'; // Covers all of Morocco including Western Sahara
      
      // VIIRS data (375m resolution, more accurate than MODIS)
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaApiKey}/VIIRS_SNPP_NRT/${bbox}/1`;
      
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MoroccoIntelligenceApp/1.0'
        }
      });
      
      if (response.ok) {
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          if (parts.length < 10) continue;
          
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          const brightness = parseFloat(parts[2]);
          const confidence = parseFloat(parts[8]);
          const acqDate = parts[5];
          const acqTime = parts[6];
          
          // Find nearest city
          let nearestCity = 'Morocco';
          let minDist = Infinity;
          for (const city of MOROCCO_CITIES) {
            const dist = Math.sqrt(
              Math.pow(city.position[0] - lng, 2) + 
              Math.pow(city.position[1] - lat, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearestCity = city.name;
            }
          }
          
          // Determine severity based on brightness and confidence
          let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
          if (brightness > 400 && confidence > 80) severity = 'CRITICAL';
          else if (brightness > 350 || confidence > 70) severity = 'HIGH';
          else if (brightness < 320 || confidence < 50) severity = 'LOW';
          
          fires.push({
            id: `fire-nasa-${i}-${Date.now()}`,
            location: nearestCity,
            position: [lng, lat],
            severity,
            area: Math.round(brightness / 10), // Rough estimate
            status: 'ACTIVE',
            description: `Active fire detected by NASA satellite (${Math.round(confidence)}% confidence)`,
            timestamp: `${acqDate}T${acqTime}:00Z`,
            brightness,
            confidence,
          });
        }
        
        console.log(`[Morocco Fires] ✓ NASA FIRMS: Detected ${fires.length} active fires`);
      }
    } catch (err) {
      console.error('[Morocco Fires] NASA FIRMS API failed:', err);
    }
  } else {
    console.log('[Morocco Fires] NASA FIRMS API key not configured (set NASA_FIRMS_API_KEY)');
  }
  
  // Strategy 2: Detect fires from news articles (fallback)
  console.log('[Morocco Fires] Analyzing news articles for fire mentions...');
  
  articles.forEach(article => {
    const content = `${article.title} ${article.description || ''}`.toLowerCase();
    
    if (content.includes('fire') || content.includes('incendie') || content.includes('feu') || content.includes('wildfire') || content.includes('blaze')) {
      // Extract location
      const cities = ['rabat', 'casablanca', 'marrakech', 'fes', 'tangier', 'agadir', 'meknes', 'oujda'];
      let location = 'Morocco';
      let position: [number, number] = [-6.8498, 33.9716];
      
      for (const cityName of cities) {
        if (content.includes(cityName)) {
          location = cityName.charAt(0).toUpperCase() + cityName.slice(1);
          const cityData = MOROCCO_CITIES.find(c => c.name.toLowerCase() === cityName);
          if (cityData) position = cityData.position;
          break;
        }
      }
      
      // Determine severity
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
      if (content.includes('major') || content.includes('large') || content.includes('massive')) {
        severity = 'CRITICAL';
      } else if (content.includes('small') || content.includes('minor')) {
        severity = 'LOW';
      } else if (content.includes('spread') || content.includes('growing')) {
        severity = 'HIGH';
      }
      
      // Check if already detected by NASA
      const alreadyDetected = fires.some(f => 
        f.location === location && 
        Math.abs(f.position[0] - position[0]) < 0.1 &&
        Math.abs(f.position[1] - position[1]) < 0.1
      );
      
      if (!alreadyDetected) {
        fires.push({
          id: `fire-news-${fires.length}-${Date.now()}`,
          location,
          position,
          severity,
          area: Math.round(Math.random() * 100), // Would be extracted from article
          status: content.includes('contained') || content.includes('extinguished') ? 'CONTAINED' : 'ACTIVE',
          description: article.title,
          timestamp: article.publishedAt || new Date().toISOString(),
          image: (article as any).urlToImage || (article as any).image,
        });
      }
    }
  });
  
  console.log('[Morocco Fires] Total detected:', fires.length, 'fires');
  return fires;
}

/**
 * Fetch all Morocco local data
 */
export async function fetchAllMoroccoLocalData(articles: any[]) {
  console.log('[Morocco Local Data] Fetching all local data sources...');
  
  const [weather, traffic, commodities, fires] = await Promise.all([
    fetchMoroccoWeather(),
    fetchMoroccoTraffic(),
    fetchMoroccoCommodities(),
    detectMoroccoFires(articles),
  ]);
  
  console.log('[Morocco Local Data] Fetched:', {
    weather: weather.length,
    traffic: traffic.length,
    commodities: commodities.length,
    fires: fires.length,
  });
  
  return {
    weather,
    traffic,
    commodities,
    fires,
  };
}
