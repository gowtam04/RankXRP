import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
  return redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}
