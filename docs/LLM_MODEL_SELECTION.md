# AI Model Selection & Fallback Strategy

## Purpose

This project is designed to work with multiple LLM providers and should NEVER depend on a single model.

If one model becomes unavailable, deprecated, rate limited, overloaded, or fails unexpectedly, the system should silently switch to the next suitable model without interrupting the user.

---

# Goals

- zero manual switching
- automatic fallback
- fastest available model
- highest coding quality
- minimal latency
- minimal cost
- graceful degradation
- future-proof against provider deprecations

---

# Important

Groq has announced the following model deprecations:

Deprecated

- llama-3.1-8b-instant
- llama-3.3-70b-versatile

Shutdown Date

August 16, 2026

Recommended replacements

- openai/gpt-oss-20b
- openai/gpt-oss-120b
- qwen/qwen3.6-27b

These deprecated models should never be used for new development. :contentReference[oaicite:0]{index=0}

---

# Preferred Coding Models

Priority 1

openai/gpt-oss-120b

Use for

- difficult debugging
- architecture
- large repositories
- refactoring
- planning
- agent workflows
- complex reasoning

---

Priority 2

qwen/qwen3.6-27b

Use for

- everyday coding
- repository edits
- frontend
- backend
- TypeScript
- React
- Next.js
- Shopify Hydrogen
- Remix
- Node
- Python

This should be considered the default fast coding model. :contentReference[oaicite:1]{index=1}

---

Priority 3

openai/gpt-oss-20b

Use for

- simple coding
- autocomplete
- quick fixes
- documentation
- tool calling
- JSON generation

This replaces llama-3.1-8b-instant. :contentReference[oaicite:2]{index=2}

---

# Automatic Fallback Order

Try in this exact order.

1. openai/gpt-oss-120b

↓

1. qwen/qwen3.6-27b

↓

1. openai/gpt-oss-20b

↓

1. Retry same request once

↓

1. Retry with shorter context

↓

1. Retry without images

↓

1. Retry with chunked context

↓

1. Return partial result instead of failing

Never stop after the first failure.

---

# Silent Failover Rules

Switch models automatically when

- timeout
- provider overload
- HTTP 429
- HTTP 500
- HTTP 502
- HTTP 503
- HTTP 504
- model unavailable
- deprecated model
- context overflow
- tool invocation failure

The user should never need to manually change models.

---

# Context Rules

Prefer

- repository map
- changed files
- current file
- imports
- dependencies

Avoid sending the entire repository whenever possible.

Use chunking for large repositories.

---

# Coding Behaviour

Always

- preserve formatting
- preserve comments
- preserve types
- preserve tests
- preserve lint rules
- preserve accessibility
- preserve translations

Never rewrite unrelated files.

---

# Tool Usage

Prefer

- search
- grep
- repository indexing
- AST edits

Avoid regex replacements unless necessary.

---

# Response Style

Return

- concise explanation
- modified files
- patch summary
- next steps

Avoid unnecessary prose.

---

# Hardware-Aware Local Model Suggestions

If local inference is available, choose models based on detected VRAM.

## 8 GB VRAM

Preferred

- Qwen 3.6 3B
- Gemma 3 4B
- Llama 3.2 3B
- Phi-4 Mini

Fallback

- Qwen 2.5 3B
- Gemma 2 2B

---

## 16 GB VRAM

Preferred

- GPT-OSS-20B (quantized if supported)
- Qwen3.6-27B Q4
- Gemma 3 12B
- Mistral Small

Fallback

- Qwen2.5-14B
- DeepSeek-R1 Distill 14B

---

## 24 GB VRAM

Preferred

- Qwen3.6-27B Q6/Q8
- GPT-OSS-20B
- DeepSeek-R1 Distill 32B (quantized)

Fallback

- Gemma 3 27B
- Mistral Large (quantized)

---

## 32 GB VRAM+

Preferred

- GPT-OSS-120B (remote)
- Qwen3.6-27B full precision
- DeepSeek distilled large variants
- Best available local coding model

Prefer highest-quality model before fastest model.

---

# Provider Preference

1. Groq
2. OpenRouter
3. OpenAI
4. Anthropic
5. Local Ollama
6. LM Studio

Choose whichever provider offers the highest-ranked available model.

---

# General Principles

Prefer

- deterministic outputs
- structured edits
- complete implementations
- compile-ready code
- production-ready quality

Avoid

- placeholders
- TODO comments
- fake implementations
- pseudocode

---

# Future Compatibility

This document intentionally avoids hardcoding a single model.

Whenever a better coding model becomes available, replace only the ranking list while keeping the fallback strategy unchanged.

The routing system should automatically adapt without requiring repository-wide changes.

Note: use as much as possible fallback strategies to avoid the risk of model failure using many models with different providers.

# Example Usage from other projects for reference that we already implemented

# AI Model Selection & Fallback Strategy

## Purpose

This project is designed to work with multiple LLM providers and should NEVER depend on a single model.

If one model becomes unavailable, deprecated, rate limited, overloaded, or fails unexpectedly, the system should silently switch to the next suitable model without interrupting the user.

---

## Goals

- zero manual switching
- automatic fallback
- fastest available model
- highest coding quality
- minimal latency
- minimal cost
- graceful degradation
- future-proof against provider deprecations

---

## Important — Groq deprecations

Groq has announced shutdown of these models on **August 16, 2026**:

- `llama-3.1-8b-instant`
- `llama-3.3-70b-versatile`

Recommended replacements:

- `openai/gpt-oss-20b`
- `openai/gpt-oss-120b`
- `qwen/qwen3.6-27b`

These deprecated models should never be used for new development.

---

## StoryBook Journal — AI Assist implementation (REQ-0010)

**Code:** `src/lib/ai-provider.ts` · **Routes:** `/api/ai/assist`, `/api/ai/assist/stream` · **Trace:** CR-0006, CR-0007, Wave 49–50

Journal AI assist continues a diary entry with 2–3 poetic sentences. Groq requests use `reasoning_format: "hidden"` and `max_tokens: 700` so reasoning models (gpt-oss, qwen3.6) return prose only — not chain-of-thought. OpenRouter uses `reasoning: { exclude: true }`. Sync path also runs `stripReasoning()` as a safety net.

### Hardcoded model chains (verified 2026-07-07)

Only `GROQ_API_KEY` and `OPENROUTER_API_KEY` env vars are required on Vercel. Model IDs live in code — no model env vars.

**Groq** (shuffled per request via Fisher-Yates):

1. `openai/gpt-oss-20b` — fastest, primary for short creative prose
2. `qwen/qwen3.6-27b` — richer prose (Preview tier on Groq)
3. `openai/gpt-oss-120b` — production safety net

**OpenRouter** (`:free` tier, shuffled):

1. `meta-llama/llama-3.3-70b-instruct:free`
2. `deepseek/deepseek-chat-v3-0324:free`
3. `openai/gpt-oss-20b:free`

**Legacy:** Anthropic (`ANTHROPIC_API_KEY`) when Groq + OpenRouter both fail.

**Dev placeholder:** `DEV_PLACEHOLDER` in `ai-assist.ts` when no keys are set.

### Failover behaviour

- Retry next model on HTTP 408, 429, 500, 502, 503, 504, empty response, or network error
- `usedFallback: true` when crossing from Groq to OpenRouter (toast: "Using backup AI provider")
- `rateLimited: true` when every Groq + OpenRouter model returns 429 (toast with dynamic `retryAfterSec`)
- User-facing rate limit: 10/min per user via Redis (`consumeAiRateLimit`)

### Future model updates

To adopt new models, edit only the `GROQ_MODELS` / `OPENROUTER_MODELS` arrays in `ai-provider.ts` and update TC-0044 tests. No Vercel env changes required.

---

## Preferred Coding Models (generic / agent workflows)

Priority 1 — `openai/gpt-oss-120b` — difficult debugging, architecture, large repos, refactoring, planning, agent workflows, complex reasoning.

Priority 2 — `qwen/qwen3.6-27b` — everyday coding, frontend, backend, TypeScript, React, Next.js.

Priority 3 — `openai/gpt-oss-20b` — simple coding, autocomplete, quick fixes, documentation, tool calling, JSON generation.

---

## Automatic Fallback Order (generic)

For agent/IDE workflows (not fully implemented in journal assist):

1. `openai/gpt-oss-120b`
2. `qwen/qwen3.6-27b`
3. `openai/gpt-oss-20b`
4. Retry same request once
5. Retry with shorter context
6. Retry without images
7. Retry with chunked context
8. Return partial result instead of failing

Never stop after the first failure.

---

## Silent Failover Rules

Switch models automatically when:

- timeout
- provider overload
- HTTP 429, 500, 502, 503, 504
- model unavailable or deprecated
- context overflow
- tool invocation failure

The user should never need to manually change models.

---

## Context Rules

Prefer repository map, changed files, current file, imports, dependencies. Avoid sending the entire repository. Use chunking for large repositories.

---

## Coding Behaviour

Always preserve formatting, comments, types, tests, lint rules, accessibility, translations. Never rewrite unrelated files.

---

## Provider Preference

1. Groq
2. OpenRouter
3. OpenAI
4. Anthropic
5. Local Ollama
6. LM Studio

Choose whichever provider offers the highest-ranked available model.

---

## Stock-inventory — Groq fallback (REQ-0018)

**Code:** [`lib/ai/groq.ts`](../lib/ai/groq.ts) · **Orchestrator:** [`lib/ai/create-chat-completion.ts`](../lib/ai/create-chat-completion.ts) · **Routes:** `/api/ai/insights`, `/api/forecasting`

Only `GROQ_API_KEY` required on Vercel. Model IDs live in code (`GROQ_MODEL_CHAIN`); optional `GROQ_MODEL` overrides to a single non-deprecated model.

**Fast-first chain** (failover on 429/5xx/empty/network):

1. `openai/gpt-oss-20b`
2. `qwen/qwen3.6-27b`
3. `openai/gpt-oss-120b`

**Deprecated (remapped automatically):** `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` — shutdown Aug 16, 2026.

**Reasoning models:** `reasoning_format: "hidden"` on gpt-oss and qwen requests so insights JSON stays clean.

**Tests:** `lib/ai/groq.test.ts`, `lib/ai/create-chat-completion.test.ts`

---

## Future Compatibility

Whenever a better coding model becomes available, replace only the ranking arrays while keeping the fallback strategy unchanged. The routing system should adapt without repository-wide changes.

Use as many fallback strategies as practical to avoid single-model failure risk across providers.
