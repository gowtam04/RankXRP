import { NextResponse } from 'next/server';
import { getDistributionData } from '@/lib/services';
import type { ThresholdsResponse, ErrorResponse } from '@/lib/types/api';

export async function GET() {
  try {
    const data = await getDistributionData();

    const response: ThresholdsResponse = {
      thresholds: data.thresholds.map((t) => ({
        name: t.name,
        emoji: t.emoji,
        percentile: t.percentile,
        minimumXrp: t.minimumXrp,
      })),
      lastUpdated: data.timestamp,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Thresholds error:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch tier thresholds',
      code: 'INTERNAL_ERROR',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
