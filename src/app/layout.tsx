import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RankXRP - XRP Holder Rankings',
  description:
    'Discover where you rank among XRP holders. Check your tier, percentile, and progress to the next level.',
  keywords: ['XRP', 'XRPL', 'cryptocurrency', 'ranking', 'wealth distribution'],
  authors: [{ name: 'RankXRP' }],
  openGraph: {
    title: 'RankXRP - XRP Holder Rankings',
    description: 'Discover where you rank among XRP holders.',
    url: 'https://rankxrp.com',
    siteName: 'RankXRP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RankXRP - XRP Holder Rankings',
    description: 'Discover where you rank among XRP holders.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-xrp-dark text-xrp-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
