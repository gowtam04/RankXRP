import Header from '@/components/Header';
import WalletForm from '@/components/WalletForm';
import TierOverview from '@/components/TierOverview';
import ParticleBackground from '@/components/ParticleBackground';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 bg-gradient-radial-glow pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        <Header />

        <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in-up">
            {/* Decorative elements */}
            <div className="flex justify-center gap-3 mb-6">
              <span className="text-3xl animate-float animation-delay-100">🐋</span>
              <span className="text-3xl animate-float animation-delay-200">🦈</span>
              <span className="text-3xl animate-float animation-delay-300">🐬</span>
            </div>

            <h1 className="text-hero mb-4">
              <span className="text-xrp-white">Where do </span>
              <span className="text-gradient">you</span>
              <span className="text-xrp-white"> rank?</span>
            </h1>

            <p className="text-xl text-xrp-mist max-w-md mx-auto leading-relaxed">
              Discover your position among{' '}
              <span className="text-ocean-glow font-medium">4.8 million</span>{' '}
              XRP holders worldwide.
            </p>
          </div>

          {/* Wallet Form */}
          <div className="animate-fade-in-up animation-delay-200">
            <WalletForm />
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-16 animate-fade-in-up animation-delay-400">
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-xrp-slate flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-ocean-abyss"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-xrp-white block">Real-time</span>
              <span className="text-xs text-xrp-mist">Live XRPL data</span>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-xrp-slate flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-ocean-surface"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-xrp-white block">Private</span>
              <span className="text-xs text-xrp-mist">No signup needed</span>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-xrp-slate flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-ocean-deep"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-xrp-white block">Accurate</span>
              <span className="text-xs text-xrp-mist">Exact percentile</span>
            </div>
          </div>

          {/* Tier Overview */}
          <TierOverview />

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-xrp-slate text-center animate-fade-in">
            <p className="text-xrp-mist text-sm">
              Data sourced from{' '}
              <span className="text-ocean-abyss">XRPL</span>
              {' '}&bull;{' '}
              Price data from{' '}
              <span className="text-ocean-abyss">CoinGecko</span>
            </p>
            <p className="text-xrp-mist/50 text-xs mt-2">
              Made with care for the XRP community
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
