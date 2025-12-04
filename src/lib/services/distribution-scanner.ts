import { Client, LedgerDataRequest } from 'xrpl';

// Type for AccountRoot ledger entry from XRPL
interface AccountRootEntry {
  LedgerEntryType: string;
  Account: string;
  Balance: string;
  index: string;
}
import {
  getDb,
  clearAccounts,
  insertAccountsBatch,
  getAccountCount,
  calculatePercentileThreshold,
  setThresholds,
  closeDb,
} from '@/lib/db';
import { TIERS } from '@/lib/constants/tiers';
import {
  setCachedThresholds,
  TierThreshold,
  getScanProgress,
  updateScanProgress,
} from '@/lib/cache';
import type { ScanProgress } from '@/lib/cache';

const MAINNET_URLS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
  'wss://xrpl.ws',
];

// Batch size for database inserts
const DB_BATCH_SIZE = 10000;

// Progress logging interval
const LOG_INTERVAL = 100000;

// Node cooldown after failures (ms)
const NODE_COOLDOWN_MS = 60000;

// Retry configuration for rate limiting
interface RetryConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxRetries: number;
}

const RETRY_CONFIG: RetryConfig = {
  baseDelayMs: 100,
  maxDelayMs: 30000,
  maxRetries: 5,
};

// Adaptive rate limiter that adjusts based on response times
class AdaptiveRateLimiter {
  private currentDelayMs: number = 100;
  private minDelayMs: number = 20;
  private maxDelayMs: number = 5000;
  private targetResponseMs: number = 1000;
  private successStreak: number = 0;

  adjustDelay(responseTimeMs: number, wasError: boolean): number {
    if (wasError) {
      // Double delay on error, reset streak
      this.currentDelayMs = Math.min(this.currentDelayMs * 2, this.maxDelayMs);
      this.successStreak = 0;
      return this.currentDelayMs;
    }

    this.successStreak++;

    if (responseTimeMs > this.targetResponseMs * 2) {
      // Response too slow, increase delay by 50%
      this.currentDelayMs = Math.min(this.currentDelayMs * 1.5, this.maxDelayMs);
      this.successStreak = 0;
    } else if (
      responseTimeMs < this.targetResponseMs * 0.5 &&
      this.successStreak >= 10
    ) {
      // Fast responses and streak, decrease delay by 10%
      this.currentDelayMs = Math.max(this.currentDelayMs * 0.9, this.minDelayMs);
    }

    return this.currentDelayMs;
  }

  getCurrentDelay(): number {
    return this.currentDelayMs;
  }

  reset(): void {
    this.currentDelayMs = 100;
    this.successStreak = 0;
  }
}

// Node health tracking
interface NodeHealth {
  url: string;
  failureCount: number;
  lastFailure: number | null;
  cooldownUntil: number;
}

class NodePool {
  private nodes: Map<string, NodeHealth> = new Map();
  private currentIndex: number = 0;

  constructor(urls: string[]) {
    urls.forEach((url) => {
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
      health.cooldownUntil = Date.now() + NODE_COOLDOWN_MS;
      health.failureCount = 0;
      console.log(`[Scanner] Node ${url} in cooldown for ${NODE_COOLDOWN_MS / 1000}s`);
    }
  }

  reportSuccess(url: string): void {
    const health = this.nodes.get(url);
    if (!health) return;

    // Reset failure count on success
    health.failureCount = 0;
  }
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms...
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (0-50% of delay) to prevent thundering herd
  const jitter = Math.random() * cappedDelay * 0.5;

  return cappedDelay + jitter;
}

function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate') ||
    message.includes('slowdown') ||
    message.includes('toobusy') ||
    message.includes('too busy') ||
    message.includes('exceeded')
  );
}

async function requestWithRetry<T>(
  client: Client,
  request: LedgerDataRequest,
  nodePool: NodePool,
  nodeUrl: string,
  config: RetryConfig = RETRY_CONFIG
): Promise<{ result: T; shouldRotateNode: boolean }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await client.request(request);
      nodePool.reportSuccess(nodeUrl);
      return { result: response as T, shouldRotateNode: false };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a rate limit error
      if (!isRateLimitError(lastError)) {
        // Not a rate limit error, throw immediately
        throw lastError;
      }

      nodePool.reportFailure(nodeUrl);

      if (attempt < config.maxRetries - 1) {
        const delay = calculateBackoff(attempt, config);
        console.log(
          `[Scanner] Rate limited on ${nodeUrl}, retry ${attempt + 1}/${config.maxRetries} in ${Math.round(delay)}ms`
        );
        await sleep(delay);
      }
    }
  }

  // Max retries exceeded, signal to rotate node
  console.log(`[Scanner] Max retries exceeded on ${nodeUrl}, rotating to next node`);
  return { result: null as T, shouldRotateNode: true };
}

export interface ScanResult {
  success: boolean;
  totalAccounts: number;
  thresholds: TierThreshold[];
  duration: number;
  error?: string;
}

async function connectToXrpl(nodePool: NodePool): Promise<{ client: Client; nodeUrl: string }> {
  const triedUrls = new Set<string>();

  // Try connecting to nodes from the pool
  while (triedUrls.size < MAINNET_URLS.length) {
    const url = nodePool.getNextNode();

    // Skip if we already tried this URL in this connection attempt
    if (triedUrls.has(url)) {
      // Wait a bit before retrying if all nodes have been tried
      await sleep(1000);
      triedUrls.clear();
    }

    triedUrls.add(url);

    try {
      const client = new Client(url, {
        connectionTimeout: 30000,
      });
      await client.connect();
      console.log(`[Scanner] Connected to ${url}`);
      nodePool.reportSuccess(url);
      return { client, nodeUrl: url };
    } catch (err) {
      console.warn(`[Scanner] Failed to connect to ${url}:`, err);
      nodePool.reportFailure(url);
    }
  }

  throw new Error('Failed to connect to any XRPL node');
}

async function reconnectToNode(
  currentClient: Client | null,
  nodePool: NodePool
): Promise<{ client: Client; nodeUrl: string }> {
  // Disconnect current client if exists
  if (currentClient) {
    try {
      await currentClient.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }

  return connectToXrpl(nodePool);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ensure client is connected, reconnect if needed
async function ensureConnected(
  client: Client | null,
  nodePool: NodePool,
  currentNodeUrl: string
): Promise<{ client: Client; nodeUrl: string; reconnected: boolean }> {
  if (client?.isConnected()) {
    return { client, nodeUrl: currentNodeUrl, reconnected: false };
  }

  console.log('[Scanner] Connection lost, reconnecting...');
  const reconnection = await reconnectToNode(client, nodePool);
  return { ...reconnection, reconnected: true };
}

export async function runDistributionScan(forceRestart = false): Promise<ScanResult> {
  const startTime = Date.now();
  let client: Client | null = null;
  let currentNodeUrl: string = '';
  const nodePool = new NodePool(MAINNET_URLS);
  const rateLimiter = new AdaptiveRateLimiter();

  // Initialize database
  getDb();

  // Check for resumable scan
  const existingProgress = await getScanProgress();
  const canResume =
    !forceRestart &&
    existingProgress.status === 'paused' &&
    existingProgress.marker &&
    existingProgress.ledgerIndex;

  if (canResume) {
    console.log(
      `[Scanner] Resuming from ${existingProgress.processedAccounts.toLocaleString()} accounts`
    );
  }

  // Note: Scan-already-running check is handled by the API trigger endpoint
  // before calling this function. The API also sets status to 'running' in Redis.

  try {
    // Connect to XRPL using NodePool
    const connection = await connectToXrpl(nodePool);
    client = connection.client;
    currentNodeUrl = connection.nodeUrl;

    // Get current ledger for consistency (or use existing if resuming)
    let ledgerIndex: string | number | undefined;
    if (canResume && existingProgress.ledgerIndex) {
      ledgerIndex = existingProgress.ledgerIndex;
      console.log(`[Scanner] Resuming scan at ledger ${ledgerIndex}`);
    } else {
      const serverInfo = await client.request({ command: 'server_info' });
      ledgerIndex =
        serverInfo.result.info.validated_ledger?.seq ||
        serverInfo.result.info.complete_ledgers?.split('-').pop();
      console.log(`[Scanner] Starting scan at ledger ${ledgerIndex}`);
    }

    // Update progress
    await updateScanProgress({
      ledgerIndex: parseInt(ledgerIndex?.toString() || '0', 10),
      nodeUrl: currentNodeUrl,
      consecutiveErrors: 0,
    });

    // Clear existing accounts only for fresh scan
    if (!canResume) {
      clearAccounts();
    }

    // Initialize from existing progress if resuming
    let marker: string | undefined = canResume
      ? existingProgress.marker || undefined
      : undefined;
    let totalProcessed = canResume ? existingProgress.processedAccounts : 0;
    let batch: Array<{ address: string; balance: number }> = [];
    let consecutiveErrors = 0;

    do {
      // Ensure we're still connected
      const connectionCheck = await ensureConnected(client, nodePool, currentNodeUrl);
      client = connectionCheck.client;
      currentNodeUrl = connectionCheck.nodeUrl;
      if (connectionCheck.reconnected) {
        await updateScanProgress({ nodeUrl: currentNodeUrl });
      }

      const request: LedgerDataRequest = {
        command: 'ledger_data',
        ledger_index: 'validated',
        type: 'account',
        limit: 2048, // Max allowed
        ...(marker && { marker }),
      };

      const requestStart = Date.now();

      // Use requestWithRetry with node rotation
      const { result: response, shouldRotateNode } = await requestWithRetry<{
        result: { state: unknown[]; marker?: string };
      }>(client, request, nodePool, currentNodeUrl);

      const responseTime = Date.now() - requestStart;

      // Handle node rotation if needed
      if (shouldRotateNode) {
        consecutiveErrors++;

        // Pause scan after 5 consecutive errors for later resumption
        if (consecutiveErrors >= 5) {
          console.log('[Scanner] Pausing scan after 5 consecutive errors. Can resume later.');

          // Save remaining batch before pausing
          if (batch.length > 0) {
            insertAccountsBatch(batch);
          }

          await updateScanProgress({
            status: 'paused',
            consecutiveErrors,
            error: 'Paused after 5 consecutive errors - will retry with node rotation',
            lastCheckpoint: Date.now(),
          });

          return {
            success: false,
            totalAccounts: totalProcessed,
            thresholds: [],
            duration: (Date.now() - startTime) / 1000,
            error: 'Scan paused - can be resumed',
          };
        }

        console.log(`[Scanner] Rotating to new node (error ${consecutiveErrors}/5)...`);
        const reconnection = await reconnectToNode(client, nodePool);
        client = reconnection.client;
        currentNodeUrl = reconnection.nodeUrl;
        await updateScanProgress({ nodeUrl: currentNodeUrl, consecutiveErrors });

        // Adjust rate limiter for error
        rateLimiter.adjustDelay(responseTime, true);
        continue;
      }

      // Success - reset consecutive errors
      consecutiveErrors = 0;
      const { state, marker: nextMarker } = response.result;

      // Process account entries
      for (const rawEntry of state) {
        const entry = rawEntry as unknown as AccountRootEntry;
        if (entry.LedgerEntryType === 'AccountRoot' && entry.Balance) {
          const balanceDrops = parseInt(entry.Balance, 10);
          const balanceXrp = balanceDrops / 1_000_000;

          // Only include funded accounts with positive balance
          if (balanceXrp > 0) {
            batch.push({
              address: entry.Account,
              balance: balanceXrp,
            });

            // Insert batch when full
            if (batch.length >= DB_BATCH_SIZE) {
              insertAccountsBatch(batch);
              batch = [];
            }
          }
        }
      }

      totalProcessed += state.length;
      marker = nextMarker as string | undefined;

      // Update progress in Redis
      await updateScanProgress({
        marker: marker || null,
        processedAccounts: totalProcessed,
        consecutiveErrors: 0,
        lastCheckpoint: Date.now(),
      });

      // Log progress
      if (totalProcessed % LOG_INTERVAL < state.length) {
        console.log(`[Scanner] Processed ${totalProcessed.toLocaleString()} entries...`);
      }

      // Adaptive delay based on response time
      const delay = rateLimiter.adjustDelay(responseTime, false);
      await sleep(delay);
    } while (marker);

    // Insert remaining batch
    if (batch.length > 0) {
      insertAccountsBatch(batch);
    }

    const accountCount = getAccountCount();
    console.log(`[Scanner] Scan complete. ${accountCount.toLocaleString()} funded accounts found.`);

    // Calculate thresholds
    console.log('[Scanner] Calculating percentile thresholds...');
    const thresholds = await calculateThresholdsAndCache();

    // Update scan completion in Redis
    await updateScanProgress({
      status: 'completed',
      marker: null,
      processedAccounts: accountCount,
      completedAt: Date.now(),
      consecutiveErrors: 0,
      error: null,
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Scanner] Completed in ${duration.toFixed(1)}s`);

    return {
      success: true,
      totalAccounts: accountCount,
      thresholds,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scanner] Scan failed:', errorMessage);

    await updateScanProgress({
      status: 'failed',
      error: errorMessage,
    });

    return {
      success: false,
      totalAccounts: 0,
      thresholds: [],
      duration: (Date.now() - startTime) / 1000,
      error: errorMessage,
    };
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}

async function calculateThresholdsAndCache(): Promise<TierThreshold[]> {
  const thresholds: TierThreshold[] = [];
  const totalAccounts = getAccountCount();

  console.log(`[Scanner] Calculating thresholds for ${totalAccounts.toLocaleString()} accounts`);

  for (const tier of TIERS) {
    const minXrp = calculatePercentileThreshold(tier.percentile);

    thresholds.push({
      name: tier.name,
      emoji: tier.emoji,
      percentile: tier.percentile,
      minimumXrp: minXrp,
    });

    console.log(
      `[Scanner] ${tier.name} (top ${tier.percentile}%): ${minXrp.toLocaleString()} XRP`
    );
  }

  // Save to SQLite
  setThresholds(
    thresholds.map((t) => ({
      percentile: t.percentile,
      name: t.name,
      emoji: t.emoji,
      minXrp: t.minimumXrp,
    }))
  );

  // Also update Redis cache for fast API reads
  try {
    await setCachedThresholds(thresholds, totalAccounts);
  } catch (err) {
    console.warn('[Scanner] Failed to update Redis cache:', err);
  }

  return thresholds;
}

export async function getScanStatus(): Promise<ScanProgress & { totalAccounts: number }> {
  // Get progress from Redis (shared across machines)
  const progress = await getScanProgress();

  // Get total accounts from SQLite only if completed
  let totalAccounts = 0;
  if (progress.status === 'completed') {
    try {
      getDb(); // Ensure DB is initialized
      totalAccounts = getAccountCount();
    } catch {
      // DB might not exist on this machine yet
    }
  }

  return {
    ...progress,
    totalAccounts,
  };
}

// Time utilities for scheduled scans
export function isOptimalScanTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Optimal: 2-6 AM UTC (lowest global activity)
  // Avoid: 2-6 PM UTC (US market hours overlap with Asia evening)
  return utcHour >= 2 && utcHour <= 6;
}

export function getNextOptimalScanTime(): Date {
  const now = new Date();
  const next = new Date(now);

  next.setUTCHours(3, 0, 0, 0); // 3 AM UTC

  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

// Re-export for backwards compatibility
export type { ScanProgress };
export { closeDb };
