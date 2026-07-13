# Requirements — stock-inventory (Cycle C1)

Canonical REQ source. All artifacts link via `REQ-XXXX`. Status: `done` | `verify` | `planned`.

---

## REQ-0001 — Radix Select `removeChild` mitigation

| Field        | Value  |
| ------------ | ------ |
| **Priority** | P1     |
| **Risk**     | R2     |
| **Status**   | verify |

**Intent:** Prevent `NotFoundError: removeChild` when navigating with open Radix Select portals.

**Acceptance criteria**

- AC1: `DeferredSelectGate` on filter toolbars, LoginPage, admin detail, dialogs (`enabled={open}`), shipping dialog
- AC2: `PaginationSelector` + `use-deferred-radix-select` on all table footers
- AC3: No console `removeChild` on `/products` → `/orders` with dialog open (manual)

**Artifacts:** `components/shared/DeferredSelectGate.tsx`, `hooks/use-deferred-radix-select.ts`, gated components per `BUILD_MANIFEST.md`

---

## REQ-0002 — OpenRouter billing / upstream errors (no Sentry 502 spam)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: Typed LLM results; 402/429/5xx → `serviceUnavailableResponse` (not uncaught 502)
- AC2: Client shows billing toast only when all providers fail
- AC3: `lib/ai/openrouter.test.ts` covers 402 path

---

## REQ-0003 — OAuth Google username P2002 recovery

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `lib/auth/unique-username.ts` + P2002 recovery in Google callback
- AC2: `lib/auth/unique-username.test.ts` passes

---

## REQ-0004 — Home route hydration (SSR-first)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `app/page.tsx` SSR without route `<Suspense>`; `initialOAuthSuccess` from server
- AC2: `app/layout.tsx` `force-dynamic`
- AC3: `CategoryList` always mounts gated filters

---

## REQ-0005 — Groq LLM fallback (OpenRouter primary)

| Field        | Value  |
| ------------ | ------ |
| **Priority** | P1     |
| **Risk**     | R2     |
| **Status**   | verify |

**Acceptance criteria**

- AC1: `createChatCompletion` tries OpenRouter then Groq on billing/rate_limit/upstream/not_configured
- AC2: `GROQ_API_KEY` only required on Vercel; fast-first chain in `lib/ai/groq.ts` (REQ-0018)
- AC3: `resolveGroqModel` ignores OpenRouter slugs (`openai/*`) for forecasting fallback
- AC4: Production POST `/api/ai/insights` returns 200 with `provider: groq` when OpenRouter fails
- AC5: Tests in `lib/ai/*.test.ts` (9+ cases)

---

## REQ-0006 — DeferredSelectGate on all remaining Select surfaces

| Field        | Value  |
| ------------ | ------ |
| **Priority** | P1     |
| **Risk**     | R2     |
| **Status**   | verify |

**Acceptance criteria**

- AC1: All plan dialog files gated (`enabled={open}`)
- AC2: Admin/shipping pages gated (default `enabled`)
- AC3: `PaginationSelector` uses hook directly (by design)

---

## REQ-0007 — Notification bell dropdown layout

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: Dropdown portaled via Radix `DropdownMenu` (not clipped by header `overflow-x-hidden`)
- AC2: No extra Y scrollbar on navbar when bell opens
- AC3: Panel visible below bell on desktop and mobile

**Artifacts:** `NotificationBell.tsx`, `NotificationDropdown.tsx`, `Navbar.tsx`

---

## REQ-0008 — Agile V state persistence (`.agile-v/`)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `.agile-v/` with STATE, REQUIREMENTS, DECISION_LOG, VALIDATION_SUMMARY, BUILD_MANIFEST, ATM
- AC2: `.cursor/rules/agile-v-core.mdc` `alwaysApply: true`
- AC3: 24 skill stubs in `.agile-v/skills/`

---

## REQ-0009 — Post-deploy Sentry regression watch (planned)

| Field        | Value   |
| ------------ | ------- |
| **Priority** | P2      |
| **Risk**     | R1      |
| **Status**   | planned |

**Acceptance criteria**

- AC1: 24h production Sentry review after deploy
- AC2: `SENTRY_ERRORS.md` cases 1–7 trend down or resolved
- AC3: CAPA entry if regression

---

## REQ-0010 — Products API Zod validation (POST + PUT)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `createProductBodySchema` / `updateProductBodySchema` in `lib/validations/product.ts`
- AC2: POST + PUT `/api/products` use `safeParse` (invoice pattern); `userId` from session only
- AC3: Validation failures return 400 with Zod `details`; `logger.warn` not `error`
- AC4: `lib/validations/product-api.test.ts` covers empty categoryId, invalid SKU, valid payload

**Artifacts:** `app/api/products/route.ts`, `lib/validations/product.ts`

---

## REQ-0011 — Central 4xx-aware logging (Sentry noise reduction)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `getErrorHttpStatus` / `isExpectedClientError` in `lib/api/errors.ts`
- AC2: Production `logger.error` skips Sentry for Axios 4xx (e.g. mutation catch blocks)
- AC3: `errorResponse` uses `logger.warn` when `statusCode < 500`
- AC4: `lib/logger.test.ts` — 400 Axios skipped, 500 reported
- AC5: Invoice 409 toast title "Invoice already exists"; `productFormSubmitSchema` on product dialog

**Artifacts:** `lib/logger.ts`, `lib/api/response-helpers.ts`, `hooks/queries/use-invoices.ts`, `components/products/ProductFormDialog.tsx`

---

## REQ-0012 — Catalog API Zod validation (categories, suppliers, warehouses)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `createCategoryBodySchema` / `updateCategoryBodySchema`, same for suppliers; `lib/validations/warehouse.ts` for warehouses
- AC2: POST + PUT `safeParse` on `/api/categories`, `/api/suppliers`, `/api/warehouses`; `userId` from session only
- AC3: Validation failures → 400 + Zod `details`; `logger.warn`
- AC4: `getErrorHttpStatus` / `isExpectedClientError` exported from `lib/api/index.ts`
- AC5: Unit tests: `category-api`, `supplier-api`, `warehouse-api`, `errors.test.ts`

**Artifacts:** `lib/validations/{category,supplier,warehouse}.ts`, matching API routes, `docs/SENTRY_ERRORS.md`

---

## REQ-0014 — ChunkLoadError auto-reload in ErrorBoundary

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Intent:** After a Vercel deploy, users with stale tab/page receive `ChunkLoadError` when a lazy import tries to fetch a now-invalidated chunk hash. Currently `ErrorBoundary.componentDidCatch` logs and reports to Sentry and shows a crash UI. The correct fix is to silently auto-reload on `ChunkLoadError`, restoring the user to the fresh deploy without a Sentry event.

**Acceptance criteria**

- AC1: `ErrorBoundary.componentDidCatch` detects `ChunkLoadError` by name and triggers `window.location.reload()` — no Sentry capture, no crash UI shown
- AC2: Non-`ChunkLoadError` errors continue to report to Sentry and show fallback UI unchanged
- AC3: A `sessionStorage` guard prevents an infinite reload loop (reload once, then fall through to crash UI)
- AC4: `ErrorBoundary.tsx` updated; `app/layout.tsx` unchanged

**Artifacts:** `components/shared/ErrorBoundary.tsx`

---

## REQ-0015 — OrderDialog RHF validation logger level

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R1    |
| **Status**   | done  |

**Intent:** `OrderDialog.tsx:949` calls `logger.error("Order form validation errors:", errors)` in the RHF `handleSubmit` invalid callback. This fires for pure client-side form validation failures (missing fields, wrong type) — it never reaches any API. `logger.error` routes through Sentry; `logger.warn` does not. Client-side form validation is expected UX feedback, not a production error.

**Acceptance criteria**

- AC1: `logger.error` at line ~949 changed to `logger.warn`
- AC2: `console.error` at line ~945 changed to `console.warn` (debug noise reduction)
- AC3: API-level errors at lines ~487 and ~628 (`logger.error("Order creation error:", ...)`, `logger.error("Order update error:", ...)`) remain as `logger.error` (those are genuine server failures)
- AC4: No other logic changed in `OrderDialog.tsx`

**Artifacts:** `components/orders/OrderDialog.tsx`

---

## REQ-0018 — Groq model deprecation migration

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

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

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

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

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R2       |
| **Status**   | done     |
| **Parent**   | REQ-0021 |

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

| Field        | Value               |
| ------------ | ------------------- |
| **Priority** | P1                  |
| **Risk**     | R2                  |
| **Status**   | done                |
| **Parent**   | REQ-0021 / REQ-0022 |

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

| Field        | Value                          |
| ------------ | ------------------------------ |
| **Priority** | P1                             |
| **Risk**     | R2                             |
| **Status**   | done                           |
| **Parent**   | REQ-0021 / REQ-0022 / REQ-0023 |

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

| Field        | Value               |
| ------------ | ------------------- |
| **Priority** | P1                  |
| **Risk**     | R2                  |
| **Status**   | done                |
| **Parent**   | REQ-0021 / REQ-0024 |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P3       |
| **Risk**     | R2       |
| **Status**   | done     |
| **Parent**   | REQ-0025 |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P3       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Parent**   | REQ-0026 |

**Intent:** Post-REQ-0026 polish — shareable client owner deep links; trim login API storm.

**Acceptance criteria**

- AC1: Client owner switch syncs `?ownerId=` via `history.replaceState` (no RSC refetch)
- AC2: `client-orders` / `client-invoices` warm-prefetch deferred until `/` or `/admin` visit
- AC3: Unit tests for `getProductOwnerAdminsForBrowse`, `resolveDefaultBrowseOwnerId`, `replaceShallowSearchParam`
- AC4: Red Team pass (lint, test, test:invalidate, build)

**Artifacts:** `lib/navigation/shallow-search-param.ts`, `ProductsPage.tsx`, `RouteWarmPrefetch.tsx`, `warm-route-prefetch.ts`

---

## REQ-0028 — UI consistency (scrollbar, login, tables, glass badges)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Parent**   | REQ-0027 |

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

| Field        | Value               |
| ------------ | ------------------- |
| **Priority** | P1                  |
| **Risk**     | R2                  |
| **Status**   | done                |
| **Parent**   | REQ-0024 / REQ-0025 |

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

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Polish login/register UX: role dropdown icons in menu items, smooth chevron rotation, max-w-7xl auth layout, viewport-centered background illustration, CSS-only staggered entrance animations.

**Acceptance criteria**

- AC1: Test-account `SelectItem` rows show role icon + label (not trigger-only)
- AC2: Select chevron rotates 180° smoothly on open/close (`select.tsx` group pattern)
- AC3: Login + register content constrained to `max-w-7xl` (app shell width superseded by REQ-0036 — full bleed)
- AC4: Left promo cards + form rows ease-in with stagger on page load; `prefers-reduced-motion` respected
- AC5: Background SVG centered on viewport (x-y middle), may sit under form column
- AC6: Shared auth components (`AuthPageShell`, `LoginRoleSelect`, etc.); no TanStack/CRUD changes
- AC7: Red Team pass (lint, test, invalidate, build)

**Artifacts:** `lib/auth/test-accounts.ts`, `components/auth/*`, `LoginPage.tsx`, `RegisterPage.tsx`, `components/ui/select.tsx`, `tailwind.config.ts`, `app/globals.css`, `app/login/page.tsx`, `app/register/page.tsx`

---

## REQ-0031 — Auth left panel list redesign

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0030 |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0031 |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0032 |

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

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0030 |

**Intent:** Restore deferred welcome toast after login redirect and goodbye toast after logout redirect.

**Acceptance criteria**

- AC1: Email/password login → welcome toast on role destination (`/`, `/client`, `/supplier`)
- AC2: Logout from Navbar/AdminSidebar → goodbye toast on `/login` (legacy SidebarLayout removed REQ-0069)
- AC3: `Toaster` mounts before `AuthSessionToasts`; `AuthSessionToasts` uses `useEffect`; `useToast` syncs `memoryState` on subscribe
- AC4: Remove dead `use-post-login-welcome-toast.ts` hook
- AC5: No TanStack/CRUD changes
- AC6: Red Team pass

**Artifacts:** `app/layout.tsx`, `AuthSessionToasts.tsx`, `hooks/use-toast.ts`, `lib/auth/post-login-welcome.ts`, `lib/auth/post-logout-goodbye.ts`, `LoginPage.tsx`, `Navbar.tsx`, `AdminSidebar.tsx`

---

## REQ-0035 — Google OAuth welcome toast

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0034 |

**Intent:** Show welcome toast after Google OAuth redirect on role destinations (`/`, `/client`, `/supplier`) via centralized `AuthSessionToasts` handler.

**Acceptance criteria**

- AC1: OAuth admin → welcome toast on `/` with `oauth_success` stripped from URL
- AC2: OAuth client → welcome on `/client`; supplier → `/supplier`
- AC3: `refreshSession` when OAuth lands without client user (client/supplier paths)
- AC4: Shared `auth-welcome-toast.ts` + `oauth-success-url.ts`; email/password flow unchanged
- AC5: Remove dead `consumePostLoginWelcome`
- AC6: No TanStack/CRUD changes; Red Team pass

**Artifacts:** `lib/auth/oauth-success-url.ts`, `lib/auth/auth-welcome-toast.ts`, `lib/auth/oauth-success-url.test.ts`, `AuthSessionToasts.tsx`, `post-login-welcome.ts`

---

## REQ-0036 — App shell full bleed (auth stays max-w-7xl)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0030 |

**Intent:** Restore pre-REQ-0030 ultrawide layout: logged-in app uses full viewport width (padding only). Login/register remain capped at `max-w-7xl` via `AuthPageShell`.

**Acceptance criteria**

- AC1: Navbar, Footer, and all list/detail inner wrappers have no `max-w-9xl` (legacy SidebarLayout removed REQ-0069)
- AC2: Login + register still `max-w-7xl` via `AuthPageShell`
- AC3: Unused `9xl` token removed from `tailwind.config.ts`
- AC4: Shared `APP_SHELL_WIDTH_CLASS` + `APP_SHELL_DETAIL_CLASS` in `lib/ui/shell-layout-styles.ts`
- AC5: No TanStack / CRUD / hydration changes; Red Team pass

**Artifacts:** `lib/ui/shell-layout-styles.ts`, `Navbar.tsx`, `Footer.tsx`, list/detail page components, `tailwind.config.ts`

---

## REQ-0037 — Product status filter glass badges

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0028 |

**Intent:** Product status filter dropdown uses same glass `ProductStockStatusBadge` as table/detail (closes REQ-0028 AC7 gap).

**Acceptance criteria**

- AC1: Filter rows render `ProductStockStatusBadge` (not flat `returnColor` divs)
- AC2: Icons/colors match table: Available=emerald, Stock Low=orange+AlertTriangle, Stock Out=red
- AC3: Trigger uses lucide `Package` icon (consistent with order/invoice filters)
- AC4: Filter values unchanged (`Available` / `Stock Low` / `Stock Out`); client filter logic unchanged
- AC5: Remove dead `returnColor`, react-icons imports
- AC6: No TanStack / CRUD changes; Red Team pass

**Artifacts:** `components/products/ProductStatusFilter.tsx`

---

## REQ-0038 — SafeImage rollout (remote + local fallback)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0028 |

**Intent:** Adopt `SafeImage` for all UI images; `next/image` first, native `<img>` fallback on optimizer/upstream failure (Vercel 402).

**Acceptance criteria**

- AC1: `SafeImage` used for all current `next/image` consumers (incl. auth SVG)
- AC2: `SafeAvatarImage` handles Google avatar → robohash fallback
- AC3: `SafeImage` resets native fallback when `src` changes (`failedSrc` pattern, no effect)
- AC4: `remotePatterns` unchanged (already correct)
- AC5: No TanStack / CRUD changes; Red Team pass

**Artifacts:** `components/ui/safe-image.tsx`, `components/ui/safe-avatar-image.tsx`, migrated consumer components, `docs/SAFE_IMAGE_REUSABLE_COMPONENT.md`

---

## REQ-0039 — Navbar Google avatar SafeAvatarImage

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0038 |

**Intent:** Close REQ-0038 AC2 gap — Navbar/Sidebar used SafeImage with merged avatarUrl so Google profile images never fell back to robohash on error.

**Acceptance criteria**

- AC1: Navbar desktop + mobile avatars use `SafeAvatarImage` with separate `src` + `fallbackSrc`
- AC2: Navbar desktop + mobile avatars use `SafeAvatarImage` (legacy SidebarLayout removed REQ-0069)
- AC3: Shared `resolveUserAvatarSources` + `getRoboHashAvatarUrl` in `lib/ui/user-avatar-sources.ts`
- AC4: `remotePatterns` covers `**.googleusercontent.com`
- AC5: No TanStack / CRUD / hydration changes; Red Team pass

**Artifacts:** `lib/ui/user-avatar-sources.ts`, `Navbar.tsx`, `safe-avatar-image.tsx`, `next.config.ts`

---

## REQ-0040 — Avatar URL DRY (reviews/tickets)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0039 |

**Intent:** DRY inline robohash strings in reviews/tickets; shared `resolveAvatarSourcesFromSeed`; manual Gmail avatar QA sign-off.

**Acceptance criteria**

- AC1: No inline `robohash.org` in components (only `lib/ui/user-avatar-sources.ts` + tests)
- AC2: Reviews + ticket replies use `resolveAvatarSourcesFromSeed`
- AC3: `resolveUserAvatarSources` delegates to seed helper (Navbar behavior unchanged)
- AC4: Unit tests cover seed resolver with userId + Google image
- AC5: Manual Gmail avatar QA PASS in VALIDATION_SUMMARY
- AC6: Red Team pass

**Artifacts:** `lib/ui/user-avatar-sources.ts`, `ProductReviewsSection.tsx`, `SupportTicketDetailContent.tsx`, `AdminSupportTicketDetailContent.tsx`

---

## REQ-0041 — Catalog filter icons, chips, export chevron

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0028 |

**Intent:** Entity icons + ActiveInactiveBadge in catalog status selects; borderless dismissible filter chips; shared export menu with rotating muted chevron.

**Acceptance criteria**

- AC1: Category/Supplier/Warehouse status select shows entity icon + glass badges in items
- AC2: Filter chip row borderless; ActiveInactiveBadge chip with X inside; Reset with RotateCcw
- AC3: Export Categories/Suppliers/Warehouses/Products use ExportMenuButton rotating chevron
- AC4: Shared components + catalog-filter-tokens; DeferredSelectGate preserved
- AC5: Product CategoryFilter/SupplierFilter use FolderTree/Truck icons
- AC6: No TanStack/CRUD changes; Red Team pass

**Artifacts:** `lib/ui/catalog-filter-tokens.ts`, `CatalogActiveInactiveSelect.tsx`, `ActiveInactiveFilterChips.tsx`, `ExportMenuButton.tsx`, `*Filters.tsx`, `CategoryFilter.tsx`, `SupplierFilter.tsx`

---

## REQ-0042 — Catalog select inline layout + orders/invoices export chevron

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0041 |

**Intent:** Fix REQ-0041 gaps: catalog status select icon+text inline (SelectTrigger line-clamp on span); wire ExportMenuButton to orders/invoices with muted rotating chevron.

**Acceptance criteria**

- AC1: Catalog status trigger shows icon + label inline (same row)
- AC2: Placeholder skeleton matches inline layout
- AC3: `ExportMenuButton` supports optional `disabled` prop
- AC4: OrderFilters + InvoiceFilters use `ExportMenuButton` (violet accent, rotating muted chevron)
- AC5: No TanStack/CRUD/hydration changes; Red Team pass

**Artifacts:** `CatalogActiveInactiveSelect.tsx`, `ExportMenuButton.tsx`, `OrderFilters.tsx`, `InvoiceFilters.tsx`

---

## REQ-0043 — Unified filter chip row + reset (all list filters)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0041 |

**Intent:** Extend REQ-0041 borderless chip row to products, orders, invoices, reviews, tickets, history, user-mgmt; shared `DismissibleFilterChips`; rose hover on X, sky hover on Reset.

**Acceptance criteria**

- AC1: Shared `DismissibleFilterChips` — borderless row, per-group dismiss, global Reset (RotateCcw)
- AC2: X hover rose; Reset hover sky (catalog + all surfaces)
- AC3: Products replace legacy `FilterArea` with semantic badges
- AC4–AC8: Orders, invoices, reviews, tickets, history, user-mgmt chip rows
- AC9: Reset clears dropdown filters + pageIndex 0 where applicable
- AC10: No TanStack/CRUD/SSR changes; Red Team pass

**Artifacts:** `filter-chip-styles.ts`, `DismissibleFilterChips.tsx`, `*Filters.tsx`, `ActiveInactiveFilterChips.tsx`

---

## REQ-0044 — Unified responsive typography scale

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0028 |

**Intent:** Centralize responsive typography: page headers `text-sm sm:text-lg`, card titles `text-sm sm:text-base`, subtitles `text-xs sm:text-sm`; stat values keep `text-sm sm:text-lg`.

**Acceptance criteria**

- AC1: `lib/ui/typography-scale.ts` exports PAGE/CARD/SUBTITLE/STAT tokens
- AC2: `PageSectionHeader`, `SectionCardHeader`, dialog titles use tokens
- AC3: Inline sweep ~45 files; fix invalid `text-md` classNames
- AC4: Stat/metric values unchanged; Navbar/AuthBrandHeader brand excluded
- AC5: No TanStack/SSR changes; Red Team pass

**Artifacts:** `typography-scale.ts`, `PageSectionHeader.tsx`, `SectionCardHeader.tsx`, `ui/dialog.tsx`, `StatisticsCard.tsx`, inline sweep

---

## REQ-0045 — Filter row UX + invoice status perf + page header spacing

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R2       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0043 |

**Intent:** Whole-row clickable multi-select filter rows (no cmdk+Checkbox double-toggle hang); invoice status filters client-side like orders; consistent `pb-6` page header / stats grid spacing; quieter invoice list API logs.

**Acceptance criteria**

- AC1: `FilterCommandCheckboxItem` — `CommandItem.onSelect` only; checkbox `pointer-events-none`
- AC2: All multi-select `*Filter*.tsx` + `filter-dropdown.tsx` use shared row component
- AC3: Invoice status client-side in `InvoiceTable`/`InvoiceFilters`; API filters search+scope only
- AC4: `PAGE_SECTION_HEADER_SPACING_CLASS` / `PAGE_STATS_GRID_CLASS` on list pages
- AC5: Home, My Activity, Email Preferences, Analytics headers use `PageSectionHeader` + icons
- AC6: No TanStack invalidation / SSR / mutation changes; Red Team pass

**Artifacts:** `filter-command-item.tsx`, `invoice-list-filters.ts`, `InvoiceList.tsx`, `InvoiceTable.tsx`, `*StatusFilter.tsx`, `shell-layout-styles.ts`, header pages

---

## REQ-0046 — Catalog filter / export button class parity

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0041 |

**Intent:** All Categories/Suppliers/Warehouses filter triggers match Export toolbar buttons: `px-4`, `gap-2`, `h-10`, `sm:w-auto`.

**Acceptance criteria**

- AC1: `CATALOG_TOOLBAR_TRIGGER_LAYOUT` in `catalog-filter-tokens.ts` shared by filter + export
- AC2: `CatalogActiveInactiveSelect` trigger + deferred placeholder use token classes
- AC3: No TanStack/SSR changes; lint pass
- AC4: `FOCUS_NO_LAYOUT_SHIFT_CLASS` — no border-width growth on focus (toolbar shift fix)
- AC5: Hue-matched `focus-visible:ring-2` visible in dark mode (`GLASS_FOCUS_RING` in `focus-ring-styles.ts`)
- AC6: Dialog/form glass fields use `dialog-form-field.ts` tokens (no inline `focus-visible:border-*`)

**Artifacts:** `catalog-filter-tokens.ts`, `CatalogActiveInactiveSelect.tsx`, `ExportMenuButton.tsx`, `focus-ring-styles.ts`, `filter-toolbar-styles.ts`, `dialog-form-field.ts`, `ui/input|select|textarea`

---

## REQ-0047 — Glass button tokens + page consistency

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0046 |

**Intent:** Centralize glass CTA/action button styles (shadow glow + hue focus ring + icon hover) in `glass-button-styles.ts`; migrate audit-gap pages and dialog submit/cancel pairs; Email Preferences UX polish (icons `h-4 w-4 mr-2`).

**Acceptance criteria**

- AC1: `lib/ui/glass-button-styles.ts` — `GLASS_PRIMARY_BUTTON`, `GLASS_ACTION_BUTTON`, `GLASS_GHOST_BUTTON`, `GLASS_BUTTON_ICON_HOVER`; builds on `focus-ring-styles.ts`
- AC2: Batch A migrated — PaymentDialog, ShippingManagement, ApiStatusPage, BusinessInsightPage, EmailPreferencesPage, SystemConfigSettings
- AC3: Batch B dialog submits migrated — Category/Supplier/Order/Invoice/CreateUser/SupportTicket/Login/Register
- AC4: CSS-only; no TanStack/SSR/invalidation delta

**Commit split:** REQ-0046 focus-ring work (separate commit); REQ-0047 glass buttons + Email Preferences polish.

**Artifacts:** `glass-button-styles.ts`, `components/shared/index.ts`, Batch A/B component migrations

---

## REQ-0048 — Auth light mode + dialog tables + order product thumbs

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0032 |

**Intent:** Fix light-mode auth readability (placeholders, Google button); category/supplier dialog embedded table text/zebra after x-scroll; order product Select with inline SafeImage thumbs.

**Acceptance criteria**

- AC1: `AUTH_FORM_FIELD_SKY` / `AUTH_FORM_FIELD_EMERALD` / `AUTH_GOOGLE_BUTTON` in `auth-glass-styles.ts`; Login/Register/LoginRoleSelect migrated (not `DIALOG_FORM_FIELD_*`)
- AC2: `DIALOG_TABLE_*` tokens in `dialog-edge-scroll.ts`; Category/Supplier dialogs + column `context: 'dialog'`
- AC3: `ProductOptionRow` + OrderDialog Package label + thumbs in trigger/dropdown
- AC4: CSS/UI only; lint + test 343 + invalidate 202 + build pass

**Artifacts:** `auth-glass-styles.ts`, `dialog-edge-scroll.ts`, `CategoryTableColumns.tsx`, `SupplierTableColumns.tsx`, `ProductOptionRow.tsx`, `OrderDialog.tsx`

---

## REQ-0049 — Dialog UX polish (tables, glass CTAs, submit gates)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0048 |

**Intent:** Fix light-mode dialog embedded table parity with list pages; glass CTA button visibility; slim dialog columns; submit disabled until valid; backlog ghost/primary migrations.

**Acceptance criteria**

- AC1: Dual-theme `DIALOG_TABLE_*` + `DIALOG_TABLE_LINK` / `DIALOG_TABLE_ACTION_ICON` — light list-page zebra; dark glass rows
- AC2: Actions header + kebab visible in dialog context (`context: 'dialog'` on columns + Actions)
- AC3: Dialog embedded tables omit `description` + `notes` columns
- AC4: `GLASS_BUTTON_SHELL_RESET` + `variant="ghost"` on glass Buttons; CTAs promoted to `GLASS_PRIMARY_BUTTON`; toolbar `ACTION` light opaque base
- AC5: Category/Supplier/Warehouse/ProductForm submit `disabled` until required fields valid (`GLASS_BUTTON_DISABLED`)
- AC6: ProductForm/ProductImport/ProductReview/Warehouse ghost+primary backlog migrations
- AC7: CSS/UI only; lint + test 343 + invalidate 202 + build pass

**Artifacts:** `dialog-edge-scroll.ts`, `glass-button-styles.ts`, `CategoryTableColumns.tsx`, `SupplierTableColumns.tsx`, `CategoryActions.tsx`, `SupplierActions.tsx`, Category/Supplier/Warehouse/ProductForm dialogs, Batch A glass pages, ProductImport/ProductReview dialogs

---

## REQ-0050 — Glass shell-reset + dialog table title polish

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0049 |

**Intent:** Complete REQ-0049 deferred polish — `GLASS_BUTTON_SHELL_RESET` on remaining Batch B primary buttons; review dialog submit tokens; dual-theme embedded table section titles; ESLint cleanup.

**Acceptance criteria**

- AC1: `ProductReviewDialog` + `WriteEditReviewDialog` submit → `GLASS_PRIMARY_BUTTON.amber` + shell reset + disabled token
- AC2: Batch B primary buttons (Order/Invoice/Payment/SupportTicket/Login/Register) → `variant="ghost"` + `GLASS_BUTTON_SHELL_RESET`
- AC3: `DIALOG_TABLE_SECTION_TITLE` token; Category/Supplier dialog table `<h3>` + count spans
- AC4: Export from `components/shared/index.ts`
- AC5: ESLint clean — no stale directive in `ProductFormDialog.tsx`
- AC6: CSS/UI only; lint + test 343 + invalidate 202 + build pass

**Artifacts:** `dialog-edge-scroll.ts`, `ProductReviewDialog.tsx`, `WriteEditReviewDialog.tsx`, Order/Invoice/Payment/SupportTicket dialogs, LoginPage, RegisterPage, CategoryDialog, SupplierDialog

**Post-ship note:** Hotfix `73060a1` reverted Login/Register + page primary CTAs from broken `bg-transparent` shell-reset; Register uses `AUTH_SUBMIT_BUTTON_EMERALD`.

---

## REQ-0051 — Glass consistency backlog (planned)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | backlog  |
| **Cycle**    | C2       |
| **Parent**   | REQ-0050 |

**Intent:** Finish inline glass gradient migrations for detail pages, FABs, ShippingManagement, WriteEditReview cancel; smoke Batch B dialog submits in light/dark.

**Scope (CSS/UI only):** `OrderDetailPage`, `InvoiceDetailPage`, `CategoryDetailPage`, `WarehouseDetailPage`, `FloatingActionButtons`, `ShippingManagement`, `WriteEditReviewDialog` cancel → shared tokens; no TanStack/SSR/API.

**Not in scope:** Auth Login/Register CTAs (user-verified at `73060a1`).

---

## REQ-0052 — CRUD post-mutation fast response (deferred cache + ImageKit)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P0    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Prevent Vercel `FUNCTION_INVOCATION_TIMEOUT` (504) on DELETE/CRUD by returning HTTP response immediately after DB commit; defer Redis SCAN invalidation and ImageKit cleanup via Next.js `after()`.

**Acceptance criteria**

- AC1: `lib/cache/post-mutation.ts` — `scheduleInvalidateAllServerCaches`, scoped schedules, `scheduleAfterResponse`
- AC2: All API write routes use non-blocking invalidation (no `await invalidateAllServerCaches` before response)
- AC3: Product hard-delete: DB first, ImageKit cleanup deferred
- AC4: `vercel.json` `maxDuration: 60` on `app/api/**/route.ts`
- AC5: Client TanStack `invalidateAllRelatedQueries` unchanged — UI updates immediately
- AC6: Red Team lint ✓ test ✓ invalidate ✓ build ✓

**Artifacts:** `lib/cache/post-mutation.ts`, `lib/cache/post-mutation.test.ts`, `vercel.json`, all `app/api/**/route.ts` write handlers

---

## REQ-0053 — Scoped warehouse + stock Redis invalidation

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0052 |

**Intent:** Replace full `scheduleInvalidateAllServerCaches` on warehouse/stock routes with targeted deferred patterns.

**Scope:** `scheduleInvalidateWarehouseCaches` (warehouses route); `scheduleInvalidateStockAllocationCaches` (stock-allocations POST). Client TanStack unchanged.

---

## REQ-0054 — Scoped invalidation sweep (all API write routes)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0052 |

**Intent:** Replace remaining `scheduleInvalidateAllServerCaches` on CRUD routes with domain-scoped deferred patterns (invoice, ticket, review, user, notification, auth, import, order graph).

**Scope:** `lib/cache/post-mutation.ts` pattern constants + 22 route updates. Zero API routes use full wipe on writes. Client TanStack unchanged.

---

## REQ-0055 — Fix Redis race condition + stale UI after mutation

| Field        | Value              |
| ------------ | ------------------ |
| **Priority** | P0                 |
| **Risk**     | R1                 |
| **Status**   | done               |
| **Cycle**    | C2                 |
| **Parent**   | REQ-0052, REQ-0054 |

**Intent:** REQ-0054's `after()` deferral created a race: TanStack refetch fires on `onSuccess` (immediately after 201/200) before Redis SCAN completes → stale cached data returned → UI appears unchanged until manual refresh. Fix: make all domain `scheduleInvalidate*Caches()` synchronous async functions (no `after()` wrapper); API routes `await` them before response. Only `scheduleAfterResponse` and `scheduleInvalidateAllServerCaches` retain `after()`.

**Acceptance criteria**

- AC1: All 32 write routes `await` their domain invalidation before `NextResponse.json()`
- AC2: Orders, tickets, reviews, invoices table updates immediately after CRUD (no page refresh needed)
- AC3: Back button from any detail page shows updated data
- AC4: Stripe checkout uses `window.location.replace()` so back button skips Stripe URL
- AC5: `OrderDetailPage` cancel no longer calls `router.refresh()` (mutation `onSuccess` handles it)
- AC6: lint ✓ test 352 ✓ invalidate 202 ✓ build ✓

**Artifacts:** `lib/cache/post-mutation.ts`, all `app/api/**/route.ts` (32 files), `hooks/queries/use-payments.ts`, `components/Pages/OrderDetailPage.tsx`, `lib/cache/post-mutation.test.ts`

---

## REQ-0056 — Demo DB reset script + DRY seed source

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Single canonical source for the 3 demo accounts (admin/client/supplier) shared by login-dropdown UI and DB seed scripts; one-command full wipe + reseed for local/demo resets. Dev tooling only — no runtime/API/UI surface change.

**Acceptance criteria**

- AC1: `lib/auth/demo-seed-users.ts` — `DEMO_SEED_USERS`, `DEMO_PASSWORD`, `DemoRoleKey`; single source of truth
- AC2: `lib/auth/test-accounts.ts` derives `testAccounts` from `DEMO_SEED_USERS` (no duplicated literals)
- AC3: `scripts/lib/delete-all-db-data.ts` — shared dependency-ordered wipe (`deleteAllDbData`), used by `delete-all-data.ts` and `reset-demo-db.ts`
- AC4: `scripts/reset-demo-db.ts` — wipe Mongo + optional Redis clear + reseed 3 demo users + link "Demo Supplier"; `npm run script:reset-demo-db`
- AC5: `create-demo-accounts.ts` / `delete-all-data.ts` / `verify-demo-accounts.ts` updated to reference shared source, docs point to `reset-demo-db`
- AC6: lint ✓ test 352 ✓ invalidate 202 ✓ build ✓ (scripts excluded from Next bundle; typecheck clean)

**Artifacts:** `lib/auth/demo-seed-users.ts`, `scripts/lib/delete-all-db-data.ts`, `scripts/reset-demo-db.ts`, `scripts/{create-demo-accounts,delete-all-data,verify-demo-accounts}.ts`, `lib/auth/test-accounts.ts`, `package.json`

---

## REQ-0057 — Back-button sweep + router.refresh() elimination

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Every detail page back button must invalidate TanStack caches before navigating so the list always shows fresh data. Eliminate redundant `router.refresh()` calls that bypass TanStack and cause unnecessary SSR round-trips.

**Acceptance criteria**

- AC1: `useBackWithRefresh` covers all entity types: `order | invoice | product | category | supplier | warehouse | support-ticket | product-review | user`
- AC2: All detail-page back buttons (top + bottom) use `handleBack` or `navigateTo` — no bare `<Link href>` for back navigation on pages with CRUD mutations
- AC3: `AdminOrderDetailContent` switched from `backHref` Link to `onBack={handleBack}` via `useBackWithRefresh("order")`
- AC4: `router.refresh()` removed from `ProductDetailPage`, `CategoryDetailPage`, `SupplierDetailPage` duplicate handlers + `ProductActions`, `CategoryActions`, `SupplierActions` copy handlers — mutation hooks already call `invalidateAllRelatedQueries`
- AC5: `InvoiceDetailPage` delete-success uses `navigateTo("/invoices")` (invalidates before push)
- AC6: `ProductActions`, `CategoryActions` — `useRouter` import + instance removed (unused after cleanup)
- AC7: lint ✓ test 352 ✓ invalidate 202 ✓

**Artifacts:** `hooks/use-back-with-refresh.ts`, `components/admin/AdminOrderDetailContent.tsx`, `components/Pages/{Product,Category,Supplier,Invoice}DetailPage.tsx`, `components/{products/ProductActions,category/CategoryActions,supplier/SupplierActions}.tsx`

---

## REQ-0058 — Copy-to-clipboard order/invoice numbers

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Inline copy icon next to every rendered order/invoice number (tables, detail headers, portal lists, catalog recent-order cards) — click copies, check icon ~1.5s, no toast. Safe inside `<Link>` cells.

**Acceptance criteria**

- AC1: `components/shared/CopyableText.tsx` — children + Copy/Check icon; `preventDefault`/`stopPropagation`; barrel export
- AC2: Order/Invoice table `orderNumber`/`invoiceNumber` cells wrapped
- AC3: Detail headers — `OrderDetailHeader` title, `InvoiceDetailPage` title + info card
- AC4: Portals/lists — `ClientPortalPage`, `SupplierPortalPage`, `AdminClientPortalContent`, `AdminSupplierPortalContent`, `AdminAnalyticsContent` recent rows
- AC5: Product/Category/Supplier detail Recent Orders cards + `AdminOrderDetailContent` View-invoice button
- AC6: lint ✓ test 352 ✓ invalidate 202 ✓ build ✓

**Artifacts:** `components/shared/CopyableText.tsx`, `components/shared/index.ts`, table columns + detail/portal components listed above

---

## REQ-0059 — Product thumbnails on detail line items

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Same product-thumbnail treatment as the products table (SafeImage + Package fallback) on order detail line items, warehouse allocation rows, and category/supplier detail product grids.

**Acceptance criteria**

- AC1: `ProductThumb` extracted from `ProductOptionRow` (shared 32/40px thumb w/ Package fallback)
- AC2: `prisma/order.ts` detail fetches (5 role variants) select `imageUrl`; `updateOrder` include too (stable after `setQueryData`)
- AC3: `transform-order-detail.ts` + PUT response map `imageUrl`/`categoryId`/`supplierId` onto items; `OrderItem.imageUrl?` typed
- AC4: `OrderItemsCard` line items render `ProductThumb` (admin + client variants)
- AC5: Stock allocation API + SSR (`warehouse-stock-data.ts`) select product `imageUrl`; `StockAllocation.product.imageUrl?` typed; `WarehouseDetailPage` rows show thumb
- AC6: Category/Supplier detail product grids — Package-icon fallback when `imageUrl` missing (rows stay aligned)

**Artifacts:** `components/products/ProductOptionRow.tsx`, `prisma/order.ts`, `lib/orders/transform-order-detail.ts`, `types/{order,stock-allocation}.ts`, `app/api/{orders/[id],stock-allocations}/route.ts`, `lib/server/warehouse-stock-data.ts`, `OrderItemsCard.tsx`, `WarehouseDetailPage.tsx`, `{Category,Supplier}DetailPage.tsx`

---

## REQ-0060 — Searchable order picker in InvoiceDialog

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Replace the plain Select in invoice create mode with a type-to-filter Command dropdown (ProductOwnerSelect pattern) — scales past ~20 orders; search across order #, placer, total, status.

**Acceptance criteria**

- AC1: `components/invoices/OrderPickerCommand.tsx` — Popover + Command + CommandInput; `z-[100]` above dialog; indigo theme
- AC2: Rows show order # + total + status (+ placer on admin combined page); all fields searchable
- AC3: `InvoiceDialog` create mode uses picker; existing `useOrders`/`useClientOrders` merge + `status !== "cancelled"` filter + `enabled: open` gating unchanged
- AC4: `initialOrderId` prop pre-selects order (used by REQ-0061); admin client-orders leg loads when pre-selecting

**Artifacts:** `components/invoices/OrderPickerCommand.tsx`, `components/invoices/InvoiceDialog.tsx`

---

## REQ-0061 — Situation-based invoice actions on orders

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Create/View/Edit/Delete invoice directly from order rows and order detail pages, gated by invoice existence and role (client/supplier = view only).

**Acceptance criteria**

- AC1: Order list rows carry `invoiceForOrder {id, invoiceNumber} | null` — `getInvoiceLinkMap` (batch, one query) in `lib/server/orders-data.ts`; wired into all 4 SSR transforms + `GET /api/orders` (shared Redis shape)
- AC2: `OrderActions` menu — no invoice + admin/owner → "Create Invoice" (opens `InvoiceDialog` w/ `initialOrderId`); has invoice → "View Invoice" (all roles), "Edit Invoice" (navigates to invoice detail) + "Delete Invoice" (AlertDialog + `useDeleteInvoice`) admin/owner only
- AC3: `OrderList` hosts controlled `InvoiceDialog` create mode (same pattern as edit dialog)
- AC4: `OrderDetailPage` action row — View Invoice (linked) or Create Invoice (absent, non-cancelled, admin/owner)
- AC5: `AdminOrderDetailContent` invoice card — Create Invoice button when no invoice
- AC6: Redis: `INVOICE_PATTERNS` already clears `orders:*` (verified); TanStack: `invalidateAfterOrderGraphChange` unchanged; existing 409 toast untouched

**Artifacts:** `lib/server/orders-data.ts`, `app/api/orders/route.ts`, `components/orders/{OrderActions,OrderTableColumns,OrderList}.tsx`, `components/Pages/OrderDetailPage.tsx`, `components/admin/AdminOrderDetailContent.tsx`

---

## REQ-0062 — Order actions in invoice table

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** From invoice rows: "View Order" for all roles; "Cancel Order" (AlertDialog + `useDeleteOrder`) for admin/owner. Add missing role gating to invoice Edit/Send/Delete (match order table pattern).

**Acceptance criteria**

- AC1: `InvoiceActions` — "View Order" link (`/admin/orders/*` when `detailHrefBase` is admin, else `/orders/*`)
- AC2: Admin/owner-only "Cancel Order" with confirm dialog; API already guards already-cancelled orders
- AC3: Edit/Send/Delete invoice disabled for client + supplier roles
- AC4: lint ✓ test 352 ✓ invalidate 202 ✓ build ✓

**Artifacts:** `components/invoices/InvoiceActions.tsx`

---

## REQ-0063 — Detail copy + invoice line items parity

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Close REQ-0058–0062 polish gaps: copyable order/tracking numbers in shipping UI; invoice detail shows linked order line items with ProductThumb; Related Order row shows order # + admin-aware href.

**Acceptance criteria**

- AC1: `mapOrderItemsFromRaw` shared helper — `lib/orders/map-order-items.ts`; used by `transformOrderDetail` + invoice enrichment
- AC2: `enrichInvoice` widens product select (`imageUrl`, `categoryId`, `supplierId`) — no extra DB query; `linkedOrderNumber` + `linkedOrderItems` on Invoice type/transform
- AC3: `ProductLineItemsList` shared component; `OrderItemsCard` delegates item rows
- AC4: `InvoiceDetailPage` — Order Items card + Related Order CopyableText + `/admin/orders` when `embedInAdmin`
- AC5: `ShippingManagement` + `OrderTrackingInfo` — CopyableText on order # and tracking #
- AC6: Tests — `map-order-items.test.ts`, `transform-invoice-detail.test.ts`; lint ✓ test 356 ✓ invalidate 202 ✓ build ✓

**Artifacts:** `lib/orders/map-order-items.ts`, `lib/server/invoice-detail-data.ts`, `lib/invoices/transform-invoice-detail.ts`, `types/invoice.ts`, `components/shared/ProductLineItemsList.tsx`, `components/Pages/InvoiceDetailPage.tsx`, `components/shipping/{ShippingManagement,OrderTrackingInfo}.tsx`

---

## REQ-0064 — Polish + tokens + types

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Small polish: copyable payment reference, OrderItem.createdAt as ISO string, TYPO_BODY tokens.

**Acceptance criteria**

- AC1: `PaymentDialog` — `CopyableText` on reference number
- AC2: `OrderItem.createdAt: string`; remove cast in `map-order-items.ts`
- AC3: `TYPO_BODY` / `TYPO_BODY_MUTED` in `typography-scale.ts`

---

## REQ-0051 — Glass button backlog (completion)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Finish deferred glass CTA sweep on detail pages, FABs, ShippingManagement, WriteEditReview cancel.

**Acceptance criteria**

- AC1: Detail CTAs on Order/Invoice/Category/Warehouse detail → `GLASS_*` tokens
- AC2: `FloatingActionButtons` → glass tokens
- AC3: `ShippingManagement` remaining gradients → `GLASS_PRIMARY_BUTTON`
- AC4: `WriteEditReviewDialog` cancel → `GLASS_GHOST_BUTTON`

---

## REQ-0065 — Admin detail page parity

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Bring admin support/review/user/order detail pages to catalog-detail pattern (headers, action rows, status cards).

**Acceptance criteria**

- AC1: `PageSectionHeader` + icons on support/review/user admin detail pages
- AC2: Bottom Back + Delete rows (glass); order detail bottom Back
- AC3: Pattern A card headers; status Selects in labeled glass cards
- AC4: `TYPO_BODY` tokens where missing

---

## REQ-0066 — Warehouse real-world integration

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Connect warehouses to allocations, transfers, product breakdown, list utilization, order sync.

**Acceptance criteria**

- AC1: `GET /api/stock-allocations?productId=`; `POST /api/stock-transfers` create+complete; warehouse DELETE cleans allocations
- AC2: Best-effort allocation decrement on order confirm/paid + Stripe webhook
- AC3: `useStockByProduct`, `useCreateStockTransfer`; Allocate/Transfer dialogs on warehouse detail
- AC4: Product detail warehouse stock card (SSR); warehouses list stock-share column
- AC5: Invalidation spec includes stock-transfers route
- AC6: Allocate/Transfer dialog shell parity (CategoryDialog glow/padding); full-width product picker w/ category/supplier/price/stock; `StockQuantityField` inline validation; `DialogSubmitButton` spinners; FAB gradient restore; warehouse detail SSR→TanStack sync (fixes stale stock after transfer nav); stock card total/available/meta; `stock-allocation-enrich.ts` shared API+SSR product context

---

## REQ-0067 — AI warehouse insights

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Enrich AI insights payload with per-warehouse summary; prompt mentions rebalancing/transfers.

**Acceptance criteria**

- AC1: `POST /api/ai/insights` appends warehouse summary via `getWarehouseStockSummary`
- AC2: System prompt mentions warehouse rebalancing and transfers

---

## REQ-0068 — Per-warehouse order picking

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Choose source warehouse per order line; reserve/fulfill/restore StockAllocation in sync with order lifecycle.

**Acceptance criteria**

- AC1: `OrderItem.warehouseId` + `warehouseName` snapshot; required on create when product has allocations
- AC2: `stock-allocation-order-sync.ts` — reserve pending, fulfill confirm, release cancel, restore confirmed cancel
- AC3: `OrderLineWarehouseSelect` in OrderDialog; `ProductLineItemsList` shows warehouse name
- AC4: Invoice-paid + Stripe webhook pass `warehouseId` to allocation fulfill
- AC5: Pre-test gaps — `clientMayWriteStock` wired; `WAREHOUSE_PATTERNS` includes `products:*`; delete hook `invalidateAfterStockChange`

---

## REQ-0069 — SSR cache sync + submit UX backlog closure

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** After CRUD + App Router navigation, fresh RSC props must win over stale TanStack cache (`withInitialData` + `refetchOnMount: false`). Complete deferred DialogSubmitButton sweep, enrich unit tests, remove confirmed orphan shell files.

**Acceptance criteria**

- AC1: `useSyncSsrQueryData` / `useSyncSsrQueryDataMany` exported from `lib/react-query`; wired on all detail pages + primary list pages (Home, Products, Orders, Invoices, Warehouses, Categories, Suppliers)
- AC2: `useBackWithRefresh` — `warehouse` and `product` entities call `invalidateAfterStockChange`
- AC3: `PaymentDialog`, `CreateUserDialog`, `dialog-footer-actions`, and detail CTAs (category/order/invoice/warehouse + admin detail) use `DialogSubmitButton`
- AC4: `lib/stock-allocation/stock-allocation-enrich.test.ts` passes
- AC5: Orphan `AdminPage.tsx` + `SidebarLayout.tsx` deleted; `invalidate-coverage` allowlist updated; doc refs note legacy removal

**Artifacts:** `hooks/use-sync-ssr-query-data.ts`, `hooks/use-back-with-refresh.ts`, detail/list pages, `components/dialogs/dialog-footer-actions.tsx`, `lib/stock-allocation/stock-allocation-enrich.test.ts`

---

## REQ-0070 — SSR sync completion + doc consistency

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |
| **Cycle**    | C2    |

**Intent:** Close remaining SSR→TanStack stale-cache gaps (client browse, portal pages, admin lists); harden batch sync hook; adopt `useSyncSsrQueryDataMany`; scrub legacy SidebarLayout doc refs.

**Acceptance criteria**

- AC1: `useSyncSsrQueryDataMany` fingerprint-only deps + JSDoc in `hooks/use-sync-ssr-query-data.ts`
- AC2: Client/portal SSR sync — `ClientProductList`, `ClientPortalPage`, `SupplierPortalPage`, `AdminClientPortalContent`, `AdminSupplierPortalContent`
- AC3: Admin/user list SSR sync — `ProductReviewList`, `SupportTicketList`, `SupportTicketsPageContent`, `UserManagementList`, `HistoryList`, `AdminMyActivityContent`, `AdminAnalyticsContent`, `ForecastingSection`
- AC4: Multi-key pages use `useSyncSsrQueryDataMany` — `ProductDetailPage`, `ProductReviewsSection`, support ticket detail components
- AC5: Historical REQ-0034/36/39 SidebarLayout artifact lines updated; Agile V + walkthrough write-through

**Artifacts:** `hooks/use-sync-ssr-query-data.ts`, client/portal/admin list components, `.agile-v/*`, `docs/PROJECT_WALKTHROUGH.md`

---

## REQ-0071 — Client/supplier portal & detail UX polish

| Field        | Value                           |
| ------------ | ------------------------------- |
| **Priority** | P1                              |
| **Risk**     | R2                              |
| **Status**   | done                            |
| **Cycle**    | C2                              |
| **Parent**   | REQ-0070; extends REQ-0058–0063 |

**Intent:** Portal headers, owner-picker clarity, richer detail cards, readable glass detail CTAs with icons, order line-item category/supplier, Quick Links removal, Stripe post-payment back-nav fix.

**Acceptance criteria**

- AC1: `PageSectionHeader` on client + supplier portal pages (icon beside title/welcome)
- AC2: View All Orders/Invoices (and supplier parity) with left icons + `GLASS_ACTION_BUTTON`
- AC3: Quick Links sections removed from client + supplier portals
- AC4: Browse section uses `PageSectionHeader` with icon in `ClientProductList`
- AC5: `storeOwners` counts in browse meta + helper text on Product Owner select
- AC6: Order/invoice line items show category + supplier via `enrichOrderItemsCatalogNames` + `ProductLineItemsList`
- AC7: `glassDetailFooterButtonClass` — detail footer CTAs omit `variant="ghost"`; icons on all detail actions
- AC8: `DetailInfoRow` + expanded order/invoice information cards (payment, dates, Stripe refs)
- AC9: Stripe return — `markStripeCheckoutReturn` + `window.location.replace` + `useBackWithRefresh` fallback path

**Artifacts:** portal pages, detail pages, `lib/ui/glass-button-styles.ts`, `lib/payments/stripe-return.ts`, `lib/orders/enrich-order-items-catalog.ts`, `hooks/use-back-with-refresh.ts`

---

## REQ-0072 — REQ-0071 completion sweep

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0071 |

**Intent:** Close REQ-0071 audit gaps — shared header back token, admin detail glass parity, catalog `DetailInfoRow` cards, dead-import cleanup, enrich-order-items test, walkthrough doc. CSS/docs/tests only.

**Acceptance criteria**

- AC1: `DETAIL_HEADER_BACK_ICON_CLASS` in `glass-button-styles.ts`; 8+ detail headers use token
- AC2: Admin detail glass sweep — `AdminOrderDetailContent` + 3 admin embeds + History parity; dead `GLASS_PRIMARY_BUTTON` removed
- AC3: Product/Category/Supplier/Warehouse info cards use `DetailInfoRow` inside existing `GlassCard` shells
- AC4: Order partial payment row links to invoice when `invoiceForOrder` present (no schema change)
- AC5: Dead `GLASS_BUTTON_*` imports removed from Order/Category detail pages
- AC6: `lib/orders/enrich-order-items-catalog.test.ts` with prisma mocks
- AC7: `docs/PROJECT_WALKTHROUGH.md` row; Red Team lint/test/invalidate/build pass

**Artifacts:** catalog detail pages, admin detail embeds, `lib/ui/glass-button-styles.ts`, `lib/orders/enrich-order-items-catalog.test.ts`, `docs/PROJECT_WALKTHROUGH.md`

---

## REQ-0073 — Portal, browse, FAB & order-detail UX fixes

| Field        | Value         |
| ------------ | ------------- |
| **Priority** | P1            |
| **Risk**     | R2            |
| **Status**   | done          |
| **Cycle**    | C2            |
| **Parent**   | REQ-0071/0072 |

**Intent:** Fix portal header gap, recent-card badge clip + dates, product-owner avatars, FAB click-toggle collapse, order line-item layout, dedicated paid timestamp, order detail icon parity.

**Acceptance criteria**

- AC1: Client/Supplier portal header double-gap removed (`flex flex-col` + `pb-0` on header)
- AC2: Recent Orders/Invoices use `CARD_LIST_*` + `ClientCompactDateTime`; badge overflow visible
- AC3: Single-row product owner UI with `SafeAvatarImage` (SSR `image` on browse meta)
- AC4: FAB expands on click, collapses on dialog close (no hover expansion)
- AC5: `ProductLineItemsList` two-row thumb layout + inline category/supplier/warehouse with role-based warehouse link
- AC6: Order `paidAt` from linked invoice; separate Paid row from Updated
- AC7: Icons on Notes, Parties, Order Summary, status cards; `DialogSubmitButton` icon on cancel/delete
- AC8: Red Team lint/test/invalidate/build pass

**Artifacts:** `ClientPortalPage`, `ProductLineItemsList`, `FloatingActionButtons`, `order-detail-data.ts`, order detail cards, `DialogSubmitButton`

---

## REQ-0074 — Portal, charts, FAB & detail parity sweep

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R2       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0073 |

**Intent:** Close REQ-0073 QA gaps — portal pb-6 rhythm, SectionCardHeader charts, chart point labels, owner row center + avatar rings, FAB hover+click, order dialog grid, invoice/order detail parity.

**Acceptance criteria**

- AC1: Client/Supplier/ClientProductList use `PAGE_STATS_GRID_CLASS` + section `pb-6`
- AC2: Portal chart/catalog use `SectionCardHeader`; chart point value labels on all Area/Bar/Line charts
- AC3: Product owner row centered; avatar ring on picker
- AC4: FAB hover+click expand; collapse on leave or dialog close
- AC5: OrderDialog 3-column grid; warehouse icon + h-11 parity
- AC6: Order payment status separate row; line items portal links + inline SKU
- AC7: `PartiesRolesCard`, `InvoiceSummaryCard`, party `image` SSR
- AC8: Red Team lint/test/invalidate/build pass

**Artifacts:** portal pages, `chart-point-label.tsx`, `PartiesRolesCard.tsx`, `InvoiceSummaryCard.tsx`, `OrderDialog.tsx`

---

## REQ-0075 — Supplier warehouse display + UI parity sweep

| Field        | Value              |
| ------------ | ------------------ |
| **Priority** | P1                 |
| **Risk**     | R2                 |
| **Status**   | done               |
| **Cycle**    | C2                 |
| **Parent**   | REQ-0066, REQ-0074 |

**Intent:** Fix supplier-role warehouse/stock display bugs on product detail and table actions; align static/admin detail page headers and cards with established `PageSectionHeader` / glass patterns.

**Acceptance criteria**

- AC1: Supplier product detail shows correct warehouse count and allocation rows when stock exists (matches admin view for same product)
- AC2: Supplier product table action menu — invoice/create/edit actions correctly gated by role + order/invoice state (no false disables)
- AC3: Remove/email, API status, documentation pages use `PageSectionHeader` + icon row parity with other settings pages
- AC4: Admin detail embeds (order, ticket, review, user, history) — consistent header icons, glass cards, spacing with catalog detail pages
- AC5: `AdminOrderDetailContent` splits Order status and Payment status into separate rows (parity with `OrderDetailPage`)
- AC6: Red Team lint/test/invalidate/build pass

**Artifacts:** `ProductDetailPage` (supplier branch), `product-stock-data.ts`, supplier product table actions, remove/email + API status + docs pages, admin detail embeds, `AdminOrderDetailContent.tsx`

---

## REQ-0076 — REQ-0075 gap closure

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0075 |

**Intent:** Close five post-REQ-0075 audit gaps — inner section headers, admin `DetailInfoRow` parity, supplier Pay gate, supplier invoice test, dead SSR prefetch.

**Acceptance criteria**

- AC1: `ApiStatusPage` + `ApiDocsPage` inner sections use `SectionCardHeader` (not ad-hoc `h3` blocks)
- AC2: `InvoiceDetailPage` hides `PaymentDialog` for supplier role (`!isSupplierRole`)
- AC3: `AdminProductReviewDetailContent`, `AdminSupportTicketDetailContent`, `AdminUserManagementDetailContent` — read-only rows via `DetailInfoRow` + `ClientDateTime`
- AC4: `lib/server/invoices-data.test.ts` covers `getInvoicesForSupplierId` (orders→invoices, empty, cache key)
- AC5: Supplier branch in `app/invoices/page.tsx` drops unused `prefetchListPageStats`
- AC6: Red Team lint/test/invalidate/build pass

**Artifacts:** `ApiStatusPage.tsx`, `ApiDocsPage.tsx`, admin detail embeds, `InvoiceDetailPage.tsx`, `invoices-data.test.ts`, `app/invoices/page.tsx`

---

## REQ-0077 — Chart labels, client portal, product detail UX polish

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P2       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0076 |

**Intent:** Close ten cross-cutting UI/UX gaps — chart label styling/clipping, client portal catalog headers with meta totals, shared `AvatarInlineLink` + `CopyableText` sweeps, product detail enrichment (warehouse/orders/reviews/sales stats), centered empty states, detail back-button contrast. CSS/UI + read-only SSR field additions only.

**Acceptance criteria**

- AC1: `chart-point-label.tsx` — `CHART_LABEL_TOP_MARGIN`, gray/white `text-xs font-normal` labels; `ChartCard` overflow-visible; all 4 chart consumers + test
- AC2: Client portal catalog — `ClientCatalogOverview.meta` totals via parallel `count()`; subsection headers + count badges
- AC3: Shared primitives — `AvatarInlineLink`, `CARD_EMPTY_MESSAGE_CLASS`, `glassDetailBackButtonClass`; exported from shared barrel
- AC4: `CopyableText` on detail pages (product/category/supplier/warehouse IDs, names, emails) + product table name/SKU columns
- AC5: `AvatarInlineLink` beside owner/supplier names — client portal tables, line items, catalog detail creator rows
- AC6: `ProductDetailPage` — sales stat icons, creator link/copy, client warehouse no-link, recent orders SSR+UI, reviews count badge
- AC7: Detail footer Back buttons → `glassDetailBackButtonClass` on all detail + admin embed pages (incl. `AdminHistoryDetailContent`)
- AC8: Red Team lint/test/invalidate/build pass
- AC9 (gap closure): Warehouse allocation rows — `warehouse.status` SSR/API + `ActiveInactiveBadge` on product detail
- AC10 (gap closure): `PartiesRolesCard` → `AvatarInlineLink`; client catalog Redis v2 + `cached.meta` guard; `product-detail-data.test.ts`

**Artifacts:** `chart-point-label.tsx`, `chart-card.tsx`, portal pages, `client-catalog-data.ts`, `AvatarInlineLink.tsx`, `card-empty-styles.ts`, `glass-button-styles.ts`, `ProductDetailPage.tsx`, `product-detail-data.ts`, detail pages, `ProductTableColumns.tsx`, `ProductLineItemsList.tsx`, `ProductReviewsSection.tsx`, `AdminHistoryDetailContent.tsx`, `PartiesRolesCard.tsx`, `stock-allocation-enrich.ts`, `app/api/portal/client/catalog/route.ts`

---

## REQ-0078 — Badge nesting hydration fix (client portal)

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0077 |

**Intent:** Fix `/client` hydration mismatch from invalid HTML — shadcn `Badge` (`<div>`) nested inside `<p>` / `<h3>` in catalog subsection titles and detail section headers.

**Acceptance criteria**

- AC1: Shared `SectionTitleRow` in `lib/ui/section-title-row.tsx` — title + trailing badges as siblings (valid HTML)
- AC2: `ClientPortalPage` `CatalogSubsectionTitle` refactored — no `<p>` wrapping Badge
- AC3: `ProductReviewsSection` + `ProductDetailPage` warehouse/recent-order headers refactored
- AC4: Red Team lint/test/invalidate/build pass; manual `/client` no hydration console errors

**Artifacts:** `section-title-row.tsx`, `ClientPortalPage.tsx`, `ProductReviewsSection.tsx`, `ProductDetailPage.tsx`, `components/shared/index.ts`

---

## REQ-0079 — Client-role UI polish + shared tokens

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0077 |

**Intent:** Client portal/browse/detail UX from QA screenshots — font-normal catalog links, glass counter badges, supplier avatars, owner dropdown email format, consistent section spacing, product detail recent-orders polish.

**Acceptance criteria**

- AC1: Client portal supplier/owner `AvatarInlineLink` → `font-normal` (match category/product links)
- AC2: `SectionCountBadge` + glass counter sweep (SectionTitleRow, StatisticsCard, catalog subsections)
- AC3: Product table supplier column + supplier filter dropdown → avatar beside name
- AC4: ProductOwnerSelect email → `{name}. {email}` muted (no brackets)
- AC5: Detail/static pages — `APP_SHELL_DETAIL_CLASS` gap-6 + `DETAIL_PAGE_HEADER_SPACING_CLASS` (no double header gap)
- AC6: ClientProductList browse header spacing aligned with portal rhythm
- AC7: ProductDetailPage warehouse count badges glass teal; recent orders ListIndexBadge + text-sm order# + inline owner/buyer
- AC8: `ListIndexBadge` numbered circle (gray-600/white light, inverted dark)
- AC9: Red Team lint/test/invalidate/build pass

**Artifacts:** `SectionCountBadge.tsx`, `ListIndexBadge.tsx`, `section-title-row.tsx`, `shell-layout-styles.ts`, `ClientPortalPage.tsx`, `ClientProductList.tsx`, `ProductTableColumns.tsx`, `ProductOwnerSelect.tsx`, `SupplierFilter.tsx`, `StatisticsCard.tsx`, detail pages + ApiDocs/ApiStatus

---

## REQ-0080 — Stat badge revert + REQ-0079 gap closure

| Field        | Value    |
| ------------ | -------- |
| **Priority** | P1       |
| **Risk**     | R1       |
| **Status**   | done     |
| **Cycle**    | C2       |
| **Parent**   | REQ-0079 |

**Intent:** Close REQ-0079 gaps from QA — stat card sub-badges stay neutral gray; section-title counters use slate `SectionCountBadge` only; remove redundant list-header `pb-6`; revert incidental padding/format diffs outside REQ-0079 scope.

**Acceptance criteria**

- AC1: `StatisticsCard` sub-badges revert to neutral gray `Badge` (not `SectionCountBadge`)
- AC2: All section-title numeric counters use default slate `SectionCountBadge` (no `countHue` overrides)
- AC3: Remove duplicate `className="pb-6"` from 10 list `PageSectionHeader` call sites
- AC4: Restore `p-2 sm:p-4` on shared GlassCard surfaces changed incidentally in REQ-0079; revert `BusinessInsightPage` prettier-only diff
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `StatisticsCard.tsx`, `SectionCountBadge.tsx`, `section-title-row.tsx`, `ClientPortalPage.tsx`, `ProductDetailPage.tsx`, `ProductReviewsSection.tsx`, 10 `*List.tsx`, `order-detail-primitives.tsx`, `OrderTrackingInfo.tsx`, `analytics-card.tsx`, `CategoryDetailPage.tsx`, `AdminClientPortalContent.tsx`, `AdminSupplierPortalContent.tsx`, `BusinessInsightPage.tsx`

---

## REQ-0081 — Client owner picker + Category detail parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0077 |

**Intent:** Client browse owner dropdown stacked name/email; CategoryDetailPage parity with ProductDetailPage — DetailInfoRow stats, enriched product/order rows, insights charts, admin forecast rollup, glass footer CTAs.

**Acceptance criteria**

- AC1: `ProductOwnerSelect` — avatar left, name `text-sm`, email `text-xs` muted below; trigger `h-auto min-h-10`
- AC2: Category description/notes → `DetailInfoRow` with icons; statistics → `DetailInfoRow` + loading pulse
- AC3: SSR enrich category products (owner, supplier, reserved) + recent orders (placedBy, productImageUrl)
- AC4: Products card always visible — `SectionTitleRow`, `ProductThumb`, SKU copy, owner/supplier links, `embedInAdmin` hrefs
- AC5: Recent orders — `ListIndexBadge`, ProductDetail row pattern, buyer admin-only link
- AC6: Category insights KPIs + sales/stock charts + admin forecast mini-table
- AC7: Footer Back/Edit/Duplicate glass buttons match ProductDetailPage
- AC8: Red Team lint/test/invalidate/build pass; `category-detail-data.test.ts`

**Artifacts:** `ProductOwnerSelect.tsx`, `ProductFilters.tsx`, `CategoryDetailPage.tsx`, `category-detail-data.ts`, `types/category.ts`, `category-detail-data.test.ts`

---

## REQ-0082 — Category detail gap closure + forecast perf

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0081 |

**Intent:** Close REQ-0081 polish gaps — CopyableText h1, info card header parity, ChartBarLabel on sales chart; non-blocking admin forecast via cache-read SSR + TanStack fallback.

**Acceptance criteria**

- AC1: Category h1 uses `CopyableText`; Information card uses `h-9 w-9` icon header + subtitle
- AC2: Sales trend bar chart uses `createChartBarLabelRenderer(formatChartCurrencyLabel)`
- AC3: `buildCategoryForecastRollup` extracted to `lib/forecasting/category-forecast-rollup.ts` (client-safe)
- AC4: `getCachedForecastingSummary` — Redis read only; removed from blocking category SSR
- AC5: Admin embed prefetches cache-read forecast; `useForecastingSummary` fills cold cache client-side
- AC6: Red Team lint/test/invalidate/build pass

**Artifacts:** `CategoryDetailPage.tsx`, `category-forecast-rollup.ts`, `forecasting-data.ts`, `category-detail-data.ts`, `use-forecasting.ts`, `app/admin/categories/[id]/page.tsx`

---

## REQ-0083 — Category forecast loading shell parity

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0082 |

**Intent:** Close REQ-0082 audit leftovers — shell-first urgent reorder table while forecast loads; fix rollup comment; admin cache-read forecast SSR on `/categories/[id]`.

**Acceptance criteria**

- AC1: Urgent reorder forecast card shows headers + `TableBodyPulseRows` while `forecastLoading`; hides when loaded with zero urgent rows
- AC2: `category-forecast-rollup.ts` header comment reflects client-only usage (no server embed)
- AC3: `app/categories/[id]/page.tsx` parallel `getCachedForecastingSummary` for admin (cache-read only)
- AC4: Red Team lint/test/invalidate/build pass

**Artifacts:** `CategoryDetailPage.tsx`, `category-forecast-rollup.ts`, `app/categories/[id]/page.tsx`

---

## REQ-0084 — Detail insights parity + forecast SSR sync

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0083 |

**Intent:** Shared catalog insights + charts on product/supplier/warehouse detail; forecast `useSyncSsrQueryData` on all forecast detail pages; admin cache-read SSR prefetch on 6 routes.

**Acceptance criteria**

- AC1: `computeCatalogInsights` / `computeProductInsights` / `computeWarehouseInsights` extracted; category SSR refactored
- AC2: `CatalogInsightsSection` + `WarehouseInsightsSection` shared UI; CategoryDetailPage refactored
- AC3: Product/Supplier detail insights + charts + admin forecast (rollup or single-product)
- AC4: Warehouse insights (stock pie + category mix) + admin forecast; admin stock scope fix
- AC5: `useSyncSsrQueryData(queryKeys.forecasting.summary())` on Category/Product/Supplier/Warehouse detail
- AC6: Red Team lint/test 397/invalidate 206/build pass

**Artifacts:** `catalog-insights.ts`, `CatalogInsightsSection.tsx`, `ProductDetailPage.tsx`, `SupplierDetailPage.tsx`, `WarehouseDetailPage.tsx`, 6 detail routes

---

## REQ-0085 — Supplier header + insights lib hygiene + product warehouse pie SSR

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0084 |

**Intent:** Close REQ-0084 audit backlog — Supplier h1 CopyableText; move pure warehouse insights compute to client-safe `lib/insights/`; SSR-enrich product warehouse pie via shared helper (client keeps live merge after stock CRUD).

**Acceptance criteria**

- AC1: Supplier detail h1 uses `CopyableText` + loading pulse (matches Product/Category)
- AC2: `computeWarehouseInsights` lives under `lib/insights/`; no client imports from `lib/server/` for insights compute
- AC3: Product detail SSR passes warehouse-enriched `productInsights`; client uses same `enrichProductInsightsWithWarehouseStock` helper
- AC4: `CATALOG_LOW_STOCK_THRESHOLD` single source in `lib/insights/constants.ts`
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/insights/*`, `SupplierDetailPage.tsx`, `ProductDetailPage.tsx`, `WarehouseDetailPage.tsx`, `app/products/[id]/page.tsx`, `app/admin/products/[id]/page.tsx`

---

## REQ-0086 — Category/Supplier detail list UI parity

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0085 |

**Intent:** Unify category/supplier detail product + recent-order list UI; responsive SKU/stock/price row; supplier info/stats parity; SSR party enrichment on supplier lists.

**Acceptance criteria**

- AC1: Category products + recent orders show `SKU:` label; sku/stock/price on one responsive row
- AC2: Shared `CatalogDetailProductGrid` + `CatalogDetailRecentOrdersList` used by both detail pages
- AC3: Supplier info subtitle + `DetailInfoRow` description/notes; statistics use icon `DetailInfoRow` rows
- AC4: Supplier products/orders always visible with count badge + empty states (category parity)
- AC5: Supplier SSR includes owner/supplier on products; owner/buyer/image on recent orders
- AC6: Red Team lint/test/invalidate/build pass

**Artifacts:** `types/catalog-detail-lists.ts`, `catalog-detail/*`, `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx`, `supplier-detail-data.ts`

---

## REQ-0087 — Catalog detail list loading DRY

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0086 |

**Intent:** Remove duplicate `DataSlotPulse` wrappers in category/supplier detail pages; pass `loading={dataLoading}` to shared catalog list components.

**Acceptance criteria**

- AC1: No duplicate pulse wrappers for product/order lists in Category or Supplier detail pages
- AC2: Both pages pass `loading={dataLoading}` to `CatalogDetailProductGrid` + `CatalogDetailRecentOrdersList`
- AC3: Visual loading behavior unchanged
- AC4: Red Team lint/test/invalidate/build pass

**Artifacts:** `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx`

---

## REQ-0088 — Full demo DB seed (connected catalog)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |

**Intent:** Single canonical seed creates demo users, Demo Supplier entity (description/notes), and connected catalog (categories, warehouses, product, allocations, order/invoice) on `npm run script:reset-demo-db`.

**Acceptance criteria**

- AC1: `lib/auth/demo-seed-data.ts` — users with `emailPreferences`; supplier entity constants; catalog fixtures
- AC2: `scripts/lib/seed-demo-catalog.ts` wired from `reset-demo-db.ts`
- AC3: `create-demo-accounts.ts` DRY from shared constants; `update-demo-supplier-description.ts` removed
- AC4: `verify-demo-accounts.ts` reports supplier description + catalog counts
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/auth/demo-seed-data.ts`, `scripts/lib/seed-demo-catalog.ts`, `scripts/reset-demo-db.ts`

---

## REQ-0089 — Catalog audit user links (role-aware)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |

**Intent:** Supplier/category info-card Created by/Updated by must not link to `ownerProductsHref`; admin links to user management; client/supplier plain text; updater email CopyableText.

**Acceptance criteria**

- AC1: `lib/navigation/audit-user-href.ts` — admin-only `/admin/user-management/{id}`
- AC2: `SupplierDetailPage` + `CategoryDetailPage` audit rows fixed; product Updated by parity
- AC3: Product Created by keeps `ownerProductsHref` (product owner browse)
- AC4: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/navigation/audit-user-href.ts`, `SupplierDetailPage.tsx`, `CategoryDetailPage.tsx`, `ProductDetailPage.tsx`

---

## REQ-0090 — Product warehouse pie unallocated clarity

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |

**Intent:** Product insights pie shows warehouse allocated + unallocated slices; title/subtitle match catalog quantity vs allocation sum.

**Acceptance criteria**

- AC1: `warehouseStock.unallocated` on insights when catalog qty > allocated sum
- AC2: Pie includes Unallocated slice; `WAREHOUSE_STOCK_PIE_COLORS` third color
- AC3: Product detail chart title "Warehouse allocated stock" + dynamic description/badges
- AC4: Tests for enrich + chart data helpers
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `types/catalog-insights.ts`, `lib/insights/*`, `lib/ui/catalog-insights-chart-data.ts`, `ProductDetailPage.tsx`, `CatalogInsightsSection.tsx`

---

## REQ-0091 — Demo supplier naming + seed hardening

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0088 |

**Intent:** Align global supplier entity display name with Test Admin/Client/Supplier; harden legacy seed scripts; add warehouse aggregate unit test.

**Acceptance criteria**

- AC1: `DEMO_SUPPLIER_ENTITY.name` → `"Test Supplier"`; description/notes updated
- AC2: `verify-demo-accounts.ts` resolves supplier by `test@supplier.com` userId (not name)
- AC3: `create-demo-accounts.ts` backfills legacy `"Demo Supplier"` name; seeds catalog when product count is 0
- AC4: `lib/insights/warehouse-stock-aggregate.test.ts` covers unallocated math
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/auth/demo-seed-data.ts`, `scripts/create-demo-accounts.ts`, `scripts/verify-demo-accounts.ts`, `lib/insights/warehouse-stock-aggregate.test.ts`

---

## REQ-0092 — Accounts-only demo seed

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0088 |

**Intent:** Trim default demo reset to accounts infrastructure only: 3 users with full profile + global Test Supplier entity. No catalog, orders, or invoices — manual QA per real UI workflow.

**Acceptance criteria**

- AC1: `reset-demo-db.ts` calls `seedDemoAccountsOnly` only (no default `seedDemoCatalog`)
- AC2: `demo-seed-users.ts` includes stable robohash `image` per user
- AC3: `scripts/lib/seed-demo-accounts.ts` shared DRY seeder for reset + create-demo-accounts
- AC4: `create-demo-accounts.ts` no catalog seed; profile + supplier backfill retained
- AC5: `verify-demo-accounts.ts` reports profile completeness; catalog counts informational (0 expected)
- AC6: `DEMO_CATALOG_SEED` retained opt-in only (not deleted)
- AC7: Red Team lint/test/invalidate/build + reset-demo-db + verify pass

**Artifacts:** `lib/auth/demo-seed-users.ts`, `lib/auth/demo-seed-data.ts`, `scripts/lib/seed-demo-accounts.ts`, `scripts/reset-demo-db.ts`, `scripts/create-demo-accounts.ts`, `scripts/verify-demo-accounts.ts`

---

## REQ-0093 — Role-scoped silent warm + filter leak fixes

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0025, REQ-0027 |

**Intent:** Complete warm-prefetch polish: client filter-hook leak, logout warm reset, DRY role nav paths, batched TanStack warm + staggered RSC prefetch, ApiStatus Strict Mode dedupe, remove debug instrumentation.

**Acceptance criteria**

- AC1: `getNavItemsForRole` / `getNavPathsForRole` in `lib/navigation/role-nav-config.ts`; Navbar imports shared config
- AC2: `useCategories` / `useSuppliers` accept `enabled`; filter dropdowns skip fetch when override present (client browse)
- AC3: `RouteWarmPrefetch` resets warm refs on logout; warm key `${userId}:${role}`; phase-2 `router.prefetch` for nav paths
- AC4: `warm-route-prefetch.ts` batched prefetch (4 concurrent); client skips admin catalog lists
- AC5: `ApiStatusPage` cancel guard on mount; debug ingest removed
- AC6: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/navigation/role-nav-config.ts`, `warm-route-prefetch.ts`, `RouteWarmPrefetch.tsx`, `CategoryFilter.tsx`, `SupplierFilter.tsx`, `use-categories.ts`, `use-suppliers.ts`, `ApiStatusPage.tsx`, `Navbar.tsx`

---

## REQ-0094 — Nav perf + instant feel (role-scoped)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0093, REQ-0075 |

**Intent:** Production perf audit; instant navbar nav feel; eliminate remaining duplicate API calls; shell-first hygiene.

**Acceptance criteria**

- AC1: Login → dashboard first paint — prod build verified; warm idle-deferred (non-blocking)
- AC2: Navbar brand + nav + profile → `<Link prefetch>` (all roles); extended RSC warm paths
- AC3: Client browse — CategoryFilter/SupplierFilter `enabled: false` when override present (REQ-0093, re-verified)
- AC4: REQ-0075 smoke — PASS (code review; no regressions found)
- AC5: Prod deploy + Sentry 24h + Gate 2 evidence — PENDING human (REQ-0009)

**Artifacts:** `Navbar.tsx`, `nav-link-styles.ts`, `admin-nav-config.ts`, `role-nav-config.ts`, `RouteWarmPrefetch.tsx`, `AdminSidebar.tsx`, `*TableColumns` prefetch, shell `page.tsx` hygiene, `ApiDocsPage.tsx`, `role-nav-config.test.ts`

---

## REQ-0095 — Portal spacing, headers, email prefs, audit rows, card padding

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0079, REQ-0047 |

**Intent:** CSS/UI polish — portal header spacing, support-tickets header parity, email-preferences glass cards, merged audit-user rows on catalog detail pages, section icons, single-layer card padding. No TanStack/SSR/API changes.

**Acceptance criteria**

- AC1: `ClientPortalPage` + `SupplierPortalPage` — remove `pb-0` on `PageSectionHeader`; default `pb-6` below header
- AC2: `SupportTicketsPageContent` — `PageSectionHeader` with icon + trailing Create Ticket (admin list parity)
- AC3: `EmailPreferencesPage` — `GlassCard` + `SectionCardHeader`; single padding layer; email `font-medium`
- AC4: `AuditUserDetailRow` — merged name + email row on Product/Category/Supplier detail pages
- AC5: `SectionTitleRow` icons on catalog list cards (Products in Category, Products from Supplier, Recent Orders)
- AC6: `CategoryDetailPage` GlassCard shell — no article padding; insights sections drop inner `p-2 sm:p-4`; `WarehouseDetailPage` aligned
- AC7: Red Team lint/test/invalidate/build pass

**Artifacts:** `ClientPortalPage.tsx`, `SupplierPortalPage.tsx`, `SupportTicketsPageContent.tsx`, `EmailPreferencesPage.tsx`, `AuditUserDetailRow.tsx`, `ProductDetailPage.tsx`, `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx`, `CatalogInsightsSection.tsx`, `WarehouseInsightsSection.tsx`, `WarehouseDetailPage.tsx`

---

## REQ-0096 — Audit rows, shared GlassCard, section icon parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0095 |

**Intent:** Close REQ-0095 gaps — shared `lib/ui/glass-card.tsx`, creator/updater `AuditUserDetailRow` on order/invoice/warehouse detail (SSR enrich), Product detail section icon parity.

**Acceptance criteria**

- AC1: `lib/ui/glass-card.tsx` — `GlassCard` + `GlassCardBody`; migrate 11 local copies; order-detail `padding="body"` default
- AC2: Order/invoice/warehouse detail SSR — `creator` / `updater` user snapshots; `AuditUserDetailRow` in info cards
- AC3: `ProductDetailPage` — Recent Orders + Warehouse Stock use `SectionTitleRow` icon only
- AC4: `warehouse-detail-data.test.ts` + transform test extension
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `lib/ui/glass-card.tsx`, detail pages, `order-detail-data.ts`, `invoice-detail-data.ts`, `warehouse-detail-data.ts`, types, transforms

---

## REQ-0097 — REQ-0096 gap closure + Email Preferences layout

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0096 |

**Intent:** Close REQ-0096 audit gaps — `AdminOrderDetailContent` audit rows, `GlassCardBody` DRY on shell cards, insights shared `GlassCard` import, Email Preferences header spacing + inline help tooltip.

**Acceptance criteria**

- AC1: `SectionCardHeader.titleTrailing` + Email prefs `PageSectionHeader` `pb-0` + `GlassCardBody`
- AC2: `AdminOrderDetailContent` — `AuditUserDetailRow` creator/updater (SSR already enriched)
- AC3: Catalog detail pages — `<GlassCardBody>` replaces raw `div.p-2 sm:p-4` inside shell `GlassCard`
- AC4: `CatalogInsightsSection` / `WarehouseInsightsSection` — `GlassCard` from shared with `padding="body"`
- AC5: Red Team lint/test/invalidate/build pass

**Artifacts:** `SectionCardHeader.tsx`, `EmailPreferencesPage.tsx`, `AdminOrderDetailContent.tsx`, catalog detail pages, insights sections

---

## REQ-0098 — Admin portal UI parity + glow badge sweep

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0097 |

**Intent:** Close 10-item admin/portal UI parity batch — GlassCardBody on Api pages, QR truncation, semantic glow badges, portal spacing/avatars, dashboard recent-card CTAs, Business Insights header/AI polish, Activity Logs icon, notification dropdown UX.

**Acceptance criteria**

- AC1: ApiStatus + ApiDocs — `GlassCardBody` replaces raw `div.p-2 sm:p-4`
- AC2: Product QR column — truncated trigger text in table
- AC3: Business Insights — `PageSectionHeader` icon; glow badges (reorder, low stock, health); AI button icons + spinner
- AC4: Admin order/invoice tables — `AdminOrderSourceBadge` (Self/Client glow)
- AC5: Admin dashboard overall insights — bottom View All CTAs + centered empty states
- AC6: Admin dashboard — `gap-6` rhythm + AI glass button
- AC7: Admin supplier portal — spacing, inline count badge, supplier avatars in table
- AC8: Admin client portal — spacing, inline count badge, client avatars in table
- AC9: Activity History — meaningful icon beside Activity Logs header
- AC10: Notification dropdown — total counter, inline New glow badge, full-width Close
- AC11: Red Team lint/test/invalidate/build pass

**Artifacts:** `semantic-badges.tsx`, `ApiStatusPage.tsx`, `ApiDocsPage.tsx`, `qr-code-hover.tsx`, `BusinessInsightPage.tsx`, `forecasting-card.tsx`, `OrderTableColumns.tsx`, `InvoiceTableColumns.tsx`, `AdminAnalyticsContent.tsx`, `AdminClientPortalContent.tsx`, `AdminSupplierPortalContent.tsx`, `client-portal-data.ts`, `supplier-portal-data.ts`, `ActivityLogSection.tsx`, `NotificationDropdown.tsx`

---

## REQ-0099 — Post-REQ-0098 gap closure

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0098 |

**Intent:** Close REQ-0098 audit gaps — AdminAnalytics section `gap-6` rhythm, supplier portal avatar `userId` seed, remove orphaned one-off stock scripts + broken npm entries.

**Acceptance criteria**

- AC1: `AdminAnalyticsContent` — Order/Invoice/Warehouse sections use `flex flex-col gap-6` (not `space-y-4`)
- AC2: `SupplierPortalSupplier.userId` SSR + `AvatarInlineLink seed={userId}`
- AC3: Remove `script:fix-product2-stock`, `script:backfill-order-stock`, `script:check-order-stock` from `package.json`; delete script files
- AC4: Red Team lint/test/invalidate/build pass

**Artifacts:** `AdminAnalyticsContent.tsx`, `supplier-portal.ts`, `supplier-portal-data.ts`, `AdminSupplierPortalContent.tsx`, `package.json`

---

## REQ-0100 — Supplier portal avatar seed fallback

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0099 |

**Intent:** UI fallback when stale Redis cache omits `userId` on supplier portal rows — robohash seed uses linked user id when present, else supplier entity id.

**Acceptance criteria**

- AC1: `AdminSupplierPortalContent` — `AvatarInlineLink seed={s.userId ?? s.id}` with inline comment
- AC2: No cache-key bump; no TanStack/invalidation changes
- AC3: Red Team lint/test/invalidate/build pass

**Artifacts:** `AdminSupplierPortalContent.tsx`

---

## REQ-0102 — Stock allocation sync policy

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0066 |

**Intent:** Catalog quantity is source of truth; warehouse allocations are distribution slices. Reconcile catalog decreases (reserved floor + greedy unreserved shrink), guard allocation upserts and warehouse delete, soft-delete products keep warehouse rows read-only.

**Acceptance criteria**

- AC1: Catalog increase — no allocation writes; unallocated derived in enrich/API
- AC2: Catalog decrease — reserved floor 409; auto-shrink unreserved only; ProductFormDialog confirm when shrink > 0
- AC3: Allocation POST/PUT — `validateAllocationUpsert` budget + reserved floor; DELETE row 409 when reserved (existing)
- AC4: Warehouse DELETE — 409 when reserved allocations, active order picks, or pending transfers
- AC5: Product soft delete — allocations retained; warehouse rows show Archived, read-only actions
- AC6: Order reservation paths unchanged; disjoint `product.reservedQuantity` vs `allocation.reservedQuantity` documented
- AC7: No product-form warehouse dropdown; unallocated never persisted

**Artifacts:** `lib/stock-allocation/catalog-quantity-reconcile.ts`, `validate-allocation-quantity.ts`, `apply-catalog-quantity-reconcile.ts`, `lib/warehouses/warehouse-delete-guards.ts`, `app/api/products/route.ts`, `app/api/stock-allocations/*`, `app/api/warehouses/route.ts`, `ProductFormDialog.tsx`, `WarehouseStockAllocationRow.tsx`

## REQ-0103 — Disjoint order reservation (REQ-0102 AC6 gap)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0102 |

**Intent:** Warehouse-pick pending orders must reserve on `StockAllocation.reservedQuantity` only; no-pick orders on `Product.reservedQuantity` only. Fixes double-count catalog floor (40 vs 20).

**Acceptance criteria**

- AC1: `order-stock-reservation.ts` — disjoint reserve/release/fulfill; wired in `prisma/order.ts` create + status + cancel
- AC2: Stripe webhook + invoice paid use `fulfillPendingOrderLines`
- AC3: Create availability uses `getAvailableCatalogForOrder` when warehouse pick required
- AC4: List APIs expose `committedQuantity`; UI badges use `getDisplayCommittedQuantity`
- AC5: Unit tests + gates (lint, test 460, invalidate 208, build)

**Artifacts:** `lib/products/order-stock-reservation.ts`, `enrich-product-committed-quantity.ts`, `prisma/order.ts`, `app/api/payments/webhook/route.ts`, `app/api/invoices/[id]/route.ts`, product list/browse/home enrich, `ProductTableColumns.tsx`, `ProductDetailPage.tsx`

---

## REQ-0104 — committedQuantity display parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0103 |

**Intent:** Extend `committedQuantity` to category/supplier detail SSR, forecasting card/API, and supplier dashboard so warehouse-pick reserved units display consistently everywhere.

**Acceptance criteria**

- AC1: `category-detail-data.ts` + `supplier-detail-data.ts` enrich products; Redis cache guard requires `committedQuantity`
- AC2: `forecasting-card.tsx`, `demand-forecast.ts`, `supplier-dashboard.ts` use effective committed qty for available math
- AC3: Unit test + gates (lint, test 461, invalidate 208, build)

**Artifacts:** `lib/server/category-detail-data.ts`, `supplier-detail-data.ts`, `components/ui/forecasting-card.tsx`, `lib/forecasting/demand-forecast.ts`, `lib/server/supplier-dashboard.ts`

---

## REQ-0020 — Locale-aware admin format (hydration-safe)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

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

| Field        | Value |
| ------------ | ----- |
| **Priority** | P2    |
| **Risk**     | R1    |
| **Status**   | done  |

**Intent:** Expired/missing `oauth_state` cookie on Google callback is expected UX (back-button, interrupted flow), not a server failure.

**Acceptance criteria**

- AC1: `logger.warn` (not `error`) on state mismatch in `app/api/auth/oauth/google/callback/route.ts`
- AC2: Redirect to `/login?error=invalid_state` unchanged

---

## REQ-0017 — Radix portal removeChild (Safari + Chrome)

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

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

| Field        | Value |
| ------------ | ----- |
| **Priority** | P1    |
| **Risk**     | R2    |
| **Status**   | done  |

**Acceptance criteria**

- AC1: `logger.warn` on all `safeParse` validation failures (orders, users, tickets, reviews, stock-allocations, email-preferences)
- AC2: New schemas: payment, shipping, notification, system-config, ai; product QR + auth body aliases
- AC3: `safeParse` on checkout, shipping (rates/labels/tracking), notifications (email + in-app), system-config, ai/insights, products/qr-code, auth login/register
- AC4: Unit tests in `lib/validations/*-api.test.ts` (284 total)
- AC5: Webhooks/multipart routes unchanged (Stripe, Shippo, QStash, product image)

**Artifacts:** `lib/validations/{payment,shipping,notification,system-config,ai}.ts`, matching `app/api/*` routes
