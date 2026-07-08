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

const SYSTEM_PROMPT = `You are a concise inventory advisor. Given a short summary of inventory metrics, reply with 2-4 brief, actionable recommendations (one short sentence each). Focus on reorder suggestions, low-stock attention, and value optimization. Keep the tone professional and direct. Do not use markdown or bullet symbols.`;

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

    const result = await createChatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: summary },
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
