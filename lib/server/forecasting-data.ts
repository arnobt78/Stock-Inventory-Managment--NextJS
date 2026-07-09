/**
 * Server-side forecasting summary for SSR prefetch (REQ-0025).
 * Mirrors GET /api/forecasting cache key and shape.
 */

import { getCache, setCache } from "@/lib/cache";
import { generateForecastingSummary } from "@/lib/forecasting";
import type { ForecastingSummary } from "@/types";

const FORECASTING_CACHE_KEY_PREFIX = "forecasting:summary:v2";

/** Demand forecast summary for dashboard SSR — skips LLM insights for faster first paint. */
export async function getForecastingForUser(
  userId: string,
): Promise<ForecastingSummary> {
  const cacheKey = `${FORECASTING_CACHE_KEY_PREFIX}:${userId}`;
  const cached = await getCache<ForecastingSummary>(cacheKey);
  if (cached) return cached;

  const summary = await generateForecastingSummary(userId);
  await setCache(cacheKey, summary, 900);
  return summary;
}
