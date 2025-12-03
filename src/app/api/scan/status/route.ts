import { NextResponse } from 'next/server';
import { getScanStatus } from '@/lib/services/distribution-scanner';
import { getThresholds } from '@/lib/db';

export async function GET() {
  try {
    const status = await getScanStatus();
    let thresholds: ReturnType<typeof getThresholds> = [];
    if (status.status === 'completed') {
      try {
        thresholds = getThresholds();
      } catch {
        // DB might not exist on this machine
      }
    }

    return NextResponse.json({
      status: status.status,
      totalAccounts: status.totalAccounts,
      processedAccounts: status.processedAccounts,
      startedAt: status.startedAt ? new Date(status.startedAt).toISOString() : null,
      completedAt: status.completedAt
        ? new Date(status.completedAt).toISOString()
        : null,
      ledgerIndex: status.ledgerIndex,
      error: status.error,
      thresholds: thresholds.map((t) => ({
        name: t.name,
        emoji: t.emoji,
        percentile: t.percentile,
        minimumXrp: t.min_xrp,
        updatedAt: new Date(t.updated_at).toISOString(),
      })),
    });
  } catch (error) {
    console.error('[API] Scan status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get scan status',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
