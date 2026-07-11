/**
 * AI-powered inventory insights via OpenRouter (primary) or Groq (fallback).
 * POST /api/ai/insights — accepts summary of analytics, returns short AI recommendations
 */

import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { createChatCompletion, isLlmConfigured } from "@/lib/ai";
import {
  successResponse,
  errorResponse,
  serviceUnavailableResponse,
} from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { aiInsightsBodySchema } from "@/lib/validations/ai";
import { LLM_INSIGHTS_MAX_TOKENS } from "@/lib/ai/constants";
import { getWarehouseStockSummary } from "@/prisma/stock-allocation";

const SYSTEM_PROMPT = `You are a concise inventory advisor. Given a short summary of inventory metrics, reply with 2-4 brief, actionable recommendations (one short sentence each). Focus on reorder suggestions, low-stock attention, value optimization, warehouse rebalancing, and inter-warehouse transfer opportunities when warehouse data is present. Keep the tone professional and direct. Do not use markdown or bullet symbols.`;

function buildWarehouseSummaryAppendix(
  rows: Awaited<ReturnType<typeof getWarehouseStockSummary>>,
): string {
  const withStock = rows.filter((r) => r.totalQuantity > 0);
  if (withStock.length === 0) {
    return " Warehouse stock: no allocations yet.";
  }
  const totalQty = withStock.reduce((sum, r) => sum + r.totalQuantity, 0);
  const top = [...withStock]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5)
    .map((r) => {
      const share =
        totalQty > 0
          ? Math.round((r.totalQuantity / totalQty) * 100)
          : 0;
      return `${r.warehouseName} ${r.totalQuantity} units (${share}% of allocated stock, ${r.totalProducts} SKUs)`;
    })
    .join("; ");
  const under = withStock.filter(
    (r) => totalQty > 0 && r.totalQuantity / totalQty < 0.15,
  );
  const over = withStock.filter(
    (r) => totalQty > 0 && r.totalQuantity / totalQty > 0.4,
  );
  let extra = "";
  if (under.length > 0) {
    extra += ` Under-utilized locations: ${under.map((r) => r.warehouseName).join(", ")}.`;
  }
  if (over.length > 0) {
    extra += ` Concentrated stock: ${over.map((r) => r.warehouseName).join(", ")}.`;
  }
  return ` Per-warehouse stock: ${top}.${extra}`;
}

const LLM_NOT_CONFIGURED =
  "AI insights are not configured. Set OPENROUTER_API_KEY and/or GROQ_API_KEY in .env.";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromRequest(request);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!isLlmConfigured()) {
      return serviceUnavailableResponse(LLM_NOT_CONFIGURED, {
        code: "LLM_NOT_CONFIGURED",
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const validationResult = aiInsightsBodySchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid AI insights request", {
        errors: validationResult.error.errors,
      });
      return errorResponse("Invalid request body", 400, {
        details: validationResult.error.errors,
      });
    }

    const { summary } = validationResult.data;

    let enrichedSummary = summary;
    try {
      const warehouseRows = await getWarehouseStockSummary(user.id);
      enrichedSummary += buildWarehouseSummaryAppendix(warehouseRows);
    } catch (warehouseErr) {
      logger.warn("AI insights warehouse summary skipped", { warehouseErr });
    }

    const result = await createChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: enrichedSummary },
      ],
      { max_tokens: LLM_INSIGHTS_MAX_TOKENS, temperature: 0.5 },
    );

    if (!result.ok) {
      if (result.kind === "billing") {
        return serviceUnavailableResponse(
          "AI credits exhausted on configured providers. Add OpenRouter credits or set GROQ_API_KEY.",
          {
            code: "LLM_BILLING",
            provider: result.provider,
            status: result.status,
          },
        );
      }
      if (result.kind === "not_configured") {
        return serviceUnavailableResponse(LLM_NOT_CONFIGURED, {
          code: "LLM_NOT_CONFIGURED",
        });
      }
      if (result.kind === "rate_limit") {
        return serviceUnavailableResponse(
          "AI service rate limit reached. Please try again later.",
          {
            code: "LLM_RATE_LIMIT",
            provider: result.provider,
            status: result.status,
          },
        );
      }
      return errorResponse(
        "AI service is temporarily unavailable",
        502,
        { code: "LLM_UPSTREAM", provider: result.provider, status: result.status },
        { reportToSentry: true },
      );
    }

    const text = result.data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return serviceUnavailableResponse(
        "AI service did not return insights. Try again later.",
        { code: "LLM_EMPTY_RESPONSE", provider: result.provider },
      );
    }

    return successResponse({ text, provider: result.provider });
  } catch (error) {
    console.error("[AI insights]", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate insights",
      500,
    );
  }
}
