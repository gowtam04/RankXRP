import { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import ResultContent from '@/components/ResultContent';

interface Props {
  searchParams: Promise<{ address?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const address = params.address;

  // Default metadata if no address
  if (!address) {
    return {
      title: 'Results | RankXRP',
      description: 'Check your XRP holder ranking',
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rankxrp.com';
    const response = await fetch(`${baseUrl}/api/lookup?address=${encodeURIComponent(address)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        title: 'Results | RankXRP',
        description: 'Check your XRP holder ranking',
      };
    }

    const data = await response.json();

    const ogImageUrl = `${baseUrl}/api/og?tier=${encodeURIComponent(data.tier)}&percentile=${encodeURIComponent(data.exactPercentile)}&emoji=${encodeURIComponent(data.tierEmoji)}&color=${data.tierColor.replace('#', '')}`;

    return {
      title: `${data.tierEmoji} ${data.tier} | RankXRP`,
      description: `Top ${data.exactPercentile}% of XRP holders`,
      openGraph: {
        title: `${data.tierEmoji} ${data.tier} - RankXRP`,
        description: `Top ${data.exactPercentile}% of XRP holders`,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${data.tierEmoji} ${data.tier} - RankXRP`,
        description: `Top ${data.exactPercentile}% of XRP holders`,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: 'Results | RankXRP',
      description: 'Check your XRP holder ranking',
    };
  }
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
