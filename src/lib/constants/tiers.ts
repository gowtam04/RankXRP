export interface Tier {
  name: string;
  emoji: string;
  percentile: number;
  color: string;
  description: string;
}

export const TIERS: Tier[] = [
  {
    name: 'Whale',
    emoji: '🐋',
    percentile: 0.01,
    color: '#3B82F6',
    description: 'Top 0.01% of XRP holders',
  },
  {
    name: 'Shark',
    emoji: '🦈',
    percentile: 0.1,
    color: '#64748B',
    description: 'Top 0.1% of XRP holders',
  },
  {
    name: 'Dolphin',
    emoji: '🐬',
    percentile: 1,
    color: '#06B6D4',
    description: 'Top 1% of XRP holders',
  },
  {
    name: 'Tuna',
    emoji: '🐟',
    percentile: 5,
    color: '#0D9488',
    description: 'Top 5% of XRP holders',
  },
  {
    name: 'Squid',
    emoji: '🦑',
    percentile: 10,
    color: '#8B5CF6',
    description: 'Top 10% of XRP holders',
  },
  {
    name: 'Shrimp',
    emoji: '🦐',
    percentile: 25,
    color: '#F472B6',
    description: 'Top 25% of XRP holders',
  },
  {
    name: 'Crab',
    emoji: '🦀',
    percentile: 50,
    color: '#F97316',
    description: 'Top 50% of XRP holders',
  },
  {
    name: 'Plankton',
    emoji: '🦠',
    percentile: 100,
    color: '#22C55E',
    description: 'XRP holder',
  },
];

export function getTierByName(name: string): Tier | undefined {
  return TIERS.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

export function getTierByPercentile(percentile: number): Tier {
  for (const tier of TIERS) {
    if (percentile <= tier.percentile) {
      return tier;
    }
  }
  return TIERS[TIERS.length - 1]; // Default to Plankton
}
