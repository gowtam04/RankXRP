export interface LookupResponse {
  address: string;
  balance: number;
  balanceUsd: number;
  tier: string;
  tierEmoji: string;
  tierColor: string;
  percentile: number;
  exactPercentile: string;
  nextTier: string | null;
  nextTierEmoji: string | null;
  progressPercent: number;
  xrpToNextTier: number;
  xrpToNextTierUsd: number;
  priceUsd: number;
  priceTimestamp: number;
  timestamp: number;
}

export interface ThresholdsResponse {
  thresholds: {
    name: string;
    emoji: string;
    percentile: number;
    minimumXrp: number;
  }[];
  lastUpdated: number;
}

export interface StatsResponse {
  totalAccounts: number;
  medianBalance: number;
  lastUpdated: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}
