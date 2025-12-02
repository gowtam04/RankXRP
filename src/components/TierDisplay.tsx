'use client';

interface TierDisplayProps {
  tier: string;
  emoji: string;
  color: string;
  percentile: number;
  exactPercentile: string;
}

export default function TierDisplay({
  tier,
  emoji,
  color,
  percentile,
  exactPercentile,
}: TierDisplayProps) {
  // Format the percentile display
  const percentileText =
    percentile < 1
      ? `Top ${exactPercentile}%`
      : percentile === 100
        ? 'XRP Holder'
        : `Top ${exactPercentile}%`;

  return (
    <div className="text-center">
      {/* Tier Emoji with glow effect */}
      <div
        className="relative inline-block animate-tier-reveal"
        style={
          {
            '--tier-color': color,
          } as React.CSSProperties
        }
      >
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 blur-3xl opacity-30 animate-pulse-glow"
          style={{ backgroundColor: color }}
        />

        {/* Emoji */}
        <span
          className="relative text-8xl md:text-9xl block animate-float"
          role="img"
          aria-label={tier}
        >
          {emoji}
        </span>
      </div>

      {/* Tier Name */}
      <h2
        className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight animate-fade-in-up animation-delay-200"
        style={{ color }}
      >
        {tier}
      </h2>

      {/* Percentile Badge */}
      <div className="mt-4 animate-fade-in-up animation-delay-300">
        <span
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-lg font-semibold"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}40`,
            color: color,
          }}
        >
          {percentileText}
        </span>
      </div>

      {/* Decorative line */}
      <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in animation-delay-400">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-xrp-slate" />
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-xrp-slate" />
      </div>
    </div>
  );
}
