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
];

// Batch size for database inserts
const DB_BATCH_SIZE = 10000;

// Delay between XRPL requests to avoid rate limiting (ms)
const REQUEST_DELAY = 50;

// Progress logging interval
const LOG_INTERVAL = 100000;

export interface ScanResult {
  success: boolean;
  totalAccounts: number;
  thresholds: TierThreshold[];
  duration: number;
  error?: string;
}

async function connectToXrpl(): Promise<Client> {
  for (const url of MAINNET_URLS) {
    try {
      const client = new Client(url, {
        connectionTimeout: 30000,
      });
      await client.connect();
      console.log(`[Scanner] Connected to ${url}`);
      return client;
    } catch (err) {
      console.warn(`[Scanner] Failed to connect to ${url}:`, err);
    }
  }
  throw new Error('Failed to connect to any XRPL node');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDistributionScan(): Promise<ScanResult> {
  const startTime = Date.now();
  let client: Client | null = null;

  // Initialize database
  getDb();

  // Note: Scan-already-running check is handled by the API trigger endpoint
  // before calling this function. The API also sets status to 'running' in Redis.

  try {
    // Connect to XRPL
    client = await connectToXrpl();

    // Get current ledger for consistency
    const serverInfo = await client.request({ command: 'server_info' });
    const ledgerIndex =
      serverInfo.result.info.validated_ledger?.seq ||
      serverInfo.result.info.complete_ledgers?.split('-').pop();

    console.log(`[Scanner] Starting scan at ledger ${ledgerIndex}`);

    // Update ledger index now that we're connected (status already set to 'running' by API)
    await updateScanProgress({
      ledgerIndex: parseInt(ledgerIndex?.toString() || '0', 10),
    });

    // Clear existing accounts for fresh scan
    clearAccounts();

    // Iterate through all accounts
    let marker: string | undefined = undefined;
    let totalProcessed = 0;
    let batch: Array<{ address: string; balance: number }> = [];

    do {
      const request: LedgerDataRequest = {
        command: 'ledger_data',
        ledger_index: 'validated',
        type: 'account',
        limit: 2048, // Max allowed
        ...(marker && { marker }),
      };

      const response = await client.request(request);
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
      });

      // Log progress
      if (totalProcessed % LOG_INTERVAL < state.length) {
        console.log(`[Scanner] Processed ${totalProcessed.toLocaleString()} entries...`);
      }

      // Rate limiting delay
      await sleep(REQUEST_DELAY);
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

// Re-export for backwards compatibility
export type { ScanProgress };
export { closeDb };
