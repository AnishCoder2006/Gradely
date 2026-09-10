import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../services/redis.service';
import logger from '../config/logger';

/**
 * Express middleware to cache GET endpoint JSON responses in Redis.
 * @param ttlSeconds Duration to hold cache in seconds (default: 5 minutes)
 * @param keyPrefix Optional key prefix (defaults to request originalUrl)
 */
export function cacheMiddleware(ttlSeconds = 300, keyPrefix?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = keyPrefix ? `${keyPrefix}:${req.originalUrl}` : `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await getCache<any>(cacheKey);

      if (cachedResponse) {
        // Return cached payload directly with cache header
        res.setHeader('X-Cache', 'HIT');
        logger.debug({ event: 'http_cache', method: req.method, path: req.path, hit: true }, 'cache_response');
        return res.json(cachedResponse);
      }

      // Intercept res.json to capture response payload before sending
      res.setHeader('X-Cache', 'MISS');
      logger.debug({ event: 'http_cache', method: req.method, path: req.path, hit: false }, 'cache_response');
      const originalJson = res.json.bind(res);

      res.json = (body: any): Response => {
        // Cache successful GET responses (status 200)
        if (res.statusCode === 200 && body) {
          setCache(cacheKey, body, ttlSeconds).catch((err) => {
            logger.error({ err, event: 'cache_write', key: cacheKey, path: req.path }, 'response_cache_write_failed');
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ err: error, event: 'http_cache', method: req.method, path: req.path }, 'cache_middleware_failed');
      next();
    }
  };
}
