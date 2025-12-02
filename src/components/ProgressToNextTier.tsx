'use client';

interface ProgressToNextTierProps {
  progressPercent: number;
  xrpToNextTier: number;
  xrpToNextTierUsd: number;
  nextTier: string | null;
  nextTierEmoji: string | null;
  tierColor: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatUsd(num: number): string {
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ProgressToNextTier({
  progressPercent,
  xrpToNextTier,
  xrpToNextTierUsd,
  nextTier,
  nextTierEmoji,
  tierColor,
}: ProgressToNextTierProps) {
  // If at max tier (Whale), show different message
  if (!nextTier) {
    return (
      <div className="card animate-fade-in-up animation-delay-600">
        <div className="text-center py-4">
          <span className="text-2xl mb-2 block">
            You&apos;ve reached the top tier!
          </span>
          <span className="text-xrp-mist">
            You&apos;re among the elite XRP whales
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in-up animation-delay-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xrp-mist text-sm font-medium">
          Progress to {nextTierEmoji} {nextTier}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: tierColor }}
        >
          {progressPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-container mb-6">
        <div
          className="progress-fill"
          style={{ width: `${Math.max(2, progressPercent)}%` }}
        />
      </div>

      {/* XRP Needed */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-xrp-charcoal">
        <div>
          <span className="text-xrp-mist text-sm block mb-1">
            XRP needed to reach {nextTierEmoji}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-xrp-white font-mono">
              {formatNumber(xrpToNextTier)}
            </span>
            <span className="text-gradient font-semibold">XRP</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xrp-mist text-sm block mb-1">Value</span>
          <span className="text-lg font-semibold text-xrp-white">
            {formatUsd(xrpToNextTierUsd)}
          </span>
        </div>
      </div>
    </div>
  );
}
