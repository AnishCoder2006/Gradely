import { createClient, RedisClientType } from 'redis';
import logger from '../config/logger';

let redisClient: RedisClientType | null = null;
let isRedisConnected = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'; // Default to enabled unless explicitly false

export function isRedisEnabled(): boolean {
  return REDIS_ENABLED;
}

export async function initRedis(): Promise<RedisClientType | null> {
  if (!REDIS_ENABLED) {
    logger.info({ enabled: false }, 'redis_disabled');
    return null;
  }

  if (redisClient && isRedisConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn({ retries }, 'redis_reconnect_exhausted');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 1000);
        },
      },
    });

    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        logger.error({ err }, 'redis_client_error');
      }
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('redis_connected');
    });

    redisClient.on('end', () => {
      isRedisConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    logger.warn({ err: error }, 'redis_connection_failed_using_memory_fallback');
    isRedisConnected = false;
    redisClient = null;
    return null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return isRedisConnected ? redisClient : null;
}

export function isRedisReady(): boolean {
  return isRedisConnected && redisClient !== null;
}

// ── Cache Helper Methods (Part 3) ──

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisReady() || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    const hit = Boolean(data);
    logger.debug({ event: 'cache_read', key, hit }, hit ? 'cache_hit' : 'cache_miss');
    return hit ? JSON.parse(data as string) : null;
  } catch (err) {
    logger.error({ err, event: 'cache_read', key }, 'cache_read_failed');
    return null;
  }
}

export async function setCache(key: string, data: any, ttlSeconds = 300): Promise<void> {
  if (!isRedisReady() || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  } catch (err) {
    logger.error({ err, event: 'cache_write', key, ttlSeconds }, 'cache_write_failed');
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!isRedisReady() || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error({ err, event: 'cache_delete', key }, 'cache_delete_failed');
  }
}

export async function clearCachePattern(pattern: string): Promise<void> {
  if (!isRedisReady() || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    logger.error({ err, event: 'cache_clear_pattern', pattern }, 'cache_clear_failed');
  }
}
