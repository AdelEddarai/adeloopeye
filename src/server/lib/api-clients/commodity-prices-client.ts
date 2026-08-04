/**
 * Commodity Prices Client
 * Uses API-Ninjas free tier for real-time commodity prices
 * https://www.api-ninjas.com/api/commodityprice
 */

export type CommodityPrice = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  category: 'Energy' | 'Metals';
  timestamp: string;
};

const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
const API_BASE = 'https://api.api-ninjas.com/v1';

// Commodities to track
const COMMODITIES = [
  { name: 'crude_oil_wti', displayName: 'WTI Crude Oil', unit: 'per barrel', category: 'Energy' as const },
  { name: 'crude_oil_brent', displayName: 'Brent Crude Oil', unit: 'per barrel', category: 'Energy' as const },
  { name: 'natural_gas', displayName: 'Natural Gas', unit: 'per MMBtu', category: 'Energy' as const },
  { name: 'gold', displayName: 'Gold', unit: 'per oz', category: 'Metals' as const },
  { name: 'silver', displayName: 'Silver', unit: 'per oz', category: 'Metals' as const },
  { name: 'copper', displayName: 'Copper', unit: 'per lb', category: 'Metals' as const },
];

// Store previous prices for change calculation
const priceCache = new Map<string, number>();

/**
 * Fetch commodity price from API-Ninjas
 */
async function fetchCommodityPrice(name: string): Promise<{ price: number } | null> {
  if (!API_NINJAS_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/commodityprice?name=${name}`, {
      headers: {
        'X-Api-Key': API_NINJAS_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`API-Ninjas error for ${name}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${name}:`, error);
    return null;
  }
}

/**
 * Fetch all commodity prices
 */
export async function fetchCommodityPrices(): Promise<CommodityPrice[]> {
  if (!API_NINJAS_KEY) {
    console.warn('API_NINJAS_KEY not configured');
    return [];
  }

  try {
    const results = await Promise.all(
      COMMODITIES.map(async (commodity) => {
        const data = await fetchCommodityPrice(commodity.name);
        
        if (!data) {
          return null;
        }

        const currentPrice = data.price;
        const previousPrice = priceCache.get(commodity.name) || currentPrice;
        const change = currentPrice - previousPrice;
        const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

        // Update cache
        priceCache.set(commodity.name, currentPrice);

        return {
          symbol: commodity.name.toUpperCase(),
          name: commodity.displayName,
          price: currentPrice,
          change,
          changePercent,
          unit: commodity.unit,
          category: commodity.category,
          timestamp: new Date().toISOString(),
        };
      })
    );

    return results.filter((r): r is CommodityPrice => r !== null);
  } catch (error) {
    console.error('Failed to fetch commodity prices:', error);
    return [];
  }
}
