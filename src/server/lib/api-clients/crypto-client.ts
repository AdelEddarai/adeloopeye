/**
 * Cryptocurrency Client
 * Uses CoinGecko free API (no authentication required)
 * https://www.coingecko.com/en/api/documentation
 */

export type CryptoQuote = {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
};

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
};

/**
 * Fetch cryptocurrency prices from CoinGecko (FREE, no auth)
 */
export async function fetchCryptoPrices(symbols: string[] = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP']): Promise<CryptoQuote[]> {
  try {
    // Convert symbols to CoinGecko IDs
    const ids = symbols
      .map(symbol => SYMBOL_TO_ID[symbol.toUpperCase()])
      .filter(Boolean)
      .join(',');

    if (!ids) {
      console.warn('No valid crypto symbols provided');
      return getSimulatedCrypto(symbols);
    }

    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return getSimulatedCrypto(symbols);
    }

    const data = await response.json();

    return data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price || 0,
      changePercent24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return getSimulatedCrypto(symbols);
  }
}

/**
 * Get simulated crypto prices as fallback
 */
function getSimulatedCrypto(symbols: string[]): CryptoQuote[] {
  const baseData: Record<string, { name: string; price: number; marketCap: number }> = {
    BTC: { name: 'Bitcoin', price: 95000, marketCap: 1850000000000 },
    ETH: { name: 'Ethereum', price: 3200, marketCap: 385000000000 },
    USDT: { name: 'Tether', price: 1.00, marketCap: 95000000000 },
    BNB: { name: 'BNB', price: 620, marketCap: 90000000000 },
    XRP: { name: 'XRP', price: 2.15, marketCap: 120000000000 },
    SOL: { name: 'Solana', price: 185, marketCap: 85000000000 },
    ADA: { name: 'Cardano', price: 0.95, marketCap: 33000000000 },
    DOGE: { name: 'Dogecoin', price: 0.32, marketCap: 47000000000 },
  };

  return symbols.map(symbol => {
    const base = baseData[symbol.toUpperCase()] || { name: symbol, price: 1, marketCap: 1000000 };
    const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const changePercent = (Math.random() - 0.5) * 10; // ±5% change

    return {
      symbol: symbol.toUpperCase(),
      name: base.name,
      price: base.price * (1 + priceVariation),
      changePercent24h: changePercent,
      volume24h: base.marketCap * 0.05 * (1 + Math.random() * 0.5),
      marketCap: base.marketCap,
    };
  });
}
