# Decision Log (append-only)

Format: `TIMESTAMP | AGENT | DECISION | RATIONALE | REQ-ID`

---

2026-05-19T00:00:00Z | build-agent | DeferredSelectGate pattern | Radix portal teardown on route change causes removeChild | REQ-0001
2026-05-19T00:00:00Z | build-agent | serviceUnavailableResponse for LLM 402 | Avoid Sentry 502 on billing; user-facing 503 | REQ-0002
2026-05-19T00:00:00Z | build-agent | unique-username + P2002 recovery | Google OAuth race on username unique index | REQ-0003
2026-05-19T00:00:00Z | build-agent | Remove route Suspense on `/` | Hydration mismatch; SSR props for OAuth flag | REQ-0004
2026-05-28T00:00:00Z | build-agent | OpenRouter → Groq orchestrator | Transparent fallback; single server round-trip | REQ-0005
2026-05-28T00:00:00Z | build-agent | resolveGroqModel ignores openai/* slugs | Forecasting passes OpenRouter model id | REQ-0005
2026-05-28T00:00:00Z | build-agent | Gate all remaining Selects | Complete removeChild surface coverage | REQ-0006
2026-05-28T00:00:00Z | build-agent | NotificationBell → DropdownMenu portal | overflow-x-hidden on navbar clipped absolute panel | REQ-0007
2026-05-28T00:00:00Z | requirement-architect | Bootstrap .agile-v C1 | Agile V traceability for ongoing fixes | REQ-0008
2026-05-19T00:00:00Z | build-agent | Zod safeParse on products POST/PUT | Prevent P2023; consistent 400 with invoices/orders | REQ-0010
2026-05-19T00:00:00Z | build-agent | isExpectedClientError in logger | Skip Sentry for expected 4xx from API + mutation catches | REQ-0011
2026-05-19T00:00:00Z | build-agent | errorResponse warn for 4xx | Align with serviceUnavailableResponse; no Sentry on client errors | REQ-0011
2026-05-19T00:00:00Z | build-agent | Catalog body schemas + safeParse | Mirror REQ-0010 for categories/suppliers/warehouses | REQ-0012
2026-05-19T00:00:00Z | build-agent | Export error HTTP helpers from lib/api | Single import path for hooks and logger consumers | REQ-0012
2026-05-19T00:00:00Z | build-agent | Track SENTRY audit in docs/ | Historical cases + status header; agile-v pointers | REQ-0009
2026-05-19T00:00:00Z | build-agent | Remaining API Zod safeParse sweep | Payment/shipping/notifications/auth/AI; logger.warn everywhere | REQ-0013
2026-06-27T00:00:00Z | build-agent | ChunkLoadError auto-reload in ErrorBoundary | Stale Vercel chunk after deploy; reload once with sessionStorage loop guard; skip Sentry | REQ-0014
2026-06-27T00:00:00Z | build-agent | OrderDialog logger.error → logger.warn for RHF invalid callback | Client-side form validation is expected UX path, not a server error; logger.error routes to Sentry | REQ-0015
2026-06-27T00:00:00Z | red-team | Hydration on /admin/dashboard-overall-insights MONITOR only | Single demo user (test@admin.com) Asia/Karachi tz; no date component change warranted yet | REQ-0009
2026-07-08T00:00:00Z | build-agent | OAuth state mismatch logger.warn | Expired/interrupted OAuth cookie is expected UX, not Sentry error | REQ-0016
2026-07-08T00:00:00Z | build-agent | Groq fast-first model chain | llama-3.3 deprecated Aug 2026; gpt-oss-20b → qwen → gpt-oss-120b in groq.ts | REQ-0018
2026-07-08T00:00:00Z | red-team | REQ-0018 audit complete | lib/ai only; no TanStack/SSR changes; 296 tests pass | REQ-0018
2026-07-08T00:00:00Z | build-agent | Forecasting max_tokens 512 + cache v2 | Truncated AI insights on admin dashboard | REQ-0019
2026-07-08T00:00:00Z | build-agent | formatStableCurrency + UTC compact datetime | React #418 text mismatch on admin dashboard | REQ-0019
