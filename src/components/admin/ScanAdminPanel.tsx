'use client';

import { useState, useEffect, useCallback } from 'react';

interface ScanStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalAccounts: number;
  processedAccounts: number;
  startedAt: string | null;
  completedAt: string | null;
  ledgerIndex: number | null;
  error: string | null;
  thresholds: Array<{
    name: string;
    emoji: string;
    percentile: number;
    minimumXrp: number;
    updatedAt: string;
  }>;
}

const STATUS_COLORS = {
  idle: { bg: 'bg-xrp-mist/20', text: 'text-xrp-mist', dot: 'bg-xrp-mist' },
  running: { bg: 'bg-ocean-abyss/20', text: 'text-ocean-abyss', dot: 'bg-ocean-abyss animate-pulse' },
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
};

export default function ScanAdminPanel() {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering dynamic timestamps after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scan/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Poll every 5 seconds when running
    const interval = setInterval(() => {
      if (status?.status === 'running' || isLoading) {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStatus, status?.status, isLoading]);

  const triggerScan = async () => {
    if (!apiKey.trim()) {
      setError('API key required');
      return;
    }

    setIsTriggering(true);
    setError(null);

    try {
      const res = await fetch('/api/scan/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger scan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsTriggering(false);
      // Always refresh status after trigger attempt (success or failure)
      await fetchStatus();
    }
  };

  const formatNumber = (n: number) => n.toLocaleString();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getElapsedTime = (startedAt: string | null) => {
    if (!startedAt) return '—';
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}m ${secs}s`;
  };

  const statusColors = status ? STATUS_COLORS[status.status] : STATUS_COLORS.idle;

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <section className="border border-xrp-slate/50 rounded-lg overflow-hidden">
        <div className="bg-xrp-slate/20 px-4 py-2 border-b border-xrp-slate/50">
          <h2 className="font-mono text-xs uppercase tracking-widest text-xrp-mist/70">
            Control Panel
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="password"
              placeholder="Enter API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#0d0f11] border border-xrp-slate/50 rounded font-mono text-sm text-xrp-white placeholder:text-xrp-mist/40 focus:outline-none focus:border-ocean-abyss transition-colors"
            />
            <button
              onClick={triggerScan}
              disabled={isTriggering || status?.status === 'running'}
              className="px-6 py-3 bg-ocean-abyss/20 border border-ocean-abyss/50 rounded font-mono text-sm text-ocean-abyss hover:bg-ocean-abyss/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isTriggering ? (
                <>
                  <span className="w-4 h-4 border-2 border-ocean-abyss/30 border-t-ocean-abyss rounded-full animate-spin" />
                  Triggering...
                </>
              ) : status?.status === 'running' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-ocean-abyss animate-pulse" />
                  Scan Running
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Scan
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded font-mono text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Current Status */}
      <section className="border border-xrp-slate/50 rounded-lg overflow-hidden">
        <div className="bg-xrp-slate/20 px-4 py-2 border-b border-xrp-slate/50 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-xrp-mist/70">
            Current Status
          </h2>
          <button
            onClick={fetchStatus}
            className="text-xrp-mist/50 hover:text-xrp-mist transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-xrp-mist/30 border-t-xrp-mist rounded-full animate-spin" />
            </div>
          ) : status ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Status Badge */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50 mb-2">
                  Status
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded ${statusColors.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
                  <span className={`font-mono text-sm uppercase ${statusColors.text}`}>
                    {status.status}
                  </span>
                </div>
              </div>

              {/* Processed Accounts */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50 mb-2">
                  Processed
                </div>
                <div className="font-mono text-xl text-xrp-white">
                  {formatNumber(status.processedAccounts)}
                </div>
              </div>

              {/* Ledger Index */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50 mb-2">
                  Ledger Index
                </div>
                <div className="font-mono text-xl text-xrp-white">
                  {status.ledgerIndex ? formatNumber(status.ledgerIndex) : '—'}
                </div>
              </div>

              {/* Elapsed/Started */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50 mb-2">
                  {status.status === 'running' ? 'Elapsed' : 'Started'}
                </div>
                <div className="font-mono text-xl text-xrp-white">
                  {status.status === 'running'
                    ? getElapsedTime(status.startedAt)
                    : formatDate(status.startedAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xrp-mist/50 font-mono text-sm">
              No status available
            </div>
          )}

          {/* Progress Bar (when running) */}
          {status?.status === 'running' && status.processedAccounts > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50">
                  Progress
                </span>
                <span className="font-mono text-xs text-xrp-mist">
                  ~{Math.round((status.processedAccounts / 6500000) * 100)}% (est. 6.5M accounts)
                </span>
              </div>
              <div className="h-2 bg-[#0d0f11] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ocean-abyss to-ocean-surface transition-all duration-500"
                  style={{ width: `${Math.min((status.processedAccounts / 6500000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {status?.status === 'failed' && status.error && (
            <div className="mt-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded font-mono text-sm text-red-400">
              <span className="text-red-500 font-semibold">Error:</span> {status.error}
            </div>
          )}
        </div>
      </section>

      {/* Thresholds Table */}
      {status?.thresholds && status.thresholds.length > 0 && (
        <section className="border border-xrp-slate/50 rounded-lg overflow-hidden">
          <div className="bg-xrp-slate/20 px-4 py-2 border-b border-xrp-slate/50 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-xrp-mist/70">
              Calculated Thresholds
            </h2>
            {status.thresholds[0]?.updatedAt && (
              <span className="font-mono text-[10px] text-xrp-mist/50">
                Last updated: {formatDate(status.thresholds[0].updatedAt)}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-xrp-slate/30">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50">
                    Percentile
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-xrp-mist/50">
                    Min XRP
                  </th>
                </tr>
              </thead>
              <tbody>
                {status.thresholds.map((t, i) => (
                  <tr
                    key={t.name}
                    className={`border-b border-xrp-slate/20 ${i % 2 === 0 ? 'bg-xrp-slate/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{t.emoji}</span>
                        <span className="font-mono text-sm text-xrp-white">{t.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-xrp-mist">
                      Top {t.percentile}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-ocean-abyss">
                      {formatNumber(Math.round(t.minimumXrp))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {status.totalAccounts > 0 && (
            <div className="px-4 py-3 bg-xrp-slate/10 border-t border-xrp-slate/30">
              <span className="font-mono text-xs text-xrp-mist/50">
                Based on {formatNumber(status.totalAccounts)} funded accounts
              </span>
            </div>
          )}
        </section>
      )}

      {/* Terminal Log */}
      <section className="border border-xrp-slate/50 rounded-lg overflow-hidden">
        <div className="bg-xrp-slate/20 px-4 py-2 border-b border-xrp-slate/50">
          <h2 className="font-mono text-xs uppercase tracking-widest text-xrp-mist/70">
            System Log
          </h2>
        </div>
        <div className="bg-[#0a0c0e] p-4 font-mono text-xs text-xrp-mist/70 min-h-[120px]">
          <div className="space-y-1">
            {mounted && (
              <div>
                <span className="text-xrp-mist/40">[init]</span>{' '}
                <span className="text-ocean-abyss">INFO</span>{' '}
                Admin panel initialized
              </div>
            )}
            {status?.startedAt && (
              <div>
                <span className="text-xrp-mist/40">[{status.startedAt}]</span>{' '}
                <span className="text-ocean-abyss">INFO</span>{' '}
                Scan started at ledger {status.ledgerIndex || 'unknown'}
              </div>
            )}
            {mounted && status?.status === 'running' && (
              <div>
                <span className="text-xrp-mist/40">[scanning]</span>{' '}
                <span className="text-amber-400">PROGRESS</span>{' '}
                Processed {formatNumber(status.processedAccounts)} entries...
              </div>
            )}
            {status?.status === 'completed' && status.completedAt && (
              <div>
                <span className="text-xrp-mist/40">[{status.completedAt}]</span>{' '}
                <span className="text-emerald-400">SUCCESS</span>{' '}
                Scan completed. {formatNumber(status.totalAccounts)} accounts indexed.
              </div>
            )}
            {mounted && status?.status === 'failed' && (
              <div>
                <span className="text-xrp-mist/40">[error]</span>{' '}
                <span className="text-red-400">ERROR</span>{' '}
                {status.error || 'Scan failed with unknown error'}
              </div>
            )}
            <div className="animate-pulse">
              <span className="text-ocean-abyss">{'>'}</span>
              <span className="inline-block w-2 h-4 bg-ocean-abyss/50 ml-1 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
