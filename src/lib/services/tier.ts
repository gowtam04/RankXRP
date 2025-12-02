import { TIERS, Tier } from '@/lib/constants/tiers';
import { TierThreshold, CachedThresholds } from '@/lib/cache';

export interface TierResult {
  tier: Tier;
  percentile: number;
  exactPercentile: string;
  nextTier: Tier | null;
  progressPercent: number;
  xrpToNextTier: number;
  currentThreshold: number;
  nextThreshold: number | null;
}

export function calculateTier(
  balance: number,
  thresholdsData: CachedThresholds
): TierResult {
  const { thresholds } = thresholdsData;

  // Sort thresholds by minimumXrp descending (highest balance first)
  const sortedThresholds = [...thresholds].sort(
    (a, b) => b.minimumXrp - a.minimumXrp
  );

  // Find which tier the user belongs to
  let userTier: Tier = TIERS[TIERS.length - 1]; // Default to Plankton
  let userThreshold: TierThreshold | null = null;
  let nextThreshold: TierThreshold | null = null;

  for (let i = 0; i < sortedThresholds.length; i++) {
    const threshold = sortedThresholds[i];
    if (balance >= threshold.minimumXrp) {
      const tier = TIERS.find((t) => t.name === threshold.name);
      if (tier) {
        userTier = tier;
        userThreshold = threshold;
        nextThreshold = i > 0 ? sortedThresholds[i - 1] : null;
        break;
      }
    }
  }

  // If no threshold matched, user is in the lowest tier
  if (!userThreshold) {
    userThreshold = sortedThresholds[sortedThresholds.length - 1];
    nextThreshold = sortedThresholds[sortedThresholds.length - 2] || null;
  }

  // Calculate exact percentile
  const exactPercentile = calculateExactPercentile(balance, thresholdsData);

  // Find next tier
  const currentTierIndex = TIERS.findIndex((t) => t.name === userTier.name);
  const nextTier = currentTierIndex > 0 ? TIERS[currentTierIndex - 1] : null;

  // Calculate progress within current tier
  const progressPercent = calculateProgressPercent(
    balance,
    userThreshold.minimumXrp,
    nextThreshold?.minimumXrp || userThreshold.minimumXrp * 10
  );

  // Calculate XRP needed to reach next tier
  const xrpToNextTier = nextThreshold
    ? Math.max(0, nextThreshold.minimumXrp - balance)
    : 0;

  return {
    tier: userTier,
    percentile: userTier.percentile,
    exactPercentile: exactPercentile.toFixed(2),
    nextTier,
    progressPercent,
    xrpToNextTier,
    currentThreshold: userThreshold.minimumXrp,
    nextThreshold: nextThreshold?.minimumXrp || null,
  };
}

function calculateExactPercentile(
  balance: number,
  thresholdsData: CachedThresholds
): number {
  const { thresholds } = thresholdsData;

  // Sort thresholds by minimumXrp ascending
  const sortedByBalance = [...thresholds].sort(
    (a, b) => a.minimumXrp - b.minimumXrp
  );

  // Find where the balance falls
  for (let i = sortedByBalance.length - 1; i >= 0; i--) {
    const threshold = sortedByBalance[i];
    if (balance >= threshold.minimumXrp) {
      // Interpolate between this tier and the next
      const nextThreshold = sortedByBalance[i + 1];
      if (!nextThreshold) {
        // User is in the highest tier, estimate based on balance
        return Math.max(0.001, threshold.percentile * (threshold.minimumXrp / balance));
      }

      // Linear interpolation between tier boundaries
      const balanceRange = nextThreshold.minimumXrp - threshold.minimumXrp;
      const percentileRange = threshold.percentile - nextThreshold.percentile;
      const balanceProgress = (balance - threshold.minimumXrp) / balanceRange;

      return Math.max(
        nextThreshold.percentile,
        threshold.percentile - percentileRange * balanceProgress
      );
    }
  }

  // User has less than the lowest threshold
  return 100;
}

function calculateProgressPercent(
  balance: number,
  currentMin: number,
  nextMin: number
): number {
  if (balance >= nextMin) return 100;
  if (balance <= currentMin) return 0;

  const range = nextMin - currentMin;
  const progress = balance - currentMin;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}
