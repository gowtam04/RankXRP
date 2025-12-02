'use client';

interface BalanceCardProps {
  balance: number;
  balanceUsd: number;
  address: string;
}

function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUsd(num: number): string {
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function BalanceCard({
  balance,
  balanceUsd,
  address,
}: BalanceCardProps) {
  return (
    <div className="card animate-fade-in-up animation-delay-500">
      {/* Wallet Address */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xrp-mist text-sm font-medium">Wallet</span>
        <code className="text-wallet text-sm bg-xrp-charcoal px-3 py-1.5 rounded-lg">
          {truncateAddress(address)}
        </code>
      </div>

      {/* Balance Section */}
      <div className="space-y-2">
        <span className="text-xrp-mist text-sm font-medium block">Balance</span>

        {/* XRP Balance */}
        <div className="flex items-baseline gap-2">
          <span className="text-balance-display">
            {formatNumber(balance, balance < 100 ? 6 : 2)}
          </span>
          <span className="text-xl font-semibold text-gradient">XRP</span>
        </div>

        {/* USD Equivalent */}
        <div className="text-xrp-mist text-lg">
          {formatUsd(balanceUsd)}
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="mt-6 h-1 rounded-full bg-gradient-ocean opacity-50" />
    </div>
  );
}
