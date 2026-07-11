/**
 * Rate Limiting Utilities
 * Redis-based rate limiting with sliding window algorithm
 */

import { getRedis } from "./redis";
import { logger } from "@/lib/logger";

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;
  /**
   * Time window in seconds
   */
  window: number;
  /**
   * Identifier for the rate limit (e.g., user ID, IP address)
   */
  identifier: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  /**
   * Current request count in the window
   */
  current: number;
  /**
   * Maximum allowed requests
   */
  limit: number;
  /**
   * Time remaining until the window resets (in seconds)
   */
  reset: number;
}

/**
 * Check rate limit using sliding window algorithm
 *
 * @param config - Rate limit configuration
 * @returns Promise<RateLimitResult> - Rate limit result
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    // Graceful degradation: allow all requests if Redis not available
    logger.warn("Redis not available, rate limiting disabled");
    return {
      allowed: true,
      current: 0,
      limit: config.limit,
      reset: config.window,
    };
  }

  try {
    const key = `rate-limit:${config.identifier}`;
    const now = Date.now();
    const windowStart = now - config.window * 1000;

    // Use sorted set for sliding window
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current entries in the window
    const current = await redis.zcard(key);

    if (current >= config.limit) {
      // Rate limit exceeded
      const oldestEntry = await redis.zrange(key, 0, 0, {
        withScores: true,
      }) as Array<{ member: string; score: number }>;
      const resetTime = oldestEntry.length > 0 && oldestEntry[0]
        ? Math.ceil((oldestEntry[0].score + config.window * 1000 - now) / 1000)
        : config.window;

      return {
        allowed: false,
        current,
        limit: config.limit,
        reset: Math.max(0, resetTime),
      };
    }

    // Add current request to the window
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    // Set expiration for the key (cleanup after window expires)
    await redis.expire(key, config.window);

    return {
      allowed: true,
      current: current + 1,
      limit: config.limit,
      reset: config.window,
    };
  } catch (error) {
    logger.error("Rate limit check failed:", error);
    // Graceful degradation: allow request on error
    return {
      allowed: true,
      current: 0,
      limit: config.limit,
      reset: config.window,
    };
  }
}
