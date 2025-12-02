import { withXrplClient } from './client';

export interface AccountInfo {
  address: string;
  balance: number;
  exists: boolean;
}

export class AccountNotFoundError extends Error {
  constructor(address: string) {
    super(`Account not found: ${address}`);
    this.name = 'AccountNotFoundError';
  }
}

export async function getAccountBalance(address: string): Promise<AccountInfo> {
  return withXrplClient(async (client) => {
    try {
      const balance = await client.getXrpBalance(address);
      return {
        address,
        balance: typeof balance === 'string' ? parseFloat(balance) : Number(balance),
        exists: true,
      };
    } catch (error: unknown) {
      // Check if account doesn't exist (not activated or never funded)
      if (
        error instanceof Error &&
        (error.message.includes('Account not found') ||
          error.message.includes('actNotFound'))
      ) {
        throw new AccountNotFoundError(address);
      }
      throw error;
    }
  });
}
