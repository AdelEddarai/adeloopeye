/**
 * World Bank API Client
 * Free API - No key required
 * https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
 */

export class WorldBankClient {
  private baseUrl = 'https://api.worldbank.org/v2';

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}?format=json&per_page=100`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`World Bank API error: ${res.status}`);
      }

      const json = await res.json();
      // World Bank returns [metadata, data]
      return json[1] as T;
    } catch (error) {
      console.error('World Bank API request failed:', error);
      throw error;
    }
  }

  /**
   * Get country information
   */
  async getCountryInfo(countryCode: string) {
    const data = await this.request<any[]>(`/country/${countryCode}`);
    return data[0];
  }

  /**
   * Get economic indicators for a country
   */
  async getIndicators(countryCode: string) {
    try {
      // Key economic indicators
      const indicators = {
        gdp: 'NY.GDP.MKTP.CD', // GDP (current US$)
        gdpGrowth: 'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
        gdpPerCapita: 'NY.GDP.PCAP.CD', // GDP per capita (current US$)
        inflation: 'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
        unemployment: 'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
        population: 'SP.POP.TOTL', // Population, total
        exports: 'NE.EXP.GNFS.CD', // Exports of goods and services (current US$)
        imports: 'NE.IMP.GNFS.CD', // Imports of goods and services (current US$)
      };

      const results: Record<string, any> = {};

      // Fetch all indicators in parallel
      await Promise.all(
        Object.entries(indicators).map(async ([key, code]) => {
          try {
            const data = await this.request<any[]>(
              `/country/${countryCode}/indicator/${code}?date=2020:2024`
            );
            // Get most recent value
            const recent = data?.find((d: any) => d.value !== null);
            results[key] = {
              value: recent?.value || null,
              year: recent?.date || null,
            };
          } catch {
            results[key] = { value: null, year: null };
          }
        })
      );

      return results;
    } catch (error) {
      console.error('Failed to fetch World Bank indicators:', error);
      return null;
    }
  }
}

// Singleton instance
export const worldBankClient = new WorldBankClient();
