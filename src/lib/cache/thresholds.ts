import { getCached, setCache } from './redis';

const THRESHOLDS_CACHE_KEY = 'xrp:thresholds';
const THRESHOLDS_TTL_SECONDS = 3600; // 1 hour

export interface TierThreshold {
  name: string;
  emoji: string;
  percentile: number;
  minimumXrp: number;
}

export interface CachedThresholds {
  thresholds: TierThreshold[];
  totalAccounts: number;
  timestamp: number;
}

export async function getCachedThresholds(): Promise<CachedThresholds | null> {
  return getCached<CachedThresholds>(THRESHOLDS_CACHE_KEY);
}

export async function setCachedThresholds(
  thresholds: TierThreshold[],
  totalAccounts: number
): Promise<void> {
  const data: CachedThresholds = {
    thresholds,
    totalAccounts,
    timestamp: Date.now(),
  };
  await setCache(THRESHOLDS_CACHE_KEY, data, THRESHOLDS_TTL_SECONDS);
}

export function isThresholdsCacheStale(timestamp: number): boolean {
  const ageMs = Date.now() - timestamp;
  return ageMs > THRESHOLDS_TTL_SECONDS * 1000;
}
