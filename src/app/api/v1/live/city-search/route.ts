import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';

const API_KEY = process.env.OPENWEATHER_API_KEY || '';
const GEOCODING_URL = 'http://api.openweathermap.org/geo/1.0/direct';

type GeocodeResult = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return new Response('Query must be at least 2 characters', { status: 400 });
    }

    // Geocoding requires the OpenWeatherMap API key
    if (!API_KEY) {
      console.warn('OpenWeatherMap API key not configured, returning empty results');
      return ok([], {
        headers: { 'Cache-Control': 'public, max-age=300' },
      });
    }

    // Use OpenWeatherMap Geocoding API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `${GEOCODING_URL}?q=${encodeURIComponent(query)}&limit=10&appid=${API_KEY}`;
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      return ok([], {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    const data: GeocodeResult[] = await response.json();

    // Transform to our format
    const cities = data.map(city => ({
      name: city.name,
      country: getCountryName(city.country),
      lat: city.lat,
      lon: city.lon,
      state: city.state,
    }));

    return ok(cities, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('City search API error:', error);
    return ok([], {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }
}

/**
 * Get country name from country code
 */
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'ES': 'Spain',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'RU': 'Russia',
    'KR': 'South Korea',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'EG': 'Egypt',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'TR': 'Turkey',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'SY': 'Syria',
    'IL': 'Israel',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'PS': 'Palestine',
    'YE': 'Yemen',
    'OM': 'Oman',
    'KW': 'Kuwait',
    'BH': 'Bahrain',
    'QA': 'Qatar',
    'PK': 'Pakistan',
    'AF': 'Afghanistan',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'MM': 'Myanmar',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'NZ': 'New Zealand',
    'PL': 'Poland',
    'UA': 'Ukraine',
    'RO': 'Romania',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'GR': 'Greece',
    'PT': 'Portugal',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IE': 'Ireland',
    'BE': 'Belgium',
    'NL': 'Netherlands',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'MA': 'Morocco',
    'DZ': 'Algeria',
    'TN': 'Tunisia',
    'LY': 'Libya',
    'SD': 'Sudan',
    'ET': 'Ethiopia',
    'KE': 'Kenya',
  };
  
  return countries[code] || code;
}
