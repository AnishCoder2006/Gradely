import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, getRedisKeyPrefix, isRedisReady } from '../services/redis.service';

function createRedisStore(prefix: string) {
  if (isRedisReady()) {
    const client = getRedisClient();
    if (client) {
      return new RedisStore({
        // @ts-ignore
        sendCommand: (...args: string[]) => client.sendCommand(args),
        prefix: `${getRedisKeyPrefix()}rl:${prefix}:`,
      });
    }
  }
  return undefined; // Falls back to default express-rate-limit MemoryStore
}

// ── REST rate limiters (Part 1: Redis-backed store) ──

export const announcementLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // 10 announcements per minute per IP+user
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: createRedisStore('announcement'),
  message: {
    success: false,
    message: 'Too many announcements posted. Please wait a moment before posting again.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

export const doubtLimiter = rateLimit({
  windowMs: 10 * 1000,       // 10 second window
  max: 5,                    // 5 messages per 10 seconds per user
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: createRedisStore('doubt'),
  message: {
    success: false,
    message: 'You are sending messages too quickly. Please slow down.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});

export const doubtDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100,                       // 100 doubt messages per day per user
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: createRedisStore('doubt-daily'),
  message: {
    success: false,
    message: 'Daily message limit reached. Please try again tomorrow.',
  },
  keyGenerator: (req: any) => req.user?.id || req.ip,
});