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
      return [];
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
      return [];
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
    return [];
  }
}
