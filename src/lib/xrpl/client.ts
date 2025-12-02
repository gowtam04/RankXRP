import { Client } from 'xrpl';

const MAINNET_URL = 'wss://xrplcluster.com';
const FALLBACK_URL = 'wss://s2.ripple.com';

export async function getXrplClient(): Promise<Client> {
  const client = new Client(MAINNET_URL, {
    connectionTimeout: 10000,
  });

  try {
    await client.connect();
    return client;
  } catch {
    console.error('Failed to connect to primary XRPL node, trying fallback...');
    const fallbackClient = new Client(FALLBACK_URL, {
      connectionTimeout: 10000,
    });
    await fallbackClient.connect();
    return fallbackClient;
  }
}

export async function withXrplClient<T>(
  operation: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getXrplClient();
  try {
    return await operation(client);
  } finally {
    await client.disconnect();
  }
}
