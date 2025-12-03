import { getRedisClient } from './redis';

const SCAN_PROGRESS_KEY = 'xrp:scan:progress';
const SCAN_PROGRESS_TTL = 24 * 60 * 60; // 24 hours

export interface ScanProgress {
  status: 'idle' | 'running' | 'completed' | 'failed';
  marker: string | null;
  processedAccounts: number;
  startedAt: number | null;
  completedAt: number | null;
  ledgerIndex: number | null;
  error: string | null;
}

const DEFAULT_PROGRESS: ScanProgress = {
  status: 'idle',
  marker: null,
  processedAccounts: 0,
  startedAt: null,
  completedAt: null,
  ledgerIndex: null,
  error: null,
};

export async function getScanProgress(): Promise<ScanProgress> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(SCAN_PROGRESS_KEY);
    if (!data) {
      return { ...DEFAULT_PROGRESS };
    }
    return JSON.parse(data);
  } catch (error) {
    console.warn('[ScanProgress] Failed to read from Redis:', error);
    return { ...DEFAULT_PROGRESS };
  }
}

export async function setScanProgress(progress: ScanProgress): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(SCAN_PROGRESS_KEY, SCAN_PROGRESS_TTL, JSON.stringify(progress));
  } catch (error) {
    console.error('[ScanProgress] Failed to write to Redis:', error);
  }
}

export async function updateScanProgress(updates: Partial<ScanProgress>): Promise<void> {
  const current = await getScanProgress();
  await setScanProgress({ ...current, ...updates });
}
