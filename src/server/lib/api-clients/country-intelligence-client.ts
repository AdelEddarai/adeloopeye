/**
 * Country Intelligence Client
 * Aggregates data from multiple sources for comprehensive country intelligence
 */

import { newsAPIClient } from './newsapi-client';
import { worldBankClient } from './world-bank-client';

export type CountryIntelligence = {
  country: {
    name: string;
    code: string;
    capital?: string;
    region?: string;
    incomeLevel?: string;
    population?: number;
  };
  economy: {
    gdp?: { value: number; year: string };
    gdpGrowth?: { value: number; year: string };
    gdpPerCapita?: { value: number; year: string };
    inflation?: { value: number; year: string };
    unemployment?: { value: number; year: string };
    exports?: { value: number; year: string };
    imports?: { value: number; year: string };
    tradeBalance?: number;
  };
  news: {
    total: number;
    recent: any[];
  };
  lastUpdated: string;
};

// Country code mapping (ISO 3166-1 alpha-2 to country names)
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'CN': 'China',
  'JP': 'Japan',
  'IN': 'India',
  'BR': 'Brazil',
  'RU': 'Russia',
  'CA': 'Canada',
  'AU': 'Australia',
  'MX': 'Mexico',
  'KR': 'South Korea',
  'ID': 'Indonesia',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AR': 'Argentina',
  'ZA': 'South Africa',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'TH': 'Thailand',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'AE': 'United Arab Emirates',
  'IL': 'Israel',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'SY': 'Syria',
  'JO': 'Jordan',
  'LB': 'Lebanon',
  'YE': 'Yemen',
  'KW': 'Kuwait',
  'QA': 'Qatar',
  'OM': 'Oman',
  'BH': 'Bahrain',
  'PS': 'Palestine',
  'MA': 'Morocco',
  'DZ': 'Algeria',
  'TN': 'Tunisia',
  'LY': 'Libya',
  'SD': 'Sudan',
  'ET': 'Ethiopia',
  'KE': 'Kenya',
  'TZ': 'Tanzania',
  'UG': 'Uganda',
  'GH': 'Ghana',
  'CI': 'Ivory Coast',
  'CM': 'Cameroon',
  'AO': 'Angola',
  'UA': 'Ukraine',
  'PL': 'Poland',
  'RO': 'Romania',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CZ': 'Czech Republic',
  'GR': 'Greece',
  'PT': 'Portugal',
  'SE': 'Sweden',
  'HU': 'Hungary',
  'AT': 'Austria',
  'CH': 'Switzerland',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'CU': 'Cuba',
};

export class CountryIntelligenceClient {
  /**
   * Get comprehensive intelligence for a country
   */
  async getCountryIntelligence(countryCode: string): Promise<CountryIntelligence | null> {
    try {
      const countryName = COUNTRY_NAMES[countryCode.toUpperCase()];
      if (!countryName) {
        throw new Error(`Unknown country code: ${countryCode}`);
      }

      // Fetch data in parallel
      const [countryInfo, indicators, news] = await Promise.all([
        worldBankClient.getCountryInfo(countryCode).catch(() => null),
        worldBankClient.getIndicators(countryCode).catch(() => null),
        newsAPIClient.searchNews(countryName, 10, 'en').catch(() => []),
      ]);

      // Calculate trade balance
      const tradeBalance = indicators?.exports?.value && indicators?.imports?.value
        ? indicators.exports.value - indicators.imports.value
        : undefined;

      return {
        country: {
          name: countryInfo?.name || countryName,
          code: countryCode.toUpperCase(),
          capital: countryInfo?.capitalCity,
          region: countryInfo?.region?.value,
          incomeLevel: countryInfo?.incomeLevel?.value,
          population: indicators?.population?.value,
        },
        economy: {
          gdp: indicators?.gdp,
          gdpGrowth: indicators?.gdpGrowth,
          gdpPerCapita: indicators?.gdpPerCapita,
          inflation: indicators?.inflation,
          unemployment: indicators?.unemployment,
          exports: indicators?.exports,
          imports: indicators?.imports,
          tradeBalance,
        },
        news: {
          total: news.length,
          recent: news.slice(0, 5),
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch country intelligence:', error);
      return null;
    }
  }

  /**
   * Get country name from code
   */
  getCountryName(countryCode: string): string | null {
    return COUNTRY_NAMES[countryCode.toUpperCase()] || null;
  }

  /**
   * Search for country code by name
   */
  searchCountryCode(countryName: string): string | null {
    const normalized = countryName.toLowerCase();
    for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
      if (name.toLowerCase().includes(normalized) || normalized.includes(name.toLowerCase())) {
        return code;
      }
    }
    return null;
  }
}

// Singleton instance
export const countryIntelligenceClient = new CountryIntelligenceClient();
