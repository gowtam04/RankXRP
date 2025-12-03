#!/usr/bin/env npx tsx

/**
 * Distribution Scanner CLI Script
 *
 * Run this script to scan the XRPL ledger and calculate distribution thresholds.
 * Can be triggered manually or via cron/scheduler.
 *
 * Usage:
 *   npx tsx src/scripts/run-scan.ts
 *   npm run scan
 */

import { runDistributionScan, closeDb } from '@/lib/services/distribution-scanner';

async function main() {
  console.log('='.repeat(60));
  console.log('XRP Distribution Scanner');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    const result = await runDistributionScan();

    console.log('');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('SCAN COMPLETED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`Total accounts: ${result.totalAccounts.toLocaleString()}`);
      console.log(`Duration: ${result.duration.toFixed(1)} seconds`);
      console.log('');
      console.log('Thresholds:');
      console.log('-'.repeat(40));

      for (const threshold of result.thresholds) {
        console.log(
          `  ${threshold.emoji} ${threshold.name.padEnd(10)} (top ${threshold.percentile
            .toString()
            .padStart(6)}%): ${threshold.minimumXrp.toLocaleString()} XRP`
        );
      }
    } else {
      console.log('SCAN FAILED');
      console.log('='.repeat(60));
      console.log(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    closeDb();
  }

  console.log('');
  console.log(`Finished at: ${new Date().toISOString()}`);
  process.exit(0);
}

main();
