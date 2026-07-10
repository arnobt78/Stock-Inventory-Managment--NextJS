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

## REQ-0021 — Shell-first navigation + data-slot pulse skeletons

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |

**Intent:** Instant layout shell on navbar/sidebar navigation; pulse skeletons only on dynamic values (metrics, counts, table cells, charts) while SSR/RQ loads. No `loading.tsx`.

**Acceptance criteria**

- AC1: `DataSlotPulse` + `isDataSlotLoading` in shared lib
- AC2: Tables render real column headers; body cells pulse while loading
- AC3: `StatisticsCard` shows titles/icons; values and badge numbers pulse only
- AC4: Tier 1 navbar + Tier 2 admin routes shell-first (no full-card/table replacement)
- AC5: `page.tsx` session-only shell + Suspense streamed data OR parallelized fetch; no sequential blocking chains
- AC6: List/dashboard hooks accept `initialData` for first-render hydration (no `isPending` flash when SSR data exists)
- AC7: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `components/shared/DataSlotPulse.tsx`, `lib/react-query/is-data-slot-loading.ts`, `components/ui/table-data-skeleton.tsx`, `hooks/queries/*`, list/table components, `app/**/page.tsx`

---

## REQ-0022 — Tier-3 user detail shell-first gap closure

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0021 |

**Intent:** Close remaining REQ-0021 gaps: user-facing Order/Invoice detail pages use shell-first + `DataSlotPulse` (no full-page skeleton gate); remove dead `StatisticsCardSkeleton`.

**Acceptance criteria**

- AC1: `OrderDetailPage` — shell always visible; `isDataSlotLoading` + pulse on dynamic slots only
- AC2: `InvoiceDetailPage` — same pattern; `embedInAdmin` / `backHref` preserved
- AC3: `StatisticsCardSkeleton.tsx` deleted; barrel export removed
- AC4: Admin list wrappers verified (`initial*` pass-through)
- AC5: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `components/Pages/OrderDetailPage.tsx`, `components/Pages/InvoiceDetailPage.tsx`, `components/home/index.ts`

---

## REQ-0023 — Admin detail shell-first gap closure

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0021 / REQ-0022 |

**Intent:** Migrate all 5 `Admin*DetailContent` components from full-page `Loader2` spinner gates to shell-first + `DataSlotPulse` (matching REQ-0022 user detail pattern).

**Acceptance criteria**

- AC1: `AdminHistoryDetailContent` — shell-first + pulse on dynamic slots
- AC2: `AdminProductReviewDetailContent` — same pattern
- AC3: `AdminSupportTicketDetailContent` — ticket shell-first; replies pulse independently
- AC4: `AdminUserManagementDetailContent` — same pattern
- AC5: `AdminOrderDetailContent` — mirror OrderDetailPage pulse map + admin controls
- AC6: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `components/admin/Admin*DetailContent.tsx` (5 files)

---

## REQ-0024 — Shell-first consistency, detail SSR prefetch, order detail DRY

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0021 / REQ-0022 / REQ-0023 |

**Intent:** Close deferred gaps: admin settings shell-first + SSR; detail-route SSR prefetch (role-scoped); Order detail DRY via shared subcomponents.

**Acceptance criteria**

- AC1: `SystemConfigSettings` + `app/admin/settings/page.tsx` — SSR shell + `initialData` + `DataSlotPulse` on field values
- AC2: Shared transform extractors for order/invoice (and other detail entities)
- AC3: `lib/server/*-detail-data.ts` role-scoped helpers + `initialData` on singular detail hooks
- AC4: Suspense + `*WithData` on detail `page.tsx` routes (tiers 1–3)
- AC5: `components/orders/detail/*` shared sections; slim orchestrators
- AC6: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `lib/server/*-detail-data.ts`, `lib/orders/transform-order-detail.ts`, `components/orders/detail/*`, detail `page.tsx` routes, `SystemConfigSettings.tsx`

---

## REQ-0025 — Blocking SSR prefetch, no shell flash, warm cache

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0021 / REQ-0024 |

**Intent:** Eliminate Suspense fallback skeleton flash on refresh; remove RSC+client double-fetch; SSR all list/detail/portal gaps; warm TanStack cache after login.

**Acceptance criteria**

- AC1: All `app/**/page.tsx` use blocking `await` in default export + `export const dynamic = "force-dynamic"` (no `<Suspense>` fallback shells)
- AC2: `withInitialData()` + `refetchOnMount: false` when `initialData` present
- AC3: Admin combined orders/invoices SSR both legs + dashboard stats; admin layout SSR `getAdminCounts`
- AC4: Forecasting, email preferences, client/supplier portals, my-activity SSR prefetch
- AC5: `RouteWarmPrefetch` role-scoped `queryClient.prefetchQuery` after auth
- AC6: Product review hooks lazy until dropdown open (no table N+1)
- AC7: Red Team pass (lint, test 311, test:invalidate 200, build)

**Artifacts:** `lib/react-query/ssr-query-options.ts`, `warm-route-prefetch.ts`, `lib/server/forecasting-data.ts`, `lib/server/email-preferences-data.ts`, `components/providers/RouteWarmPrefetch.tsx`, all `app/**/page.tsx`

---

## REQ-0026 — P3 SSR gaps: secondary detail data, client browse, ghost fetches

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0025 |

**Intent:** Close P3 performance gaps: stop ghost list-page API fetches, SSR secondary detail data (reviews, stock, order eligibility batch), SSR client browse/catalog, defer RouteWarmPrefetch, tune notifications, remove dev instrumentation.

**Acceptance criteria**

- AC1: `useClientOrders` / `useClientInvoices` / `useDashboard` gated by `enabled` in OrderList/InvoiceList — no admin client-orders on user `/orders`
- AC2: Warehouse detail SSR stock allocations; product detail SSR reviews + eligibility; order detail batch review context (no N+1)
- AC3: Client `/products` SSR browse meta + default owner products; `/client` SSR catalog overview
- AC4: Portal hooks `staleTime` + supplier list pages pass `initialSupplierPortal`; soft nav skips redundant refetch
- AC5: `RouteWarmPrefetch` deferred after first paint; client warm keys added
- AC6: Notifications tuned when SSR seed present; list fetch gated when dropdown closed
- AC7: Portal charts use `DeferredChartSection`; SessionPerfLogger removed
- AC8: Client owner dropdown — `ProductOwnerSelect` (searchable Command); browse-meta filters to product owners only; `placeholderData` on owner switch
- AC9: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `lib/server/*-data.ts`, `OrderList.tsx`, `InvoiceList.tsx`, `ClientProductList.tsx`, `ProductOwnerSelect.tsx`, detail `page.tsx`, `RouteWarmPrefetch.tsx`, `use-notifications.ts`, portal pages

---

## REQ-0027 — C2 perf polish (backlog)

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R1 |
| **Status** | done |
| **Parent** | REQ-0026 |

**Intent:** Post-REQ-0026 polish — shareable client owner deep links; trim login API storm.

**Acceptance criteria**

- AC1: Client owner switch syncs `?ownerId=` via `history.replaceState` (no RSC refetch)
- AC2: `client-orders` / `client-invoices` warm-prefetch deferred until `/` or `/admin` visit
- AC3: Unit tests for `getProductOwnerAdminsForBrowse`, `resolveDefaultBrowseOwnerId`, `replaceShallowSearchParam`
- AC4: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `lib/navigation/shallow-search-param.ts`, `ProductsPage.tsx`, `RouteWarmPrefetch.tsx`, `warm-route-prefetch.ts`

---

## REQ-0028 — UI consistency (scrollbar, login, tables, glass badges)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Parent** | REQ-0027 |

**Intent:** Stable scrollbar gutter; login form persist; unified table typography; glass semantic badges across orders/invoices/tickets/reviews/admin filters; invoice list scope fixes.

**Acceptance criteria**

- AC1: `scrollbar-gutter: stable` + thin transparent-track scrollbar in `globals.css`
- AC2: Login keeps email/password/role visible during redirect; welcome toast on dashboard
- AC3: Table headers `font-medium`; data `font-normal`; secondary `text-xs`; primary `text-sm`
- AC4: Filter triggers + menu items `font-normal`
- AC5: `GLASS_BADGE_CLASS` dark-mode tokens on all hues (`lib/ui/glass-badge-styles.ts`)
- AC6: Semantic badges: orders, invoices, tickets, reviews, user-role, import, audit → `lib/ui/semantic-badges.tsx`
- AC7: Colored filter dropdowns for status/priority/role/import (ticket, review, admin filters)
- AC8: Invoice list: store-scoped Prisma filters; payment `pending`→`unpaid`; role-scoped TanStack keys
- AC9: Red Team pass

**Artifacts:** `globals.css`, `LoginPage.tsx`, `post-login-welcome.ts`, `table.tsx`, `badge.tsx`, `*TableColumns.tsx`, `lib/ui/glass-badge-styles.ts`, `lib/ui/semantic-badges.tsx`, `*Filter.tsx`, `lib/invoices/*`

---

## REQ-0029 — Supplier read-only catalog entity detail access

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Parent** | REQ-0024 / REQ-0025 |

**Intent:** Suppliers can open category/supplier detail pages linked from their products (read-only, product-scoped) without 404; role-scoped Redis cache prevents cross-role payload leak.

**Acceptance criteria**

- AC1: Supplier with assigned product in category X opens `/categories/X` (SSR + GET API) — read-only, only supplier's products in that category
- AC2: Supplier opens `/suppliers/{ownEntityId}` — read-only, products scoped to own `supplierId`
- AC3: Unrelated category/supplier IDs return 404 for supplier
- AC4: Admin/client/retailer behavior unchanged
- AC5: Redis detail keys scoped for supplier (`categories:detail:{id}:supplier:{entityId}`)
- AC6: Category/supplier detail pages disable Edit/Duplicate/Delete for supplier + client
- AC7: Red Team pass

**Artifacts:** `lib/server/catalog-entity-access.ts`, `lib/server/category-detail-data.ts`, `lib/server/supplier-detail-data.ts`, `lib/cache/cache-utils.ts`, `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx`, `lib/server/catalog-entity-access.test.ts`

---

## REQ-0030 — Auth login/register UX polish

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |

**Intent:** Polish login/register UX: role dropdown icons in menu items, smooth chevron rotation, max-w-7xl auth layout, viewport-centered background illustration, CSS-only staggered entrance animations.

**Acceptance criteria**

- AC1: Test-account `SelectItem` rows show role icon + label (not trigger-only)
- AC2: Select chevron rotates 180° smoothly on open/close (`select.tsx` group pattern)
- AC3: Login + register content constrained to `max-w-7xl`; app shell stays `max-w-9xl`
- AC4: Left promo cards + form rows ease-in with stagger on page load; `prefers-reduced-motion` respected
- AC5: Background SVG centered on viewport (x-y middle), may sit under form column
- AC6: Shared auth components (`AuthPageShell`, `LoginRoleSelect`, etc.); no TanStack/CRUD changes
- AC7: Red Team pass (lint, test, invalidate, build)

**Artifacts:** `lib/auth/test-accounts.ts`, `components/auth/*`, `LoginPage.tsx`, `RegisterPage.tsx`, `components/ui/select.tsx`, `tailwind.config.ts`, `app/globals.css`, `app/login/page.tsx`, `app/register/page.tsx`

---

## REQ-0031 — Auth left panel list redesign

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0030 |

**Intent:** Replace login/register left-column 2x2 promo grid with navbar-style brand header (Stockly + Stock Inventory Management subtitle) and a single professional list-view panel.

**Acceptance criteria**

- AC1: Brand matches Navbar rose icon box + Stockly gradient + subtitle
- AC2: Login left panel = single list panel (no 2x2 grid); professional copy
- AC3: Register left panel = same list pattern with register-specific copy
- AC4: Stagger animations via existing `AuthAnimatedBlock`
- AC5: Remove dead `AuthPromoCard` / `promo-card-styles` after migration
- AC6: Red Team pass (lint, test, invalidate, build)

**Artifacts:** `lib/auth/auth-panel-copy.ts`, `components/auth/AuthBrandHeader.tsx`, `AuthInfoPanel.tsx`, `AuthInfoListItem.tsx`, `auth-list-styles.ts`, `LoginPage.tsx`, `RegisterPage.tsx`

---

## REQ-0032 — Auth glass parity, flat list, BG animation

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0031 |

**Intent:** Match right form glass blur to left, flatten left column (no outer card, space-y-2 rows), expand list copy to 6 items, animate viewport BG illustration (zoom + nudge).

**Acceptance criteria**

- AC1: `AuthFormCard` with `backdrop-blur-2xl` on login/register forms
- AC2: Left column flat stack — no outer card shell; `space-y-2` between rows
- AC3: Per-row micro-glass + stagger via `AuthAnimatedBlock`
- AC4: 6 list items per page in `auth-panel-copy.ts`
- AC5: CSS `authBgFloat` on illustration; `prefers-reduced-motion` respected
- AC6: Red Team pass

**Artifacts:** `auth-glass-styles.ts`, `AuthFormCard.tsx`, `AuthInfoPanel.tsx`, `AuthInfoListItem.tsx`, `AuthPageShell.tsx`, `globals.css`, `auth-panel-copy.ts`, `LoginPage.tsx`, `RegisterPage.tsx`

---

## REQ-0033 — Auth login/register polish (copy, scroll shift, icon glow, spacing)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0032 |

**Intent:** Polish auth left panel copy (no exposed demo password), prevent layout shift when test-account Select opens, glassmorphic glow on list icon pills, tighter list spacing.

**Acceptance criteria**

- AC1: Login `sectionTitle` / `sectionLead` professional; no password string in UI; demo pre-fill unchanged in `test-accounts.ts`
- AC2: `html:has(.auth-page-root) { scrollbar-gutter: stable }` + `auth-page-root` on `AuthPageShell`; no horizontal shift when Select opens
- AC3: `AUTH_LIST_ICON_GLASS` on login + register list icon pills (gradient + hue shadow; light + dark)
- AC4: Tighter spacing — `space-y-1` list stack, `space-y-0.5` title/description, row `py-2` (supersedes REQ-0032 `space-y-2` row gap)
- AC5: No TanStack/CRUD/API changes
- AC6: Red Team pass (lint, test, invalidate, build)

**Artifacts:** `lib/auth/auth-panel-copy.ts`, `components/auth/auth-glass-styles.ts`, `auth-list-styles.ts`, `AuthInfoListItem.tsx`, `AuthInfoPanel.tsx`, `AuthPageShell.tsx`, `app/globals.css`

---

## REQ-0034 — Auth welcome/goodbye session toasts

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0030 |

**Intent:** Restore deferred welcome toast after login redirect and goodbye toast after logout redirect.

**Acceptance criteria**

- AC1: Email/password login → welcome toast on role destination (`/`, `/client`, `/supplier`)
- AC2: Logout from Navbar/AdminSidebar/SidebarLayout → goodbye toast on `/login`
- AC3: `Toaster` mounts before `AuthSessionToasts`; `AuthSessionToasts` uses `useEffect`; `useToast` syncs `memoryState` on subscribe
- AC4: Remove dead `use-post-login-welcome-toast.ts` hook
- AC5: No TanStack/CRUD changes
- AC6: Red Team pass

**Artifacts:** `app/layout.tsx`, `AuthSessionToasts.tsx`, `hooks/use-toast.ts`, `lib/auth/post-login-welcome.ts`, `lib/auth/post-logout-goodbye.ts`, `LoginPage.tsx`, `Navbar.tsx`, `AdminSidebar.tsx`, `SidebarLayout.tsx`

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
