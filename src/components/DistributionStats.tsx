import { TIERS } from '@/lib/constants/tiers';

interface Threshold {
  name: string;
  emoji: string;
  percentile: number;
  minimumXrp: number;
}

interface DistributionStatsProps {
  totalAccounts: number;
  thresholds: Threshold[];
  lastUpdated: number;
  currentTier?: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function formatXrp(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(0) + 'K';
  }
  return num.toLocaleString();
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) === 1 ? '' : 's'} ago`;
}

export default function DistributionStats({
  totalAccounts,
  thresholds,
  lastUpdated,
  currentTier,
}: DistributionStatsProps) {
  // Get tier colors from constants
  const getTierColor = (tierName: string): string => {
    const tier = TIERS.find(t => t.name.toLowerCase() === tierName.toLowerCase());
    return tier?.color || '#9CA3AF';
  };

  return (
    <div className="card animate-fade-in-up animation-delay-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-xrp-white">
          XRP Distribution
        </h3>
        <span className="text-xs text-xrp-mist">
          Updated {getRelativeTime(lastUpdated)}
        </span>
      </div>

      {/* Total Accounts */}
      <div className="bg-xrp-charcoal rounded-lg p-4 mb-4">
        <div className="text-xrp-mist text-sm mb-1">Funded XRP Accounts</div>
        <div className="text-2xl font-bold text-xrp-white">
          {formatNumber(totalAccounts)}
        </div>
      </div>

      {/* Tier Thresholds Table */}
      <div className="overflow-hidden rounded-lg border border-xrp-slate">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-xrp-charcoal text-xrp-mist">
              <th className="text-left py-2 px-3 font-medium">Tier</th>
              <th className="text-right py-2 px-3 font-medium">Top %</th>
              <th className="text-right py-2 px-3 font-medium">Min XRP</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((threshold, index) => {
              const isCurrentTier = currentTier?.toLowerCase() === threshold.name.toLowerCase();
              const tierColor = getTierColor(threshold.name);

              return (
                <tr
                  key={threshold.name}
                  className={`
                    border-t border-xrp-slate/50
                    ${isCurrentTier ? 'bg-xrp-slate/30' : ''}
                    ${index % 2 === 0 ? 'bg-xrp-dark/30' : ''}
                  `}
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span>{threshold.emoji}</span>
                      <span
                        className={`font-medium ${isCurrentTier ? '' : 'text-xrp-mist'}`}
                        style={isCurrentTier ? { color: tierColor } : undefined}
                      >
                        {threshold.name}
                      </span>
                      {isCurrentTier && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${tierColor}20`,
                            color: tierColor,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-xrp-mist">
                    {threshold.percentile < 1
                      ? threshold.percentile.toFixed(2)
                      : threshold.percentile}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xrp-mist">
                    {formatXrp(threshold.minimumXrp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
