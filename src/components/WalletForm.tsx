'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function WalletForm() {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateAddress = (addr: string): boolean => {
    // Basic XRP address validation (starts with r and is 25-35 chars)
    if (!addr) return false;
    if (addr.startsWith('r') && addr.length >= 25 && addr.length <= 35) {
      return true;
    }
    // X-address format
    if ((addr.startsWith('X') || addr.startsWith('T')) && addr.length >= 40) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateAddress(trimmedAddress)) {
      setError('Invalid XRP address format');
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to results page with address as query param
      router.push(`/result?address=${encodeURIComponent(trimmedAddress)}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError('');
          }}
          placeholder="Enter XRP wallet address (r...)"
          className={`input-wallet pr-4 ${error ? 'error' : ''}`}
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Decorative glow effect */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-ocean opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-20" />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 animate-fade-in">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !address.trim()}
        className="btn-primary w-full mt-6 text-lg group"
      >
        {isLoading ? (
          <span className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Checking...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Check My Rank
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}
