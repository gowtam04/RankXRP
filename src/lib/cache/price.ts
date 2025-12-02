import { getCached, setCache } from './redis';

const PRICE_CACHE_KEY = 'xrp:price:usd';
const PRICE_TTL_SECONDS = 300; // 5 minutes

export interface CachedPrice {
  price: number;
  timestamp: number;
}

export async function getCachedPrice(): Promise<CachedPrice | null> {
  return getCached<CachedPrice>(PRICE_CACHE_KEY);
}

export async function setCachedPrice(price: number): Promise<void> {
  const data: CachedPrice = {
    price,
    timestamp: Date.now(),
  };
  await setCache(PRICE_CACHE_KEY, data, PRICE_TTL_SECONDS);
}

export function getPriceAgeMinutes(timestamp: number): number {
  const ageMs = Date.now() - timestamp;
  return Math.floor(ageMs / 60000);
}
