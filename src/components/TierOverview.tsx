'use client';

const TIERS = [
  { name: 'Whale', emoji: '🐋', percentile: 'Top 0.01%', color: '#3B82F6' },
  { name: 'Shark', emoji: '🦈', percentile: 'Top 0.1%', color: '#64748B' },
  { name: 'Dolphin', emoji: '🐬', percentile: 'Top 1%', color: '#06B6D4' },
  { name: 'Tuna', emoji: '🐟', percentile: 'Top 5%', color: '#0D9488' },
  { name: 'Squid', emoji: '🦑', percentile: 'Top 10%', color: '#8B5CF6' },
  { name: 'Shrimp', emoji: '🦐', percentile: 'Top 25%', color: '#F472B6' },
  { name: 'Crab', emoji: '🦀', percentile: 'Top 50%', color: '#F97316' },
  { name: 'Plankton', emoji: '🦠', percentile: 'Bottom 50%', color: '#22C55E' },
];

export default function TierOverview() {
  return (
    <div className="mt-24 mb-12">
      <h2 className="text-center text-2xl font-bold text-xrp-white mb-2">
        The Tiers
      </h2>
      <p className="text-center text-xrp-mist mb-10">
        Where do you rank in the ocean?
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIERS.map((tier, index) => (
          <div
            key={tier.name}
            className="group relative p-5 rounded-2xl bg-xrp-charcoal border border-xrp-slate transition-all duration-300 hover:border-opacity-50 hover:scale-105 cursor-default animate-fade-in-up"
            style={{
              animationDelay: `${index * 100}ms`,
              borderColor: `${tier.color}30`,
            }}
          >
            {/* Glow effect on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
              style={{ backgroundColor: tier.color }}
            />

            <div className="relative text-center">
              <span className="text-4xl block mb-2">{tier.emoji}</span>
              <span
                className="font-bold block"
                style={{ color: tier.color }}
              >
                {tier.name}
              </span>
              <span className="text-xs text-xrp-mist">{tier.percentile}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
