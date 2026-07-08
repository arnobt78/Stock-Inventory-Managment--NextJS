/**
 * AI / LLM utilities
 * OpenRouter primary, Groq fallback via createChatCompletion orchestrator.
 */

export {
  createChatCompletion,
  isLlmConfigured,
  isOpenRouterConfigured,
  isGroqConfigured,
  type ChatMessage,
  type ChatCompletionOptions,
  type ChatCompletionResponse,
  type ChatCompletionFailureKind,
  type ChatCompletionResult,
  type LlmProvider,
} from "./create-chat-completion";

export { createOpenRouterChatCompletion } from "./openrouter";
export {
  createGroqChatCompletion,
  DEFAULT_GROQ_MODEL,
  GROQ_MODEL_CHAIN,
  resolveGroqModel,
  resolveGroqModelChain,
} from "./groq";

/** @deprecated Use ChatMessage */
export type { OpenRouterMessage } from "./openrouter";
/** @deprecated Use ChatCompletionOptions */
export type { OpenRouterChatOptions } from "./openrouter";
/** @deprecated Use ChatCompletionResponse */
export type { OpenRouterChatResponse } from "./openrouter";
/** @deprecated Use ChatCompletionResult */
export type { OpenRouterResult } from "./openrouter";
/** @deprecated Use ChatCompletionFailureKind */
export type { OpenRouterFailureKind } from "./openrouter";
