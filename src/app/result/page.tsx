'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/Header';
import TierDisplay from '@/components/TierDisplay';
import BalanceCard from '@/components/BalanceCard';
import ProgressToNextTier from '@/components/ProgressToNextTier';
import ParticleBackground from '@/components/ParticleBackground';
import Link from 'next/link';

interface LookupData {
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
  timestamp: number;
}

interface ErrorData {
  error: string;
  code?: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address');

  const [data, setData] = useState<LookupData | null>(null);
  const [error, setError] = useState<ErrorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setError({ error: 'No address provided', code: 'MISSING_ADDRESS' });
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/lookup?address=${encodeURIComponent(address)}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result);
        } else {
          setData(result);
        }
      } catch {
        setError({ error: 'Failed to fetch data. Please try again.', code: 'NETWORK_ERROR' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            {/* Animated rings */}
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full border-4 border-ocean-abyss" />
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-ocean-abyss border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-xrp-mist text-lg animate-pulse">
            Diving into the depths...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center animate-fade-in-up">
          <div className="text-6xl mb-4">
            {error.code === 'ACCOUNT_NOT_FOUND' ? '🔍' : '⚠️'}
          </div>
          <h2 className="text-xl font-bold text-xrp-white mb-2">
            {error.code === 'ACCOUNT_NOT_FOUND'
              ? 'Account Not Found'
              : 'Something Went Wrong'}
          </h2>
          <p className="text-xrp-mist mb-6">{error.error}</p>
          <Link href="/" className="btn-primary inline-flex">
            Try Another Address
          </Link>
        </div>
      </div>
    );
  }

  // Success State
  if (!data) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      {/* Tier Display */}
      <div className="mb-10">
        <TierDisplay
          tier={data.tier}
          emoji={data.tierEmoji}
          color={data.tierColor}
          percentile={data.percentile}
          exactPercentile={data.exactPercentile}
        />
      </div>

      {/* Balance Card */}
      <BalanceCard
        balance={data.balance}
        balanceUsd={data.balanceUsd}
        address={data.address}
      />

      {/* Progress to Next Tier */}
      <div className="mt-6">
        <ProgressToNextTier
          progressPercent={data.progressPercent}
          xrpToNextTier={data.xrpToNextTier}
          xrpToNextTierUsd={data.xrpToNextTierUsd}
          nextTier={data.nextTier}
          nextTierEmoji={data.nextTierEmoji}
          tierColor={data.tierColor}
        />
      </div>

      {/* Check Another CTA */}
      <div className="mt-10 text-center animate-fade-in-up animation-delay-700">
        <Link href="/" className="btn-secondary inline-flex">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Check Another Wallet
        </Link>
      </div>

      {/* Price Info */}
      <div className="mt-8 text-center text-xrp-mist text-sm animate-fade-in animation-delay-800">
        <p>
          XRP Price: ${data.priceUsd.toFixed(4)} USD
        </p>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial-glow pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        <Header showBackButton />

        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-ocean-abyss border-t-transparent animate-spin" />
            </div>
          }
        >
          <ResultContent />
        </Suspense>
      </div>
    </div>
  );
}
