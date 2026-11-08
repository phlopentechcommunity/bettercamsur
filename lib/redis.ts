import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };
export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 250, 2000),
});
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redis.status === 'wait') await redis.connect();
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch { return null; }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 20): Promise<void> {
  try {
    if (redis.status === 'wait') await redis.connect();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch { /* Redis is an optimization; PostgreSQL remains the source of truth. */ }
}

export async function invalidateReportCache(): Promise<void> {
  try {
    if (redis.status === 'wait') await redis.connect();
    const keys = await redis.keys('reports:*');
    keys.push(...await redis.keys('analytics:*'));
    keys.push('reports:overview');
    if (keys.length) await redis.del(...keys);
  } catch { /* Cache invalidation must not block report persistence. */ }
}
