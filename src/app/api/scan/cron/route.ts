import { NextRequest, NextResponse } from 'next/server';
import {
  runDistributionScan,
  getScanStatus,
  isOptimalScanTime,
  getNextOptimalScanTime,
} from '@/lib/services/distribution-scanner';
import { setScanProgress } from '@/lib/cache';

export async function GET(request: NextRequest) {
  // Verify cron secret (Fly.io or external cron service)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured', code: 'NOT_CONFIGURED' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Check if scan is already running
  const status = await getScanStatus();
  if (status.status === 'running') {
    return NextResponse.json({
      message: 'Scan already in progress',
      code: 'SCAN_IN_PROGRESS',
      progress: status,
    });
  }

  // Check if it's a good time to scan
  const isOptimal = isOptimalScanTime();
  if (!isOptimal) {
    const nextOptimalTime = getNextOptimalScanTime();
    return NextResponse.json({
      message: 'Skipping scan - not optimal time (2-6 AM UTC)',
      code: 'SKIPPED_NOT_OPTIMAL_TIME',
      currentUtcHour: new Date().getUTCHours(),
      nextOptimalTime: nextOptimalTime.toISOString(),
    });
  }

  // Start the scan
  const startedAt = Date.now();
  console.log('[Cron] Starting scheduled scan at optimal time');

  await setScanProgress({
    status: 'running',
    marker: null,
    processedAccounts: 0,
    startedAt,
    completedAt: null,
    ledgerIndex: null,
    error: null,
    lastCheckpoint: null,
    consecutiveErrors: 0,
    nodeUrl: null,
    estimatedTotalAccounts: 7000000,
  });

  // Run scan in background
  runDistributionScan()
    .then((result) => {
      if (result.success) {
        console.log(
          `[Cron] Scan completed: ${result.totalAccounts} accounts in ${result.duration}s`
        );
      } else {
        console.error(`[Cron] Scan failed: ${result.error}`);
      }
    })
    .catch(async (err) => {
      console.error('[Cron] Scan error:', err);
      await setScanProgress({
        status: 'failed',
        marker: null,
        processedAccounts: 0,
        startedAt,
        completedAt: Date.now(),
        ledgerIndex: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        lastCheckpoint: Date.now(),
        consecutiveErrors: 0,
        nodeUrl: null,
        estimatedTotalAccounts: 7000000,
      });
    });

  return NextResponse.json({
    message: 'Scheduled scan started',
    status: 'running',
    startedAt: new Date(startedAt).toISOString(),
    isOptimalTime: true,
  });
}
