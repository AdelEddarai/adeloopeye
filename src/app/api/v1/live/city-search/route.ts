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

    // If no API key, return simulated results
    if (!API_KEY) {
      console.warn('OpenWeatherMap API key not configured, using fallback search');
      return ok(getSimulatedCities(query), {
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
      return ok(getSimulatedCities(query), {
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
    const query = new URL(req.url).searchParams.get('q') || '';
    return ok(getSimulatedCities(query), {
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

/**
 * Simulated city search (fallback when API key not available)
 */
function getSimulatedCities(query: string): Array<{
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
}> {
  const allCities = [
    { name: 'Tehran', country: 'Iran', lat: 35.6892, lon: 51.3890 },
    { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818 },
    { name: 'Damascus', country: 'Syria', lat: 33.5138, lon: 36.2765 },
    { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lon: 44.3661 },
    { name: 'Beirut', country: 'Lebanon', lat: 33.8886, lon: 35.4955 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
    { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lon: 30.5234 },
    { name: 'Rabat', country: 'Morocco', lat: 33.9716, lon: -6.8498 },
    { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
    { name: 'Ankara', country: 'Turkey', lat: 39.9334, lon: 32.8597 },
    { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
    { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
    { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
    { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, state: 'New York' },
    { name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437, state: 'California' },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
    { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
    { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', country: 'India', lat: 28.7041, lon: 77.1025 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
    { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
    { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  ];

  const lowerQuery = query.toLowerCase();
  return allCities.filter(city =>
    city.name.toLowerCase().includes(lowerQuery) ||
    city.country.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}
