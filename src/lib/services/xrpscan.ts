import {
  getCachedThresholds,
  isThresholdsCacheStale,
  TierThreshold,
  CachedThresholds,
} from '@/lib/cache';
import { TIERS } from '@/lib/constants/tiers';
import { getThresholds as getDbThresholds, getTotalAccounts, getDb } from '@/lib/db';

// Max age for SQLite data before we consider it stale (2 days)
// With daily scans, data older than 2 days indicates a missed scan
const SQLITE_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Try to get distribution data from SQLite database.
 * Returns null if no data exists or data is too old.
 */
function getDistributionFromSqlite(): CachedThresholds | null {
  try {
    getDb(); // Ensure DB is initialized
    const dbThresholds = getDbThresholds();

    if (dbThresholds.length === 0) {
      return null;
    }

    // Check if data is too old
    const oldestUpdate = Math.min(...dbThresholds.map((t) => t.updated_at));
    if (Date.now() - oldestUpdate > SQLITE_MAX_AGE_MS) {
      console.log('[xrpscan] SQLite data is stale, will use fallback');
      return null;
    }

    const totalAccounts = getTotalAccounts();

    return {
      thresholds: dbThresholds.map((t) => ({
        name: t.name,
        emoji: t.emoji,
        percentile: t.percentile,
        minimumXrp: t.min_xrp,
      })),
      totalAccounts,
      timestamp: oldestUpdate,
    };
  } catch (error) {
    console.warn('[xrpscan] Failed to read from SQLite:', error);
    return null;
  }
}

// Fallback estimates based on historical XRP distribution data
function getEstimatedThreshold(percentile: number): number {
  // Based on ~4.8M accounts and historical distribution
  const estimates: Record<number, number> = {
    0.01: 10_000_000, // Whale: Top 0.01%
    0.1: 1_000_000, // Shark: Top 0.1%
    1: 100_000, // Dolphin: Top 1%
    5: 25_000, // Tuna: Top 5%
    10: 10_000, // Squid: Top 10%
    25: 2_500, // Shrimp: Top 25%
    50: 500, // Crab: Top 50%
    100: 0, // Plankton: Everyone else
  };

  return estimates[percentile] || 0;
}

// Default thresholds to use when API is unavailable
function getDefaultThresholds(): TierThreshold[] {
  return TIERS.map((tier) => ({
    name: tier.name,
    emoji: tier.emoji,
    percentile: tier.percentile,
    minimumXrp: getEstimatedThreshold(tier.percentile),
  }));
}

export async function getDistributionData(): Promise<CachedThresholds> {
  // 1. Try SQLite first (most accurate, from our scans)
  const sqliteData = getDistributionFromSqlite();
  if (sqliteData) {
    return sqliteData;
  }

  // 2. Fall back to Redis cache
  const cached = await getCachedThresholds();
  if (cached && !isThresholdsCacheStale(cached.timestamp)) {
    return cached;
  }

  // 3. Return stale cache if available
  if (cached) {
    return cached;
  }

  // 4. Last resort: use hardcoded defaults
  console.warn('[xrpscan] No distribution data available, using defaults');
  return {
    thresholds: getDefaultThresholds(),
    totalAccounts: 4_800_000, // Estimated
    timestamp: Date.now(),
  };
}

export async function getDistributionStats(): Promise<{
  totalAccounts: number;
  medianBalance: number;
  lastUpdated: number;
}> {
  const data = await getDistributionData();

  // Find median (50th percentile threshold)
  const medianThreshold = data.thresholds.find((t) => t.percentile === 50);

  return {
    totalAccounts: data.totalAccounts,
    medianBalance: medianThreshold?.minimumXrp || 500,
    lastUpdated: data.timestamp,
  };
}
