import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isValidXrpAddress, getAccountBalance, AccountNotFoundError } from '@/lib/xrpl';
import { getXrpPrice, getDistributionData, calculateTier } from '@/lib/services';
import type { LookupResponse, ErrorResponse } from '@/lib/types/api';

export async function GET(request: NextRequest) {
  try {
    // Parse and validate address from query params
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      const errorResponse: ErrorResponse = {
        error: 'Address parameter is required',
        code: 'MISSING_ADDRESS',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate address format
    if (!isValidXrpAddress(address)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid XRP address format',
        code: 'INVALID_ADDRESS',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Fetch balance from XRPL (real-time)
    const accountInfo = await getAccountBalance(address);

    // Get cached thresholds and price in parallel
    const [thresholdsData, priceData] = await Promise.all([
      getDistributionData(),
      getXrpPrice(),
    ]);

    // Calculate tier
    const tierResult = calculateTier(accountInfo.balance, thresholdsData);

    // Build response
    const response: LookupResponse = {
      address: accountInfo.address,
      balance: accountInfo.balance,
      balanceUsd: accountInfo.balance * priceData.price,
      tier: tierResult.tier.name,
      tierEmoji: tierResult.tier.emoji,
      tierColor: tierResult.tier.color,
      percentile: tierResult.tier.percentile,
      exactPercentile: tierResult.exactPercentile,
      nextTier: tierResult.nextTier?.name || null,
      nextTierEmoji: tierResult.nextTier?.emoji || null,
      progressPercent: tierResult.progressPercent,
      xrpToNextTier: tierResult.xrpToNextTier,
      xrpToNextTierUsd: tierResult.xrpToNextTier * priceData.price,
      priceUsd: priceData.price,
      priceTimestamp: priceData.timestamp,
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Lookup error:', error);

    // Handle specific errors
    if (error instanceof AccountNotFoundError) {
      const errorResponse: ErrorResponse = {
        error: 'Account not found or not activated. XRP accounts require a minimum reserve of 10 XRP to be activated.',
        code: 'ACCOUNT_NOT_FOUND',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request parameters',
        code: 'VALIDATION_ERROR',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generic error
    const errorResponse: ErrorResponse = {
      error: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
