import { NextRequest, NextResponse } from 'next/server';
import { runDistributionScan, getScanStatus } from '@/lib/services/distribution-scanner';
import { setScanProgress } from '@/lib/cache';

// Simple API key auth (set SCAN_API_KEY env var)
function isAuthorized(request: NextRequest): boolean {
  const apiKey = process.env.SCAN_API_KEY;

  // If no API key is configured, only allow internal requests
  if (!apiKey) {
    // Allow requests from localhost or Fly.io internal network
    const host = request.headers.get('host') || '';
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    return (
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      forwardedFor.includes('127.0.0.1') ||
      host.endsWith('.internal')
    );
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === apiKey;
  }

  // Check query param as fallback
  const url = new URL(request.url);
  return url.searchParams.get('key') === apiKey;
}

export async function POST(request: NextRequest) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Check if scan is already running (from Redis - shared across machines)
  const status = await getScanStatus();
  if (status.status === 'running') {
    return NextResponse.json(
      {
        error: 'Scan already in progress',
        code: 'SCAN_IN_PROGRESS',
        progress: status,
      },
      { status: 409 }
    );
  }

  // Update Redis FIRST so status is immediately visible to clients
  const startedAt = Date.now();
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

  // Start scan in background (don't await)
  runDistributionScan()
    .then((result) => {
      if (result.success) {
        console.log(
          `[API] Scan completed: ${result.totalAccounts} accounts in ${result.duration}s`
        );
      } else {
        console.error(`[API] Scan failed: ${result.error}`);
      }
    })
    .catch(async (err) => {
      console.error('[API] Scan error:', err);
      // Update Redis to failed if background task crashes
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
    message: 'Scan started',
    status: 'running',
    startedAt: new Date(startedAt).toISOString(),
  });
}

// Also allow GET for simple cron services that only support GET
export async function GET(request: NextRequest) {
  return POST(request);
}
