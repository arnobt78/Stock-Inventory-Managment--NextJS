# Phase 04 — Groq model migration (REQ-0018)

**Status:** done | **Deploy:** `2c1cf32`

## Delivered

- `GROQ_MODEL_CHAIN`: `openai/gpt-oss-20b` → `qwen/qwen3.6-27b` → `openai/gpt-oss-120b`
- Deprecated llama env remap; OpenRouter slug denylist unchanged
- Failover on 429/5xx/empty/network inside `createGroqChatCompletion`
- `reasoning_format: "hidden"` for gpt-oss/qwen
- Tests: `groq.test.ts`, `create-chat-completion.test.ts`

## Out of scope (by design)

TanStack, SSR, hooks, invalidation, frontend — orchestrator unchanged.

## Red Team

lint ✓ · test 296 ✓ · invalidate 200 ✓ · build ✓
