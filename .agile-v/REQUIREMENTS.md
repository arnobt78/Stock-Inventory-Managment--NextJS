# Requirements — stock-inventory (Cycle C1)

Canonical REQ source. All artifacts link via `REQ-XXXX`. Status: `done` | `verify` | `planned`.

---

## REQ-0001 — Radix Select `removeChild` mitigation

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | verify |

**Intent:** Prevent `NotFoundError: removeChild` when navigating with open Radix Select portals.

**Acceptance criteria**

- AC1: `DeferredSelectGate` on filter toolbars, LoginPage, admin detail, dialogs (`enabled={open}`), shipping dialog
- AC2: `PaginationSelector` + `use-deferred-radix-select` on all table footers
- AC3: No console `removeChild` on `/products` → `/orders` with dialog open (manual)

**Artifacts:** `components/shared/DeferredSelectGate.tsx`, `hooks/use-deferred-radix-select.ts`, gated components per `BUILD_MANIFEST.md`

---

## REQ-0002 — OpenRouter billing / upstream errors (no Sentry 502 spam)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: Typed LLM results; 402/429/5xx → `serviceUnavailableResponse` (not uncaught 502)
- AC2: Client shows billing toast only when all providers fail
- AC3: `lib/ai/openrouter.test.ts` covers 402 path

---

## REQ-0003 — OAuth Google username P2002 recovery

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `lib/auth/unique-username.ts` + P2002 recovery in Google callback
- AC2: `lib/auth/unique-username.test.ts` passes

---

## REQ-0004 — Home route hydration (SSR-first)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `app/page.tsx` SSR without route `<Suspense>`; `initialOAuthSuccess` from server
- AC2: `app/layout.tsx` `force-dynamic`
- AC3: `CategoryList` always mounts gated filters

---

## REQ-0005 — Groq LLM fallback (OpenRouter primary)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | verify |

**Acceptance criteria**

- AC1: `createChatCompletion` tries OpenRouter then Groq on billing/rate_limit/upstream/not_configured
- AC2: `GROQ_API_KEY` only required on Vercel; fast-first chain in `lib/ai/groq.ts` (REQ-0018)
- AC3: `resolveGroqModel` ignores OpenRouter slugs (`openai/*`) for forecasting fallback
- AC4: Production POST `/api/ai/insights` returns 200 with `provider: groq` when OpenRouter fails
- AC5: Tests in `lib/ai/*.test.ts` (9+ cases)

---

## REQ-0006 — DeferredSelectGate on all remaining Select surfaces

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | verify |

**Acceptance criteria**

- AC1: All plan dialog files gated (`enabled={open}`)
- AC2: Admin/shipping pages gated (default `enabled`)
- AC3: `PaginationSelector` uses hook directly (by design)

---

## REQ-0007 — Notification bell dropdown layout

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: Dropdown portaled via Radix `DropdownMenu` (not clipped by header `overflow-x-hidden`)
- AC2: No extra Y scrollbar on navbar when bell opens
- AC3: Panel visible below bell on desktop and mobile

**Artifacts:** `NotificationBell.tsx`, `NotificationDropdown.tsx`, `Navbar.tsx`

---

## REQ-0008 — Agile V state persistence (`.agile-v/`)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |

**Acceptance criteria**

- AC1: `.agile-v/` with STATE, REQUIREMENTS, DECISION_LOG, VALIDATION_SUMMARY, BUILD_MANIFEST, ATM
- AC2: `.cursor/rules/agile-v-core.mdc` `alwaysApply: true`
- AC3: 24 skill stubs in `.agile-v/skills/`

---

## REQ-0009 — Post-deploy Sentry regression watch (planned)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | planned |

**Acceptance criteria**

- AC1: 24h production Sentry review after deploy
- AC2: `SENTRY_ERRORS.md` cases 1–7 trend down or resolved
- AC3: CAPA entry if regression

---

## REQ-0010 — Products API Zod validation (POST + PUT)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `createProductBodySchema` / `updateProductBodySchema` in `lib/validations/product.ts`
- AC2: POST + PUT `/api/products` use `safeParse` (invoice pattern); `userId` from session only
- AC3: Validation failures return 400 with Zod `details`; `logger.warn` not `error`
- AC4: `lib/validations/product-api.test.ts` covers empty categoryId, invalid SKU, valid payload

**Artifacts:** `app/api/products/route.ts`, `lib/validations/product.ts`

---

## REQ-0011 — Central 4xx-aware logging (Sentry noise reduction)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `getErrorHttpStatus` / `isExpectedClientError` in `lib/api/errors.ts`
- AC2: Production `logger.error` skips Sentry for Axios 4xx (e.g. mutation catch blocks)
- AC3: `errorResponse` uses `logger.warn` when `statusCode < 500`
- AC4: `lib/logger.test.ts` — 400 Axios skipped, 500 reported
- AC5: Invoice 409 toast title "Invoice already exists"; `productFormSubmitSchema` on product dialog

**Artifacts:** `lib/logger.ts`, `lib/api/response-helpers.ts`, `hooks/queries/use-invoices.ts`, `components/products/ProductFormDialog.tsx`

---

## REQ-0012 — Catalog API Zod validation (categories, suppliers, warehouses)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `createCategoryBodySchema` / `updateCategoryBodySchema`, same for suppliers; `lib/validations/warehouse.ts` for warehouses
- AC2: POST + PUT `safeParse` on `/api/categories`, `/api/suppliers`, `/api/warehouses`; `userId` from session only
- AC3: Validation failures → 400 + Zod `details`; `logger.warn`
- AC4: `getErrorHttpStatus` / `isExpectedClientError` exported from `lib/api/index.ts`
- AC5: Unit tests: `category-api`, `supplier-api`, `warehouse-api`, `errors.test.ts`

**Artifacts:** `lib/validations/{category,supplier,warehouse}.ts`, matching API routes, `docs/SENTRY_ERRORS.md`

---

## REQ-0014 — ChunkLoadError auto-reload in ErrorBoundary

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** After a Vercel deploy, users with stale tab/page receive `ChunkLoadError` when a lazy import tries to fetch a now-invalidated chunk hash. Currently `ErrorBoundary.componentDidCatch` logs and reports to Sentry and shows a crash UI. The correct fix is to silently auto-reload on `ChunkLoadError`, restoring the user to the fresh deploy without a Sentry event.

**Acceptance criteria**

- AC1: `ErrorBoundary.componentDidCatch` detects `ChunkLoadError` by name and triggers `window.location.reload()` — no Sentry capture, no crash UI shown
- AC2: Non-`ChunkLoadError` errors continue to report to Sentry and show fallback UI unchanged
- AC3: A `sessionStorage` guard prevents an infinite reload loop (reload once, then fall through to crash UI)
- AC4: `ErrorBoundary.tsx` updated; `app/layout.tsx` unchanged

**Artifacts:** `components/shared/ErrorBoundary.tsx`

---

## REQ-0015 — OrderDialog RHF validation logger level

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |

**Intent:** `OrderDialog.tsx:949` calls `logger.error("Order form validation errors:", errors)` in the RHF `handleSubmit` invalid callback. This fires for pure client-side form validation failures (missing fields, wrong type) — it never reaches any API. `logger.error` routes through Sentry; `logger.warn` does not. Client-side form validation is expected UX feedback, not a production error.

**Acceptance criteria**

- AC1: `logger.error` at line ~949 changed to `logger.warn`
- AC2: `console.error` at line ~945 changed to `console.warn` (debug noise reduction)
- AC3: API-level errors at lines ~487 and ~628 (`logger.error("Order creation error:", ...)`, `logger.error("Order update error:", ...)`) remain as `logger.error` (those are genuine server failures)
- AC4: No other logic changed in `OrderDialog.tsx`

**Artifacts:** `components/orders/OrderDialog.tsx`

---

## REQ-0018 — Groq model deprecation migration

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** Replace deprecated `llama-3.3-70b-versatile` (Groq shutdown Aug 16, 2026) with fast-first multi-model chain.

**Acceptance criteria**

- AC1: `GROQ_MODEL_CHAIN`: `openai/gpt-oss-20b` → `qwen/qwen3.6-27b` → `openai/gpt-oss-120b`
- AC2: Deprecated llama env ids remapped to chain; `GROQ_MODEL` optional single override
- AC3: Failover on retriable errors inside `createGroqChatCompletion`
- AC4: `reasoning_format: "hidden"` for gpt-oss/qwen models
- AC5: Tests in `lib/ai/groq.test.ts` + orchestrator tests updated

**Artifacts:** `lib/ai/groq.ts`, `lib/ai/index.ts`, `.env.example`, `README.md`, `docs/LLM_MODEL_SELECTION.md`

---

## REQ-0019 — Admin dashboard AI truncation + hydration

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** Fix clipped forecasting AI insights (`max_tokens: 200`) and React #418 hydration on `/admin/dashboard-overall-insights`.

**Acceptance criteria**

- AC1: Forecasting `generateAIInsights` uses `LLM_INSIGHTS_MAX_TOKENS` (512) — full text, no mid-sentence cut
- AC2: POST `/api/ai/insights` shares same constant
- AC3: Redis cache key `forecasting:summary:v2:*` busts stale truncated cache
- AC4: `AdminAnalyticsContent` uses `formatStableCurrency` + `formatStableCompactDateTime` (UTC)
- AC5: `app/admin/dashboard-overall-insights/page.tsx` exports `force-dynamic`
- AC6: Tests in `lib/date/format-stable.test.ts`; Red Team pass

**Artifacts:** `lib/ai/constants.ts`, `app/api/forecasting/route.ts`, `app/api/ai/insights/route.ts`, `lib/date/format-stable.ts`, `components/admin/AdminAnalyticsContent.tsx`

---

## REQ-0020 — Locale-aware admin formatting

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** Hydration-safe first paint + browser locale/TZ after mount for global demo users on admin dashboard pages.

**Acceptance criteria**

- AC1: `lib/format/client-locale.ts` — `formatClientCurrency`, `formatClientCompactDateTime`, `formatClientNumber`
- AC2: `ClientCurrency` + `ClientCompactDateTime` in `components/shared/ClientFormatDisplay.tsx`
- AC3: `AdminMyActivityContent` — no raw `toLocaleString` / `date-fns format` in markup
- AC4: `AdminAnalyticsContent` — `ClientCompactDateTime` for recent activity; chart tooltip uses `formatClientCurrency`
- AC5: `app/admin/my-activity/page.tsx` exports `force-dynamic`
- AC6: Tests in `lib/format/client-locale.test.ts`; Red Team pass

**Artifacts:** `lib/format/*`, `ClientFormatDisplay.tsx`, `AdminMyActivityContent.tsx`, `AdminAnalyticsContent.tsx`, `StatisticsCard.tsx`

---

## REQ-0016 — OAuth state mismatch log level

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |

**Intent:** Expired/missing `oauth_state` cookie on Google callback is expected UX (back-button, interrupted flow), not a server failure.

**Acceptance criteria**

- AC1: `logger.warn` (not `error`) on state mismatch in `app/api/auth/oauth/google/callback/route.ts`
- AC2: Redirect to `/login?error=invalid_state` unchanged

---

## REQ-0017 — Radix portal removeChild (Safari + Chrome)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** Radix `SelectPortal` teardown during App Router navigation throws `NotFoundError` on `removeChild` (Safari: "can not be found here"; Chrome: "not a child"). Stop Sentry noise and silent-recover in ErrorBoundary.

**Acceptance criteria**

- AC1: `isRadixPortalRemoveChildError` + `isRadixPortalRemoveChildSentryEvent` in `lib/monitoring/sentry-config.ts`
- AC2: `scrubSentryEvent` drops Radix portal removeChild events
- AC3: `ErrorBoundary` silent recovery (no crash UI, no Sentry) via shared helper
- AC4: `ActivityLogSection` `DeferredSelectGate` `enabled={!isPending}`
- AC5: Tests in `lib/monitoring/sentry-config.test.ts` (Safari + Chrome + regression)

**Artifacts:** `sentry-config.ts`, `ErrorBoundary.tsx`, `ActivityLogSection.tsx`

---

## REQ-0013 — Remaining API Zod consistency

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Acceptance criteria**

- AC1: `logger.warn` on all `safeParse` validation failures (orders, users, tickets, reviews, stock-allocations, email-preferences)
- AC2: New schemas: payment, shipping, notification, system-config, ai; product QR + auth body aliases
- AC3: `safeParse` on checkout, shipping (rates/labels/tracking), notifications (email + in-app), system-config, ai/insights, products/qr-code, auth login/register
- AC4: Unit tests in `lib/validations/*-api.test.ts` (284 total)
- AC5: Webhooks/multipart routes unchanged (Stripe, Shippo, QStash, product image)

**Artifacts:** `lib/validations/{payment,shipping,notification,system-config,ai}.ts`, matching `app/api/*` routes
