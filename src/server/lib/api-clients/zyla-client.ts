/**
 * Zyla API Hub Client
 * Unified access to 10,000+ APIs through single key
 * https://zylalabs.com/
 */

type ZylaResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export class ZylaClient {
  private apiKey: string;
  private baseUrl = 'https://zylalabs.com/api';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ZYLA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  ZYLA_API_KEY not configured');
    }
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60s
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!res.ok) {
        throw new Error(`Zyla API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json() as ZylaResponse<T>;
      if (!json.success) {
        throw new Error(json.error || 'Unknown Zyla API error');
      }

      return json.data;
    } catch (error) {
      console.error('Zyla API request failed:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time news articles
   * Uses NewsAPI or similar provider through Zyla
   */
  async fetchNews(query: string, limit: number = 20, language: string = 'en') {
    return this.request<NewsArticle[]>('/news/search', {
      q: query,
      limit: String(limit),
      language,
    });
  }

  /**
   * Fetch flight data for specific region
   */
  async fetchFlights(bbox: [number, number, number, number]) {
    const [minLat, minLon, maxLat, maxLon] = bbox;
    return this.request<FlightData[]>('/aviation/flights', {
      bbox: `${minLat},${minLon},${maxLat},${maxLon}`,
    });
  }

  /**
   * Fetch stock/commodity prices
   */
  async fetchMarketData(symbols: string[]) {
    return this.request<MarketQuote[]>('/finance/quotes', {
      symbols: symbols.join(','),
    });
  }

  /**
   * Fetch weather data for location
   */
  async fetchWeather(lat: number, lon: number) {
    return this.request<WeatherData>('/weather/current', {
      lat: String(lat),
      lon: String(lon),
    });
  }

  /**
   * Fetch cryptocurrency prices
   */
  async fetchCrypto(symbols: string[] = ['BTC', 'ETH']) {
    return this.request<CryptoQuote[]>('/crypto/quotes', {
      symbols: symbols.join(','),
    });
  }
}

// Type definitions for Zyla responses
export type NewsArticle = {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  content?: string;
};

export type FlightData = {
  icao24: string;
  callsign: string;
  origin_country: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  on_ground: boolean;
  last_contact: number;
};

export type MarketQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
};

export type WeatherData = {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  description: string;
  icon: string;
};

export type CryptoQuote = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
};

// Singleton instance
export const zylaClient = new ZylaClient();
