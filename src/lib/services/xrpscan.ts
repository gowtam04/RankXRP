import {
  getCachedThresholds,
  setCachedThresholds,
  isThresholdsCacheStale,
  TierThreshold,
  CachedThresholds,
} from '@/lib/cache';
import { TIERS } from '@/lib/constants/tiers';

const XRPSCAN_RICH_LIST_URL = 'https://api.xrpscan.com/api/v1/richlist';

interface RichListAccount {
  account: string;
  balance: string;
  rank: number;
}

interface DistributionStats {
  totalAccounts: number;
  thresholds: Map<number, number>;
}

async function fetchRichListSample(): Promise<RichListAccount[]> {
  const response = await fetch(XRPSCAN_RICH_LIST_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`XRPScan API error: ${response.status}`);
  }

  return response.json();
}

function calculateThresholdsFromDistribution(
  accounts: RichListAccount[],
  totalAccounts: number
): TierThreshold[] {
  const thresholds: TierThreshold[] = [];

  for (const tier of TIERS) {
    // Calculate the rank that corresponds to this percentile
    const targetRank = Math.floor((tier.percentile / 100) * totalAccounts);

    // Find the account closest to this rank
    const account = accounts.find((a) => a.rank >= targetRank);

    thresholds.push({
      name: tier.name,
      emoji: tier.emoji,
      percentile: tier.percentile,
      minimumXrp: account
        ? parseFloat(account.balance) / 1_000_000 // Convert drops to XRP
        : getEstimatedThreshold(tier.percentile, totalAccounts),
    });
  }

  return thresholds;
}

// Fallback estimates based on historical XRP distribution data
function getEstimatedThreshold(percentile: number, totalAccounts: number): number {
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
    minimumXrp: getEstimatedThreshold(tier.percentile, 4_800_000),
  }));
}

export async function getDistributionData(): Promise<CachedThresholds> {
  // Check cache first
  const cached = await getCachedThresholds();
  if (cached && !isThresholdsCacheStale(cached.timestamp)) {
    return cached;
  }

  // If cache exists but is stale, return it and refresh in background
  if (cached) {
    refreshDistributionDataInBackground();
    return cached;
  }

  // No cache, must fetch
  try {
    return await refreshDistributionData();
  } catch (error) {
    console.error('Failed to fetch distribution data, using defaults:', error);
    // Return default thresholds
    const defaults: CachedThresholds = {
      thresholds: getDefaultThresholds(),
      totalAccounts: 4_800_000, // Estimated
      timestamp: Date.now(),
    };
    return defaults;
  }
}

async function refreshDistributionData(): Promise<CachedThresholds> {
  const richList = await fetchRichListSample();

  // Estimate total accounts from richlist data
  // XRPScan richlist shows top accounts, we use the last rank as reference
  const lastAccount = richList[richList.length - 1];
  const estimatedTotal = lastAccount?.rank
    ? Math.max(lastAccount.rank * 100, 4_800_000) // Rough estimate
    : 4_800_000;

  const thresholds = calculateThresholdsFromDistribution(richList, estimatedTotal);

  await setCachedThresholds(thresholds, estimatedTotal);

  return {
    thresholds,
    totalAccounts: estimatedTotal,
    timestamp: Date.now(),
  };
}

function refreshDistributionDataInBackground(): void {
  refreshDistributionData().catch((error) => {
    console.error('Background distribution refresh failed:', error);
  });
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
