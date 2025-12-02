'use client';

import Link from 'next/link';

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  return (
    <header className="relative z-10 py-6">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <span className="text-2xl">
            <span className="text-gradient font-bold">Rank</span>
            <span className="text-xrp-white font-bold">XRP</span>
          </span>
        </Link>

        {/* Back Button or Navigation */}
        {showBackButton ? (
          <Link
            href="/"
            className="btn-secondary py-2.5 px-5 text-sm"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Check Another
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-xrp-mist text-sm hidden sm:block">
              XRP holder rankings
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
