/**
 * Groq API client (OpenAI-compatible).
 * Fallback when OpenRouter billing/rate-limit/upstream fails.
 * Fast-first model chain (REQ-0018) — llama-3.3 deprecated Aug 16, 2026.
 * Docs: https://console.groq.com/docs/openai
 */

import type {
  ChatCompletionOptions,
  ChatCompletionFailureKind,
  ChatCompletionResponse,
  ChatCompletionResult,
  ChatMessage,
} from "./types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/** Fast-first failover order when GROQ_MODEL env is unset. */
export const GROQ_MODEL_CHAIN = [
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
] as const;

/** Default chain head — no Vercel env required. */
export const DEFAULT_GROQ_MODEL = GROQ_MODEL_CHAIN[0];

/** Groq shutdown Aug 16, 2026 — remap to chain if still in env. */
const DEPRECATED_GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]);

const RETRIABLE_HTTP_STATUSES = new Set([408, 429, 502, 503, 504]);

/** OpenRouter-only ids (forecasting uses gpt-4o-mini) — never pass these to Groq. */
const OPENROUTER_ONLY_MODEL_IDS = new Set([
  "openai/gpt-2.5-turbo", // legacy / invalid OR id — still skip Groq if callers pass it
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
]);

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

function isDeprecatedGroqModel(model: string): boolean {
  return DEPRECATED_GROQ_MODELS.has(model);
}

/** True when options.model is meant for OpenRouter, not Groq (even if it contains "/"). */
function isOpenRouterOnlyModelId(model: string): boolean {
  if (OPENROUTER_ONLY_MODEL_IDS.has(model)) {
    return true;
  }
  if (model.includes(":free")) {
    return true;
  }
  if (model.startsWith("meta-llama/") || model.startsWith("deepseek/")) {
    return true;
  }
  return false;
}

function isKnownGroqModelId(model: string): boolean {
  return (GROQ_MODEL_CHAIN as readonly string[]).includes(model);
}

/**
 * Resolve primary Groq model: GROQ_MODEL env, else chain head.
 * Ignores deprecated llama ids and OpenRouter-only slugs from forecasting.
 */
export function resolveGroqModel(override?: string): string {
  const fromEnv = process.env.GROQ_MODEL?.trim();
  const trimmed = override?.trim();

  if (
    trimmed &&
    !isOpenRouterOnlyModelId(trimmed) &&
    !isDeprecatedGroqModel(trimmed)
  ) {
    return trimmed;
  }
  if (fromEnv && !isDeprecatedGroqModel(fromEnv)) {
    return fromEnv;
  }
  return DEFAULT_GROQ_MODEL;
}

/** Models to try: single explicit env/override, or full fast-first chain. */
export function resolveGroqModelChain(override?: string): string[] {
  const fromEnv = process.env.GROQ_MODEL?.trim();
  if (fromEnv && !isDeprecatedGroqModel(fromEnv)) {
    return [fromEnv];
  }

  const trimmed = override?.trim();
  if (
    trimmed &&
    !isOpenRouterOnlyModelId(trimmed) &&
    !isDeprecatedGroqModel(trimmed) &&
    !isKnownGroqModelId(trimmed)
  ) {
    return [trimmed];
  }

  const primary = resolveGroqModel(override);
  const startIdx = (GROQ_MODEL_CHAIN as readonly string[]).indexOf(primary);
  if (startIdx >= 0) {
    return [...GROQ_MODEL_CHAIN.slice(startIdx)];
  }
  return [...GROQ_MODEL_CHAIN];
}

function mapHttpStatusToKind(status: number): ChatCompletionFailureKind {
  if (status === 402) {
    return "billing";
  }
  if (status === 429) {
    return "rate_limit";
  }
  return "upstream";
}

function isReasoningGroqModel(model: string): boolean {
  return model.includes("gpt-oss") || model.includes("qwen");
}

function buildGroqRequestBody(
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0.7,
  };
  // Reasoning models: hide chain-of-thought so insights/forecast JSON stays clean
  if (isReasoningGroqModel(model)) {
    body.reasoning_format = "hidden";
  }
  return body;
}

function isRetriableGroqFailure(
  result: Extract<ChatCompletionResult, { ok: false }>,
): boolean {
  if (result.kind === "rate_limit" || result.kind === "upstream") {
    return true;
  }
  if (result.status != null && RETRIABLE_HTTP_STATUSES.has(result.status)) {
    return true;
  }
  return false;
}

function isEmptyGroqResponse(data: ChatCompletionResponse): boolean {
  const content = data.choices?.[0]?.message?.content;
  return typeof content !== "string" || content.trim().length === 0;
}

async function requestGroqModel(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGroqRequestBody(model, messages, options)),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const text = await response.text();
      const kind = mapHttpStatusToKind(response.status);
      console.error("[Groq] API error:", model, response.status, text);
      return {
        ok: false,
        kind,
        provider: "groq",
        status: response.status,
        message: text.slice(0, 500),
      };
    }

    const data = (await response.json()) as ChatCompletionResponse;
    if (isEmptyGroqResponse(data)) {
      console.warn("[Groq] Empty response from model:", model);
      return {
        ok: false,
        kind: "upstream",
        provider: "groq",
        message: "Empty response",
      };
    }
    return { ok: true, data, provider: "groq" };
  } catch (error) {
    console.error("[Groq] Request failed:", model, error);
    return {
      ok: false,
      kind: "upstream",
      provider: "groq",
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Create a chat completion via Groq with fast-first model chain failover.
 */
export async function createGroqChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  if (!isGroqConfigured()) {
    return { ok: false, kind: "not_configured", provider: "groq" };
  }

  const apiKey = process.env.GROQ_API_KEY!;
  const models = resolveGroqModelChain(options.model);
  let lastFailure: Extract<ChatCompletionResult, { ok: false }> | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    const result = await requestGroqModel(apiKey, model, messages, options);

    if (result.ok) {
      return result;
    }

    lastFailure = result;
    const hasNext = i < models.length - 1;
    if (hasNext && isRetriableGroqFailure(result)) {
      console.warn(
        `[Groq] Model ${model} failed (${result.kind}), trying next in chain`,
      );
      continue;
    }
    break;
  }

  return (
    lastFailure ?? {
      ok: false,
      kind: "upstream",
      provider: "groq",
      message: "All Groq models failed",
    }
  );
}
