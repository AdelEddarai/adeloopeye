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
    console.warn('API_NINJAS_KEY not configured, using simulated data');
    return getSimulatedPrices();
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

    const validResults = results.filter((r): r is CommodityPrice => r !== null);
    
    // If we got some real data, return it; otherwise fall back to simulated
    return validResults.length > 0 ? validResults : getSimulatedPrices();
  } catch (error) {
    console.error('Failed to fetch commodity prices:', error);
    return getSimulatedPrices();
  }
}

/**
 * Get simulated prices as fallback
 */
function getSimulatedPrices(): CommodityPrice[] {
  const now = new Date().toISOString();
  
  return [
    {
      symbol: 'CRUDE_OIL_WTI',
      name: 'WTI Crude Oil',
      price: 78.45 + (Math.random() - 0.5) * 2,
      change: (Math.random() - 0.5) * 3,
      changePercent: (Math.random() - 0.5) * 4,
      unit: 'per barrel',
      category: 'Energy',
      timestamp: now,
    },
    {
      symbol: 'CRUDE_OIL_BRENT',
      name: 'Brent Crude Oil',
      price: 82.30 + (Math.random() - 0.5) * 2,
      change: (Math.random() - 0.5) * 3,
      changePercent: (Math.random() - 0.5) * 4,
      unit: 'per barrel',
      category: 'Energy',
      timestamp: now,
    },
    {
      symbol: 'NATURAL_GAS',
      name: 'Natural Gas',
      price: 2.85 + (Math.random() - 0.5) * 0.2,
      change: (Math.random() - 0.5) * 0.3,
      changePercent: (Math.random() - 0.5) * 5,
      unit: 'per MMBtu',
      category: 'Energy',
      timestamp: now,
    },
    {
      symbol: 'GOLD',
      name: 'Gold',
      price: 2050 + (Math.random() - 0.5) * 20,
      change: (Math.random() - 0.5) * 15,
      changePercent: (Math.random() - 0.5) * 1.5,
      unit: 'per oz',
      category: 'Metals',
      timestamp: now,
    },
    {
      symbol: 'SILVER',
      name: 'Silver',
      price: 24.50 + (Math.random() - 0.5) * 0.5,
      change: (Math.random() - 0.5) * 0.8,
      changePercent: (Math.random() - 0.5) * 3,
      unit: 'per oz',
      category: 'Metals',
      timestamp: now,
    },
    {
      symbol: 'COPPER',
      name: 'Copper',
      price: 3.85 + (Math.random() - 0.5) * 0.1,
      change: (Math.random() - 0.5) * 0.15,
      changePercent: (Math.random() - 0.5) * 2.5,
      unit: 'per lb',
      category: 'Metals',
      timestamp: now,
    },
  ];
}
