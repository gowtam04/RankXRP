import { NextResponse } from 'next/server';
import { getDistributionStats } from '@/lib/services';
import type { StatsResponse, ErrorResponse } from '@/lib/types/api';

export async function GET() {
  try {
    const stats = await getDistributionStats();

    const response: StatsResponse = {
      totalAccounts: stats.totalAccounts,
      medianBalance: stats.medianBalance,
      lastUpdated: stats.lastUpdated,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Stats error:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch distribution statistics',
      code: 'INTERNAL_ERROR',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
