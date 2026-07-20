/**
 * Server-side forecasting summary for SSR prefetch (REQ-0025).
 * Mirrors GET /api/forecasting cache key and shape.
 */

import { getCache, setCache } from "@/lib/cache";
import { generateForecastingSummary } from "@/lib/forecasting";
import type { ForecastingSummary } from "@/types";

// REQ-0171 — v4: category/supplier meta on forecasts + anomalies (was v3 imageUrl)
const FORECASTING_CACHE_KEY_PREFIX = "forecasting:summary:v4";

export function forecastingSummaryCacheKey(userId: string): string {
  return `${FORECASTING_CACHE_KEY_PREFIX}:${userId}`;
}

/** REQ-0082 — read Redis only; never generates (category detail must not block on cold forecast). */
export async function getCachedForecastingSummary(
  userId: string,
): Promise<ForecastingSummary | null> {
  return getCache<ForecastingSummary>(forecastingSummaryCacheKey(userId));
}

/** Demand forecast summary for dashboard SSR — skips LLM insights for faster first paint. */
export async function getForecastingForUser(
  userId: string,
): Promise<ForecastingSummary> {
  const cacheKey = forecastingSummaryCacheKey(userId);
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ForecastingSummary>(cacheKey);
  if (cached) return cached;

  const summary = await generateForecastingSummary(userId);
  await setCache(cacheKey, summary, 900, { fetchedAt: cacheReadStartedAt });
  return summary;
}
