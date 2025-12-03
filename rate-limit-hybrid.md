# Rate Limiting Hybrid Solution Plan

## Problem Statement

The XRPL distribution scanner iterates through ~7 million accounts using the `ledger_data` command to calculate percentile thresholds for tier rankings. Public XRPL nodes have rate limiting that causes scan failures, especially on Fly.io production where we share IP space with other users.

**Current behavior:**
- Fixed 50ms delay between requests
- Single node connection (with fallback on initial connect only)
- No retry logic for rate limit errors
- Scan takes 20-40 minutes when successful
- Fails frequently due to rate limiting

**Goal:** Make scans resilient to rate limiting without requiring dedicated infrastructure.

---

## Current Implementation

### Key Files

| File | Purpose |
|------|---------|
| [src/lib/services/distribution-scanner.ts](src/lib/services/distribution-scanner.ts) | Main scanner logic |
| [src/lib/cache/scan-progress.ts](src/lib/cache/scan-progress.ts) | Redis progress tracking |
| [src/lib/xrpl/client.ts](src/lib/xrpl/client.ts) | XRPL WebSocket client |
| [src/lib/db/index.ts](src/lib/db/index.ts) | SQLite storage |

### Current Scanner Flow

```
1. Connect to XRPL node (tries 3 nodes sequentially on failure)
2. Get current ledger index
3. Clear existing accounts in SQLite
4. Loop: request ledger_data with marker pagination
   - Process AccountRoot entries
   - Batch insert to SQLite (10,000 at a time)
   - Fixed 50ms delay between requests
   - Update progress in Redis
5. Calculate percentile thresholds
6. Cache thresholds in Redis
```

### Current Constants

```typescript
// In distribution-scanner.ts
const MAINNET_URLS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
];
const DB_BATCH_SIZE = 10000;
const REQUEST_DELAY = 50;  // Fixed delay - THIS IS THE PROBLEM
const LOG_INTERVAL = 100000;
```

### Current Progress Interface

```typescript
// In scan-progress.ts
interface ScanProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  marker: string | null;           // Resume point for pagination
  processedAccounts: number;
  startedAt: number | null;
  completedAt: number | null;
  ledgerIndex: number | null;
  error: string | null;
}
```

---

## Enhancement Plan

### Phase 1: Quick Wins (1-2 hours)

#### 1.1 Exponential Backoff with Jitter

Replace the fixed 50ms delay with adaptive retry logic.

**Add to distribution-scanner.ts:**

```typescript
interface RetryConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxRetries: number;
}

const RETRY_CONFIG: RetryConfig = {
  baseDelayMs: 100,
  maxDelayMs: 30000,  // 30 seconds max
  maxRetries: 5,
};

function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms...
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (0-50% of delay) to prevent thundering herd
  const jitter = Math.random() * cappedDelay * 0.5;

  return cappedDelay + jitter;
}

async function requestWithRetry<T>(
  client: Client,
  request: LedgerDataRequest,
  config: RetryConfig = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await client.request(request);
      return response as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a rate limit error
      const isRateLimit =
        lastError.message.includes('rate') ||
        lastError.message.includes('slowDown') ||
        lastError.message.includes('tooBusy');

      if (!isRateLimit && attempt === 0) {
        // Not a rate limit error, throw immediately
        throw lastError;
      }

      const delay = calculateBackoff(attempt, config);
      console.log(`[Scanner] Rate limited, retry ${attempt + 1}/${config.maxRetries} in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
```

#### 1.2 Node Rotation on Rate Limit

Switch to a different node when rate limited instead of just retrying.

**Add node health tracking:**

```typescript
interface NodeHealth {
  url: string;
  failureCount: number;
  lastFailure: number | null;
  cooldownUntil: number;
}

const MAINNET_URLS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
  'wss://xrpl.ws',  // Add community node
];

const COOLDOWN_MS = 60000;  // 1 minute cooldown after 3 failures

class NodePool {
  private nodes: Map<string, NodeHealth> = new Map();
  private currentIndex: number = 0;

  constructor(urls: string[]) {
    urls.forEach(url => {
      this.nodes.set(url, {
        url,
        failureCount: 0,
        lastFailure: null,
        cooldownUntil: 0,
      });
    });
  }

  getNextNode(): string {
    const now = Date.now();
    const urls = Array.from(this.nodes.keys());

    // Try each node starting from current index
    for (let i = 0; i < urls.length; i++) {
      const index = (this.currentIndex + i) % urls.length;
      const url = urls[index];
      const health = this.nodes.get(url)!;

      // Skip if in cooldown
      if (health.cooldownUntil > now) {
        continue;
      }

      this.currentIndex = (index + 1) % urls.length;
      return url;
    }

    // All nodes in cooldown, use the one with earliest cooldown end
    let earliest = urls[0];
    let earliestTime = this.nodes.get(earliest)!.cooldownUntil;

    for (const url of urls) {
      const health = this.nodes.get(url)!;
      if (health.cooldownUntil < earliestTime) {
        earliest = url;
        earliestTime = health.cooldownUntil;
      }
    }

    return earliest;
  }

  reportFailure(url: string): void {
    const health = this.nodes.get(url);
    if (!health) return;

    health.failureCount++;
    health.lastFailure = Date.now();

    // After 3 failures, put node in cooldown
    if (health.failureCount >= 3) {
      health.cooldownUntil = Date.now() + COOLDOWN_MS;
      health.failureCount = 0;
      console.log(`[Scanner] Node ${url} in cooldown for ${COOLDOWN_MS / 1000}s`);
    }
  }

  reportSuccess(url: string): void {
    const health = this.nodes.get(url);
    if (!health) return;

    // Reset failure count on success
    health.failureCount = 0;
  }
}
```

#### 1.3 Increase Cache TTL

**In [src/lib/cache/thresholds.ts](src/lib/cache/thresholds.ts):**

```typescript
// Change from 1 hour to 24 hours
const THRESHOLDS_CACHE_TTL = 24 * 60 * 60;  // 24 hours
```

**Rationale:** Distribution changes slowly. Serving slightly stale data is better than failing scans.

---

### Phase 2: Resilience (2-4 hours)

#### 2.1 Adaptive Rate Limiting

Adjust delay based on response times, not just errors.

```typescript
interface AdaptiveRateLimiter {
  currentDelayMs: number;
  minDelayMs: number;
  maxDelayMs: number;
  targetResponseMs: number;
  successStreak: number;
}

const rateLimiter: AdaptiveRateLimiter = {
  currentDelayMs: 100,   // Start conservative
  minDelayMs: 20,        // Don't go below 20ms
  maxDelayMs: 5000,      // Don't exceed 5s for normal operation
  targetResponseMs: 1000, // Target 1s response time
  successStreak: 0,
};

function adjustRateLimit(responseTimeMs: number, wasError: boolean): number {
  if (wasError) {
    // Double delay on error, reset streak
    rateLimiter.currentDelayMs = Math.min(
      rateLimiter.currentDelayMs * 2,
      rateLimiter.maxDelayMs
    );
    rateLimiter.successStreak = 0;
    return rateLimiter.currentDelayMs;
  }

  rateLimiter.successStreak++;

  if (responseTimeMs > rateLimiter.targetResponseMs * 2) {
    // Response too slow, increase delay by 50%
    rateLimiter.currentDelayMs = Math.min(
      rateLimiter.currentDelayMs * 1.5,
      rateLimiter.maxDelayMs
    );
    rateLimiter.successStreak = 0;
  } else if (
    responseTimeMs < rateLimiter.targetResponseMs * 0.5 &&
    rateLimiter.successStreak >= 10
  ) {
    // Fast responses and streak, decrease delay by 10%
    rateLimiter.currentDelayMs = Math.max(
      rateLimiter.currentDelayMs * 0.9,
      rateLimiter.minDelayMs
    );
  }

  return rateLimiter.currentDelayMs;
}
```

#### 2.2 Enhanced Checkpoint/Resume

Current implementation saves progress but doesn't resume well. Enhance it:

**Update ScanProgress interface:**

```typescript
interface ScanProgress {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  marker: string | null;
  processedAccounts: number;
  startedAt: number | null;
  completedAt: number | null;
  ledgerIndex: number | null;
  error: string | null;
  // NEW FIELDS
  lastCheckpoint: number | null;     // Timestamp of last successful batch
  consecutiveErrors: number;          // Track error streaks
  nodeUrl: string | null;            // Which node we were using
  estimatedTotalAccounts: number;    // For progress percentage
}
```

**Add resume logic to runDistributionScan():**

```typescript
export async function runDistributionScan(forceRestart = false): Promise<ScanResult> {
  const startTime = Date.now();
  let client: Client | null = null;

  // Check for resumable scan
  const existingProgress = await getScanProgress();
  const canResume =
    !forceRestart &&
    existingProgress.status === 'paused' &&
    existingProgress.marker &&
    existingProgress.ledgerIndex;

  if (canResume) {
    console.log(`[Scanner] Resuming from ${existingProgress.processedAccounts.toLocaleString()} accounts`);
  }

  // ... rest of implementation

  // In the main loop, start from existing marker if resuming
  let marker: string | undefined = canResume
    ? existingProgress.marker || undefined
    : undefined;
  let totalProcessed = canResume
    ? existingProgress.processedAccounts
    : 0;

  // Don't clear accounts if resuming!
  if (!canResume) {
    clearAccounts();
  }

  // ... continue with scan loop
}
```

**Add pause-on-error logic:**

```typescript
// In the main loop, after catching errors:
catch (error) {
  const progress = await getScanProgress();
  const consecutiveErrors = (progress.consecutiveErrors || 0) + 1;

  if (consecutiveErrors >= 5) {
    // Pause scan for later resumption instead of failing
    await updateScanProgress({
      status: 'paused',
      consecutiveErrors,
      error: 'Paused after 5 consecutive errors',
      lastCheckpoint: Date.now(),
    });

    console.log('[Scanner] Paused scan after 5 consecutive errors. Can resume later.');

    return {
      success: false,
      totalAccounts: totalProcessed,
      thresholds: [],
      duration: (Date.now() - startTime) / 1000,
      error: 'Scan paused - can be resumed',
    };
  }

  await updateScanProgress({ consecutiveErrors });
  // Continue with retry logic...
}
```

#### 2.3 Connection Keepalive and Reconnection

Handle connection drops mid-scan:

```typescript
async function ensureConnected(
  client: Client | null,
  nodePool: NodePool
): Promise<Client> {
  if (client?.isConnected()) {
    return client;
  }

  // Disconnect if exists but not connected
  if (client) {
    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }

  // Connect to next available node
  const url = nodePool.getNextNode();
  const newClient = new Client(url, {
    connectionTimeout: 30000,
  });

  await newClient.connect();
  console.log(`[Scanner] Connected to ${url}`);

  return newClient;
}
```

---

### Phase 3: Scheduling (1 hour)

#### 3.1 Off-Peak Scheduling

Add a utility to check optimal scan times:

```typescript
function isOptimalScanTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Optimal: 2-6 AM UTC (lowest global activity)
  // Avoid: 2-6 PM UTC (US market hours overlap with Asia evening)
  return utcHour >= 2 && utcHour <= 6;
}

function getNextOptimalScanTime(): Date {
  const now = new Date();
  const next = new Date(now);

  next.setUTCHours(3, 0, 0, 0);  // 3 AM UTC

  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}
```

#### 3.2 Cron Job Setup

Add a cron endpoint or script that respects optimal times:

**In [src/app/api/scan/cron/route.ts](src/app/api/scan/cron/route.ts) (new file):**

```typescript
import { NextResponse } from 'next/server';
import { runDistributionScan } from '@/lib/services/distribution-scanner';

export async function GET(request: Request) {
  // Verify cron secret (Fly.io or Vercel cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if it's a good time to scan
  const now = new Date();
  const utcHour = now.getUTCHours();
  const isOptimalTime = utcHour >= 2 && utcHour <= 6;

  if (!isOptimalTime) {
    return NextResponse.json({
      message: 'Skipping scan - not optimal time',
      nextOptimalTime: getNextOptimalScanTime().toISOString(),
    });
  }

  // Run scan
  const result = await runDistributionScan();

  return NextResponse.json(result);
}
```

---

### Phase 4: Future Optimization (Optional, 4+ hours)

#### 4.1 Incremental Updates

Instead of scanning all 7M accounts daily, only scan changed accounts.

**Approach:**
1. Subscribe to ledger close events
2. Track accounts with transactions in each ledger
3. Update only those accounts in the database
4. Recalculate thresholds from updated dataset

**Note:** This is complex and may not be needed if Phases 1-3 solve the problem.

---

## Implementation Checklist

### Phase 1 (Do First)
- [ ] Add `calculateBackoff()` function with exponential backoff + jitter
- [ ] Add `requestWithRetry()` wrapper for ledger_data requests
- [ ] Implement `NodePool` class for node rotation
- [ ] Update `connectToXrpl()` to use NodePool
- [ ] Increase threshold cache TTL to 24 hours
- [ ] Test with `npm run scan`

### Phase 2 (Do Second)
- [ ] Add `AdaptiveRateLimiter` that adjusts based on response times
- [ ] Add `status: 'paused'` to ScanProgress
- [ ] Implement resume logic in `runDistributionScan()`
- [ ] Add `ensureConnected()` for mid-scan reconnection
- [ ] Add checkpoint saving every N batches
- [ ] Test resume by killing mid-scan

### Phase 3 (Do Third)
- [ ] Add `isOptimalScanTime()` utility
- [ ] Create `/api/scan/cron` endpoint
- [ ] Configure Fly.io or external cron to call endpoint
- [ ] Test scheduled execution

### Testing

```bash
# Run scan locally
npm run scan

# Monitor progress
curl http://localhost:3000/api/scan/status

# Trigger via API
curl -X POST http://localhost:3000/api/scan/trigger \
  -H "Authorization: Bearer $SCAN_API_KEY"
```

---

## Success Criteria

1. **Scans complete successfully** on Fly.io production without manual intervention
2. **Automatic retry** on rate limit errors with backoff
3. **Node rotation** when one node is throttling
4. **Resume capability** if scan is interrupted
5. **24-hour threshold cache** reduces scan urgency
6. **Scheduled scans** during off-peak hours

---

## Alternative: Contact XRPScan

If this hybrid approach still fails, contact XRPScan for bulk data access:

```
Subject: Data Access Request - XRP Balance Distribution for RankXRP.com

Hi XRPScan Team,

I'm building RankXRP (https://rankxrp.fly.dev), an open-source tool that shows
XRP holders their tier ranking (Whale to Plankton) and percentile position
among all XRPL accounts.

To calculate accurate percentile thresholds, I currently scan all ~7M XRPL
accounts using ledger_data pagination. This works but puts load on public
nodes and encounters rate limiting.

I noticed XRPScan already calculates and displays balance distribution data
at xrpscan.com/balances. I'm reaching out to ask about data access options:

1. Is there an API endpoint for balance distribution/percentile data?
2. Would you consider providing periodic bulk exports of account balance
   distributions (not individual accounts, just aggregated tier thresholds)?
3. What are the terms for non-commercial/open-source projects?

I only need threshold values like "top 1% = X XRP, top 5% = Y XRP" etc. -
not individual account data. This would be a one-time daily/weekly fetch
rather than continuous API calls.

Happy to discuss licensing, attribution, or any other requirements.

Thanks for building such a great explorer!

Best,
[Your Name]
```

---

## References

- [XRPL ledger_data API](https://xrpl.org/docs/references/http-websocket-apis/public-api-methods/ledger-methods/ledger_data)
- [xrp-ledgerstats tool](https://github.com/WietseWind/xrp-ledgerstats) - Similar implementation by Wietse Wind
- [XRPScan Balance Distribution](https://xrpscan.com/balances) - Pre-computed data we could use
