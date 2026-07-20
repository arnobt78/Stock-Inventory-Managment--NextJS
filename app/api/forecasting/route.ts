/**
 * Forecasting API Route Handler
 * GET /api/forecasting — get demand forecasting summary
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { generateForecastingSummary } from "@/lib/forecasting";
import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import type { ForecastingSummary } from "@/types";
import { createChatCompletion, isLlmConfigured } from "@/lib/ai";
import { LLM_INSIGHTS_MAX_TOKENS } from "@/lib/ai/constants";

/** v2 — bust cache after max_tokens increase (REQ-0019). */
// REQ-0170 — keep in sync with lib/server/forecasting-data.ts
const FORECASTING_CACHE_KEY_PREFIX = "forecasting:summary:v4";

/**
 * Generate AI insights from forecasting data
 */
async function generateAIInsights(
  summary: ForecastingSummary,
): Promise<string> {
  if (!isLlmConfigured()) {
    return "";
  }

  const urgentProducts = summary.forecasts
    .filter((f) => f.reorderRecommendation === "urgent")
    .slice(0, 5)
    .map((f) => `${f.productName} (${f.daysUntilStockout} days left)`)
    .join(", ");

  const anomalyInfo =
    summary.anomalies.length > 0
      ? `${summary.anomalies.length} sales anomalies detected`
      : "No anomalies detected";

  const prompt = `You are an inventory management assistant. Analyze this forecasting summary and provide 2-3 concise, actionable insights:

Summary:
- Total products: ${summary.totalProducts}
- Products at risk of stockout: ${summary.productsAtRisk}
- Overstocked products: ${summary.productsOverstocked}
- ${anomalyInfo}
${urgentProducts ? `- Urgent reorder needed: ${urgentProducts}` : ""}

Provide brief, professional insights focusing on immediate actions.`;

  try {
    // Valid OpenRouter id (gpt-2.5-turbo is not); Groq fallback uses GROQ_MODEL_CHAIN (REQ-0144)
    const response = await createChatCompletion(
      [{ role: "user", content: prompt }],
      {
        model: "openai/gpt-4o-mini",
        max_tokens: LLM_INSIGHTS_MAX_TOKENS,
      },
    );

    if (!response.ok) {
      return "";
    }

    return response.data.choices?.[0]?.message?.content || "";
  } catch (error) {
    logger.error("Failed to generate AI insights:", error);
    return "";
  }
}

/**
 * GET /api/forecasting
 * Returns demand forecasting summary with predictions and anomalies
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache first (forecasts are expensive to compute)
    const cacheKey = `${FORECASTING_CACHE_KEY_PREFIX}:${session.id}`;
    const cacheReadStartedAt = Date.now();
    const cached = await getCache<ForecastingSummary>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Generate forecasting summary
    const summary = await generateForecastingSummary(session.id);

    // Generate AI insights if configured
    const aiInsights = await generateAIInsights(summary);
    if (aiInsights) {
      summary.aiInsights = aiInsights;
    }

    // Cache for 15 minutes (forecasts don't change frequently)
    await setCache(cacheKey, summary, 900, { fetchedAt: cacheReadStartedAt });

    return NextResponse.json(summary);
  } catch (error) {
    logger.error("Error generating forecasting summary:", error);
    return NextResponse.json(
      { error: "Failed to generate forecasting summary" },
      { status: 500 },
    );
  }
}
