import { getCachedPrice, setCachedPrice } from '@/lib/cache';

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd';
const BINANCE_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT';

interface CoinGeckoResponse {
  ripple: {
    usd: number;
  };
}

interface BinanceResponse {
  symbol: string;
  price: string;
}

async function fetchFromCoinGecko(): Promise<number> {
  const response = await fetch(COINGECKO_URL, {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: CoinGeckoResponse = await response.json();
  return data.ripple.usd;
}

async function fetchFromBinance(): Promise<number> {
  const response = await fetch(BINANCE_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: BinanceResponse = await response.json();
  return parseFloat(data.price);
}

export async function getXrpPrice(): Promise<{
  price: number;
  timestamp: number;
  source: 'cache' | 'coingecko' | 'binance';
}> {
  // Check cache first
  const cached = await getCachedPrice();
  if (cached) {
    return {
      price: cached.price,
      timestamp: cached.timestamp,
      source: 'cache',
    };
  }

  // Try CoinGecko first
  try {
    const price = await fetchFromCoinGecko();
    await setCachedPrice(price);
    return {
      price,
      timestamp: Date.now(),
      source: 'coingecko',
    };
  } catch (error) {
    console.error('CoinGecko fetch failed, trying Binance...', error);
  }

  // Fallback to Binance
  try {
    const price = await fetchFromBinance();
    await setCachedPrice(price);
    return {
      price,
      timestamp: Date.now(),
      source: 'binance',
    };
  } catch (error) {
    console.error('Binance fetch also failed', error);
    throw new Error('Failed to fetch XRP price from all sources');
  }
}
