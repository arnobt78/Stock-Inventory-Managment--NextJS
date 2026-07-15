# CLAUDE.md — Agent quick reference (stock-inventory)

## Stack

- **Next.js 16** App Router, **React 19**, **TypeScript**, **Prisma** + **MongoDB**
- **TanStack Query** (server state), **JWT** auth, **shadcn/ui** + Tailwind
- Optional: Stripe, Shippo, Brevo, ImageKit, Upstash Redis/QStash, Sentry, OpenRouter + Groq (AI fallback)
- **No Python** in this repo

## Commands

```bash
npm run dev          # local (Turbopack)
npm run build        # prisma generate + next build
npm run lint         # eslint
npm run test         # vitest (418 tests)
npm run test:invalidate  # invalidation audit spec only (~205 checks)
npm start            # production server
```

## Required env (see `lib/env.ts`)

`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`

## Sentry (monitoring) — current setup

| Piece | Location |
|-------|----------|
| Shared config + tunnel path | `lib/monitoring/sentry-config.ts` (`SENTRY_TUNNEL_PATH`, `scrubSentryEvent` drops browser-translate `removeChild` when `translated-ltr`/`rtl` present) |
| App helpers | `lib/monitoring/sentry.ts` |
| Client init | `instrumentation-client.ts` |
| Server / edge init | `sentry.server.config.ts`, `sentry.edge.config.ts` |
| Instrumentation | `instrumentation.ts` (`onRequestError` → Sentry) |
| Next wrap + tunnel rewrite | `next.config.ts` → `withSentryConfig`, `tunnelRoute` |
| Global errors | `app/global-error.tsx` |
| React boundary | `components/shared/ErrorBoundary.tsx` (root layout) |
| API 5xx | `lib/api/response-helpers.ts` → `captureException` (4xx → `logger.warn` only) |
| Logger | `lib/logger.ts` → Sentry 5xx; skips Axios 4xx via `isExpectedClientError` |
| Error helpers | `lib/api/errors.ts` → `getErrorHttpStatus`, `isExpectedClientError` |

**Env:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` (same DSN). Optional: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (source maps / CI; `.env.sentry-build-plugin`).

**Tunnel:** Browser sends to `/api/monitoring` (first-party), not `ingest.de.sentry.io` — ad-blocker safe. Client `tunnel` and `next.config` `tunnelRoute` must stay in sync (`SENTRY_TUNNEL_PATH`).

**Browser translate:** OSS default allows Chrome Translate. Optional `NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE=true` → `translate="no"` on `<html>` in `app/layout.tsx` (prod-only).

**Do not** call `Sentry.init` in `sentry.client.config.ts` (legacy filename only; init is in `instrumentation-client.ts`).

**ChunkLoadError:** `ErrorBoundary.componentDidCatch` auto-reloads once on `ChunkLoadError` (stale Vercel chunk after deploy) via `sessionStorage` loop guard — no Sentry event raised (REQ-0014).

**RHF invalid callback:** Use `logger.warn` (not `logger.error`) for client-side form validation failures — `logger.error` routes to Sentry. `OrderDialog` create form validated this pattern (REQ-0015).

**Radix portal removeChild:** `isRadixPortalRemoveChildError` in `sentry-config.ts` + `scrubSentryEvent` + `ErrorBoundary` silent recovery (Safari + Chrome; REQ-0017). Translate-only scrub unchanged (`translated-ltr`/`rtl`).

**OAuth state mismatch:** `logger.warn` on invalid/expired `oauth_state` cookie (REQ-0016).

**Production:** Redeploy after env changes so `NEXT_PUBLIC_*` is baked into the client bundle.

## Supplier catalog detail (REQ-0029)

| Piece | Location |
|-------|----------|
| Access gates | `lib/server/catalog-entity-access.ts` — assigned-product category gate; own-supplier record gate |
| Category detail | `lib/server/category-detail-data.ts` — supplier: `findUnique` + product-scoped list; read-only |
| Supplier detail | `lib/server/supplier-detail-data.ts` — supplier: own entity only; read-only |
| Redis scope | `cacheKeys.categories/suppliers.detail(id, scope?)` — `supplier:{entityId}` suffix |
| UI | `CategoryDetailPage` / `SupplierDetailPage` — `disableCrud` for supplier + client |
| Tests | `lib/server/catalog-entity-access.test.ts` |

**Invalidation:** unchanged — `categories:*` / `suppliers:*` pattern clears scoped keys; TanStack detail keys unscoped (SSR `initial*` per nav).

## Product delete policy

- **Active order** (not `delivered` / `cancelled`) → **409** block
- **Order history only** → **soft delete** (`deletedAt` on Product; hidden via `mergeProductListWhere`)
- **Catalog filter:** `deletedAt: null` OR `deletedAt` unset (legacy MongoDB rows)
- **No orders** → **hard delete** (ImageKit cleanup + `product.delete()`)
- Helpers: `lib/products/delete-policy.ts`, `lib/products/product-query.ts`, `lib/api/prisma-errors.ts`
- After schema change: `npx prisma db push` on MongoDB

## Data & UI sync (TanStack Query)

- Keys: `lib/react-query/config.ts`
- Provider: `lib/react-query/provider.tsx`
- **After CRUD:** `invalidateAllRelatedQueries` in `lib/react-query/invalidate-all.ts` (lists vs `.all` per domain — see comments there)
- **After delete:** `cancelOrRemoveDetailQuery` in `lib/react-query/cancel-or-remove-detail.ts` — cancels detail fetch; skips `removeQueries` while detail page is mounted (avoids GET 404 after soft-delete)
- Hooks: `hooks/queries/*` (all mutation hooks invalidate; notifications scoped)
- Back navigation: `hooks/use-back-with-refresh.ts` → invalidates before `router.back` / `push`
- Auth: `contexts/` + `hooks/queries/use-auth.ts` (logout uses `queryClient.clear()`); `auth-context` syncs Sentry user via `syncSentryUserFromAuth`

When adding mutations: `onSuccess` → `invalidateAllRelatedQueries` unless intentional narrow scope. Delete hooks: `cancelOrRemoveDetailQuery` then `invalidateAllRelatedQueries`.

**Audit:** `npm run test:invalidate` → `lib/react-query/invalidate-coverage.test.ts` (~200 checks: hooks, components, API write routes, registry, delete/update patterns).

## Table page-size Select (Radix portal, 2026-05-22)

- Hook: `hooks/use-deferred-radix-select.ts` — defer Radix Select until route stable; reset on `usePathname()` change and when `enabled={!isLoading}`
- Gate: `components/shared/DeferredSelectGate.tsx` — reusable wrapper for filter/login/detail/dialog Selects (`enabled={open}` in dialogs; nav-heavy routes)
- UI: `components/shared/PaginationSelector.tsx` + `pagination-select-styles.ts` — all data tables use this for “Rows per page” (variants: sky, violet, rose, emerald); changing page size resets `pageIndex` to 0
- Clamp: `hooks/use-clamp-pagination-index.ts` — when filters shrink row count, clamps `pageIndex` to last valid page (all `*Table.tsx`)
- Fixes Sentry `removeChild` on `/orders` when navigating e.g. `/products` → `/orders`

## Validation + Sentry hardening (REQ-0010/0011, 2026-05-19)

| Area | Implementation |
|------|----------------|
| Products API | `createProductBodySchema` / `updateProductBodySchema`; POST+PUT `safeParse` in `app/api/products/route.ts` |
| Form | `productFormSubmitSchema` in `ProductFormDialog` (category/supplier + RHF fields) |
| Import | `createProductSchema` extends body schema (shared primitives in `lib/validations/product.ts`) |
| 4xx logging | `isExpectedClientError` → no Sentry for mutation catch `logger.error("label:", axios4xx)` |
| Invoice 409 | `useCreateInvoice` toast title "Invoice already exists" |
| Tests | `lib/validations/product-api.test.ts`, `lib/logger.test.ts` |

No TanStack/SSR/invalidation changes — mutations unchanged.

## API Zod sweep (REQ-0013, 2026-05-19)

All user-facing POST/PUT JSON bodies use `safeParse` + `logger.warn` on fail. New: payment, shipping (3), notifications (2), system-config, ai/insights, qr-code, auth login/register. Skip: Stripe/Shippo/QStash webhooks, multipart image.

## Catalog API Zod (REQ-0012, 2026-05-19)

| Area | Implementation |
|------|----------------|
| Categories | `createCategoryBodySchema` / `updateCategoryBodySchema` → `app/api/categories/route.ts` |
| Suppliers | `createSupplierBodySchema` / `updateSupplierBodySchema` → `app/api/suppliers/route.ts` |
| Warehouses | `lib/validations/warehouse.ts` → `app/api/warehouses/route.ts` |
| API barrel | `getErrorHttpStatus`, `isExpectedClientError` from `@/lib/api` |
| Audit doc | `docs/SENTRY_ERRORS.md` (tracked) |

## Sentry remediation (2026-05-19)

| Family | Fix |
|--------|-----|
| removeChild (cases 1/7) | `DeferredSelectGate` on LoginPage, filter toolbars, admin detail pages, form dialogs (`enabled={open}`), shipping dialog; table footers use `PaginationSelector` |
| OAuth P2002 username (case 5) | `lib/auth/unique-username.ts` + `createGoogleOAuthUser` in Google OAuth callback |
| OpenRouter 402 (cases 2–4) | `lib/ai/create-chat-completion.ts` — OpenRouter first, Groq fallback; insights route → `serviceUnavailableResponse` (no Sentry); client billing toast only when both fail |
| Hydration `/` (case 6) | `force-dynamic` + SSR in `app/page.tsx` (no route Suspense); `initialOAuthSuccess` from server; `CategoryList` + `DeferredSelectGate` |

**AI insights:** `lib/ai/create-chat-completion.ts` (`createChatCompletion`, `isLlmConfigured`). Env: `OPENROUTER_API_KEY`, optional `GROQ_API_KEY` + `GROQ_MODEL`. Groq chain in `lib/ai/groq.ts`: `gpt-oss-20b` → `qwen3.6-27b` → `gpt-oss-120b` (REQ-0018; llama deprecated). Routes: `POST /api/ai/insights`, `POST /api/forecasting`.

## Home route `/` (SSR-first, 2026-05-19)

- [`app/page.tsx`](app/page.tsx): server `getSession`, redirects, `Promise.all` home data, `searchParams.oauth_success` → `initialOAuthSuccess`
- **No route `<Suspense>`** — root [`app/layout.tsx`](app/layout.tsx) `export const dynamic = "force-dynamic"`
- [`components/Pages/HomePage.tsx`](components/Pages/HomePage.tsx): client OAuth session refresh + RQ `setQueryData` from `initial*` props only
- Pattern matches [`app/products/page.tsx`](app/products/page.tsx): server in page, client for hooks/router

## QStash email webhook (2026-05-19)

- **Route:** `app/api/email/queue/process/route.ts` — read body once (`request.text()`), never `text()` then `json()` on same request
- **Verify + parse:** `lib/queue/qstash-webhook.ts` — `verifyQStashWebhook` (Upstash `Receiver`), `parseEmailQueueJob`
- **Enqueue:** `lib/email/queue.ts` → `publishJSON` to webhook URL
- **Webhook send:** `sendEmailDirectly(job, { propagateErrors: true })` → 500 on failure so QStash retries
- **Exempt:** no TanStack/Redis invalidation (webhook only); listed in `API_WRITE_EXEMPT` in invalidate-coverage test
- **Tests:** `lib/queue/qstash-webhook.test.ts`

## API / server

- Routes: `app/api/**/route.ts`
- Shared responses: `lib/api/response-helpers.ts`
- Repositories: `prisma/*.ts`

## Agile V (Infinity Loop) — C1 active

| Artifact | Path |
|----------|------|
| Resume | `.agile-v/STATE.md` |
| REQs | `.agile-v/REQUIREMENTS.md` (REQ-0001…0046) |
| Skills (24) | `.agile-v/skills/SKILLS_INDEX.md` |
| Gates | `.agile-v/VALIDATION_SUMMARY.md`, `REVALIDATION_LOG.md` |
| Cursor rule | `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`) |

**Every session:** STATE → REQ map → skill 01+17 → Red Team → write-through DECISION/BUILD/VALIDATION.

**C1 open:** Human Gate 2 (Sentry 24h). **REQ-0021–0046** done (C2).

## SafeImage (REQ-0038)

| Piece | Location |
|-------|----------|
| Core | `components/ui/safe-image.tsx` — `next/image` then native `<img>` on error |
| Avatars | `components/ui/safe-avatar-image.tsx` — Google → robohash fallback |
| Rule | UI images → `SafeImage`; user avatars → `SafeAvatarImage` |
| Doc | `docs/SAFE_IMAGE_REUSABLE_COMPONENT.md` |

**No TanStack/SSR changes** — client components only; `src` reset on CRUD image updates.

## Product status filter glass (REQ-0037)

| Piece | Location |
|-------|----------|
| Filter dropdown | `components/products/ProductStatusFilter.tsx` — `ProductStockStatusBadge` per row |
| Table/detail | `ProductStockFromQuantityBadge` / `ProductStockStatusBadge` in `semantic-badges.tsx` |
| Parent | REQ-0028 AC7 gap — matches `InvoiceStatusFilter` / `OrderStatusFilter` pattern |

**No TanStack/SSR changes** — filter values `Available` / `Stock Low` / `Stock Out` unchanged.

## App shell width (REQ-0036)

| Piece | Location |
|-------|----------|
| Shell token | `lib/ui/shell-layout-styles.ts` — `APP_SHELL_WIDTH_CLASS`, `APP_SHELL_DETAIL_CLASS` |
| Shell layouts | `Navbar`, `Footer`, `SidebarLayout` — full bleed (`mx-auto w-full min-w-0`) |
| Lists/details | 11 lists + 6 detail pages import shared tokens |
| Auth cap | `AuthPageShell` only — `max-w-7xl`; no `max-w-9xl` anywhere |
| Tailwind | `9xl` token removed from `tailwind.config.ts` |

**No TanStack/SSR/API changes** — CSS-only; ultrawide uses full viewport minus padding.

## Auth login/register (REQ-0030–0033)

| Piece | Location |
|-------|----------|
| Shell + BG anim | `components/auth/AuthPageShell.tsx` — `max-w-7xl`, `auth-page-root`, `authBgFloat` |
| Left panel | `AuthInfoPanel` + `AuthBrandHeader` + `AuthInfoListItem` — flat list, 6 items |
| Copy | `lib/auth/auth-panel-copy.ts` — no password in UI (pre-fill in `test-accounts.ts`) |
| Form glass | `AuthFormCard` + `auth-glass-styles.ts` — `backdrop-blur-2xl` |
| Icon glow | `AUTH_LIST_ICON_GLASS` in `auth-glass-styles.ts` |
| Role Select | `LoginRoleSelect` — icons in trigger/items; no `DeferredSelectGate` on `/login` |
| Scroll shift | `html:has(.auth-page-root) { scrollbar-gutter: stable }` in `globals.css` |
| Animations | `.auth-enter` stagger in `globals.css` + `AuthAnimatedBlock` |
| Session toasts | `AuthSessionToasts` after `Toaster` in `app/layout.tsx`; `setPostLoginWelcome` / `setPostLogoutGoodbye` in sessionStorage; `useToast` sync on subscribe |
| OAuth welcome | REQ-0035 — `?oauth_success=true` handled in `AuthSessionToasts`; `oauth-success-url.ts` + `auth-welcome-toast.ts` |

**No TanStack/CRUD changes** — static auth routes; `force-dynamic` in `app/login/page.tsx`, `app/register/page.tsx`.

## P3 SSR gaps (REQ-0026)

| Piece | Location |
|-------|----------|
| Ghost-fetch gates | `useClientOrders`/`useClientInvoices`/`useDashboard` `enabled` in list components |
| Detail secondary SSR | `lib/server/{warehouse-stock,product-reviews-detail,order-review-context}-data.ts` |
| Client browse SSR | `lib/server/client-browse-data.ts`, `app/products/page.tsx` (client branch) |
| Client catalog SSR | `lib/server/client-catalog-data.ts`, `app/client/page.tsx` |
| Owner picker | `components/products/ProductOwnerSelect.tsx` — searchable Command; meta lists owners-with-products only |
| Owner URL sync | `lib/navigation/shallow-search-param.ts` + `ProductsPage` — `?ownerId=` via `history.replaceState` (REQ-0027) |
| Warm prefetch | `RouteWarmPrefetch` deferred via `requestIdleCallback`; role-scoped batched TanStack warm + staggered `router.prefetch` nav paths (REQ-0093); `warmAdminClientPortalLists` on `/` or `/admin` only (REQ-0027) |
| Portal charts | `components/ui/deferred-chart-section.tsx` |
| Notifications | list fetch gated when dropdown closed |

**C2 backlog (REQ-0027):** done — shallow `?ownerId=` + deferred admin client-list warm.

## Role-scoped warm prefetch (REQ-0093)

| Piece | Location |
|-------|----------|
| Nav config | `lib/navigation/role-nav-config.ts` — `getNavItemsForRole`, `getNavPathsForRole`, `getHomePathForRole` |
| TanStack warm | `lib/react-query/warm-route-prefetch.ts` — batched prefetch (4 concurrent); client skips admin catalog lists |
| Provider | `components/providers/RouteWarmPrefetch.tsx` — idle phase 1 API warm, phase 2 RSC prefetch via `getWarmPathsForRole`; refs reset on logout |
| Filter leak | `CategoryFilter` / `SupplierFilter` — `useCategories`/`useSuppliers` `enabled: false` when override present |
| Api status | `ApiStatusPage` — role-scoped probes; Strict Mode cancel guard |

**No invalidation changes** — warm is read-only prefetch only.

## Instant nav feel (REQ-0094)

| Piece | Location |
|-------|----------|
| Navbar Link prefetch | `components/layouts/Navbar.tsx` — brand, nav items, profile menu, mobile; no `router.push` for nav |
| Nav link tokens | `lib/navigation/nav-link-styles.ts` — `navbarNavLinkClass`, `adminSidebarLinkClass` |
| Warm paths | `role-nav-config.ts` — `getWarmPathsForRole`; `resolveWarmNavPath` skips `/admin` redirect |
| Portal prefetch | Client/Supplier portal + admin embeds + `CatalogDetailRecentOrdersList` detail links |
| Gap deferred | hover prefetch; portal "View All" links — optional, not needed now |

**No invalidation changes** — Link prefetch + extended RSC warm only; TanStack warm unchanged.

## Shell-first nav (REQ-0021)

| Piece | Location |
|-------|----------|
| Inline pulse | `components/shared/DataSlotPulse.tsx` |
| Loading predicate | `lib/react-query/is-data-slot-loading.ts` |
| Table body pulse | `components/ui/table-data-skeleton.tsx` → `TableBodyPulseRows` |
| Card value pulse | `StatisticsCard` `valueLoading` / `badgeValuesLoading` |
| SSR pattern | `page.tsx`: `Suspense fallback={<Shell/>}` + `*WithData` async child |
| Hook hydration | `use*()` optional `initialData` via `withInitialData()` in hooks |
| Invalidation | unchanged — `invalidateAllRelatedQueries` + 200 audit |

**Rule:** Shell (titles, headers, filters, sidebar) always visible; only data values pulse. No `loading.tsx`.

## Docs

- Full walkthrough: `docs/PROJECT_WALKTHROUGH.md`
- Integrations (Redis, Sentry, PostHog): `docs/Redis_Sentry_PostHog_INTEGRATION_GUIDE.md`
- Human README: `README.md`

## Deploy + Sentry watch (2026-07-08)

| Item | Status |
|------|--------|
| Prod SHA target | pending (REQ-0021–0027) |
| Gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ |
| REQ-0009 | Verify hydration + locale post-REQ-0020 on admin pages |
| REQ-0029 | Supplier category/supplier detail from product links — read-only, scoped cache |

**Expect after deploy:** no OAuth state mismatch Sentry errors; no ErrorBoundary/removeChild on admin/suppliers nav.

## Catalog + list filter chips (REQ-0041–0043)

| Piece | Location |
|-------|----------|
| Tokens | `lib/ui/catalog-filter-tokens.ts`, `lib/ui/filter-chip-styles.ts` |
| Catalog select | `CatalogActiveInactiveSelect.tsx` — icon+label inline (div not span) |
| Active/inactive chips | `ActiveInactiveFilterChips.tsx` — category/supplier/warehouse |
| Multi-select chips | `DismissibleFilterChips.tsx` — products/orders/invoices/reviews/tickets/history/users |
| Export menu | `ExportMenuButton.tsx` — muted chevron rotate 180°; optional `disabled` |
| Hover | X → rose; Reset → sky + `RotateCcw` |

**Invalidation:** unchanged — client filter state only; no TanStack/SSR changes.

## Typography scale (REQ-0044)

| Tier | Classes | Use |
|------|---------|-----|
| Page header | `TYPO_PAGE_HEADER` → `text-sm sm:text-lg` | h1/h2, `PageSectionHeader` |
| Card title | `TYPO_CARD_TITLE` → `text-sm sm:text-base` | h3, dialogs, section cards |
| Subtitle | `TYPO_SUBTITLE` → `text-xs sm:text-sm` | descriptions |
| Stat value | `TYPO_STAT_VALUE` → `text-sm sm:text-lg` | metrics only |

Hub: `lib/ui/typography-scale.ts`. Hubs import tokens; ~45 inline files use equivalent class strings. Zero `text-xl` in UI; brand `text-sm sm:text-lg`. `DataSlotPulse variant="text-md"` = skeleton height — not typography.

## Filter row UX + invoice status (REQ-0045)

| Piece | Location |
|-------|----------|
| Whole-row toggle | `lib/ui/filter-command-item.tsx` — `FilterCommandCheckboxItem`; `onSelect` only; checkbox visual |
| Multi-select filters | all `*StatusFilter.tsx`, Category/Supplier/Import/User, `filter-dropdown.tsx` |
| Invoice status perf | `InvoiceTable` + `InvoiceFilters` client-side status; API `buildInvoiceListFilters` search+scope only |
| Header spacing | `PAGE_SECTION_HEADER_SPACING_CLASS`, `PAGE_STATS_GRID_CLASS` in `shell-layout-styles.ts` |
| List headers | Home, My Activity, Email Preferences, Analytics — `PageSectionHeader` + icons |

**No TanStack/invalidation/SSR changes** — client filter state only; invoice API cache-hit info logs removed.

## Catalog toolbar trigger parity (REQ-0046)

| Piece | Location |
|-------|----------|
| Shared layout | `CATALOG_TOOLBAR_TRIGGER_LAYOUT` in `catalog-filter-tokens.ts` — `h-10 px-4 gap-2 sm:w-auto` |
| Filter | `CatalogActiveInactiveSelect` — category/supplier/warehouse status selects |
| Export | `ExportMenuButton` — same layout token + accent hue |
| Focus no-shift | `lib/ui/focus-ring-styles.ts` — `FOCUS_NO_LAYOUT_SHIFT_CLASS`, `GLASS_FOCUS_RING` per hue |
| Filter search | `lib/ui/filter-toolbar-styles.ts` — `FILTER_SEARCH_INPUT_SKY_CLASS` / `_TEAL_CLASS` |
| Dialog forms | `components/shared/dialog-form-field.ts` — `DIALOG_FORM_FIELD_*` (rose/sky/emerald/violet/indigo/amber/teal/cyan/blue) |
| Primitives | `ui/input`, `ui/select`, `ui/textarea` — neutral ring + no border-width shift |

**CSS-only** — no TanStack/SSR changes. Rings use box-shadow (no layout shift); dark mode uses brighter hue rings.

## Glass button tokens (REQ-0047)

| Piece | Location |
|-------|----------|
| Tokens | `lib/ui/glass-button-styles.ts` — `GLASS_PRIMARY_BUTTON`, `GLASS_ACTION_BUTTON`, `GLASS_GHOST_BUTTON`, `GLASS_BUTTON_ICON_HOVER` |
| Barrel | `components/shared/index.ts` — re-exports glass tokens + `glassPrimaryButtonClass` / `glassActionButtonClass` |
| Focus build-on | `focus-ring-styles.ts` — `FOCUS_NO_LAYOUT_SHIFT_CLASS`, `GLASS_FOCUS_RING` per hue |
| Batch A | PaymentDialog, ShippingManagement, ApiStatusPage, BusinessInsightPage, EmailPreferencesPage, SystemConfigSettings |
| Batch B | Category/Supplier/Order/Invoice/CreateUser/SupportTicket dialogs; LoginPage, RegisterPage |

**CSS-only** — no TanStack/SSR/invalidation changes. **Commit split:** REQ-0046 focus-ring (separate); REQ-0047 glass buttons + Email Preferences UX.

## Auth light mode + dialog tables + order thumbs (REQ-0048)

| Piece | Location |
|-------|----------|
| Auth fields | `auth-glass-styles.ts` — `AUTH_FORM_FIELD_SKY/EMERALD`, `AUTH_GOOGLE_BUTTON` (light-mode readable) |
| Dialog tables | `dialog-edge-scroll.ts` — `DIALOG_TABLE_*` tokens; Category/Supplier dialogs `context: 'dialog'` |
| Order product select | `ProductOptionRow.tsx` — SafeImage inline; `OrderDialog` Package label + thumbs |

**CSS/UI only** — no TanStack/SSR/invalidation changes.

## Dialog UX polish (REQ-0049)

| Piece | Location |
|-------|----------|
| Dual-theme tables | `dialog-edge-scroll.ts` — light list-page zebra + `DIALOG_TABLE_LINK` / `DIALOG_TABLE_ACTION_ICON` |
| Slim columns | `CategoryTableColumns.tsx`, `SupplierTableColumns.tsx` — hide description/notes when `context: 'dialog'` |
| Glass shell reset | `glass-button-styles.ts` — `GLASS_BUTTON_SHELL_RESET`, `GLASS_BUTTON_DISABLED`; `variant="ghost"` on glass `<Button>` |
| Submit gates | Category/Supplier/Warehouse/ProductForm dialogs — `disabled` until required fields valid |
| CTA promotion | Email prefs Save, System config Save, Business insights Export/AI, API Refresh → `GLASS_PRIMARY_BUTTON` |
| Backlog | ProductForm/ProductImport/ProductReview/Warehouse — `GLASS_GHOST_BUTTON` + `GLASS_PRIMARY_BUTTON` |

**CSS/UI only** — no TanStack/SSR/invalidation changes.

## Glass shell-reset polish (REQ-0050)

| Piece | Location |
|-------|----------|
| Table section title | `DIALOG_TABLE_SECTION_TITLE` in `dialog-edge-scroll.ts`; Category/Supplier dialog `<h3>` |
| Review submits | `ProductReviewDialog`, `WriteEditReviewDialog` → `GLASS_PRIMARY_BUTTON.amber` + shell reset |
| Batch B sweep | Order/Invoice/Payment/SupportTicket dialogs + Login/Register — `variant="ghost"` + `GLASS_BUTTON_SHELL_RESET` on primary buttons |

**CSS/UI only** — completes REQ-0049 deferred gaps; no TanStack/SSR/invalidation changes.

## Back-button sweep (REQ-0057)

| Piece | Location |
|-------|----------|
| Hook coverage | `useBackWithRefresh` — all 9 entities: order/invoice/product/category/supplier/warehouse/support-ticket/product-review/user |
| AdminOrderDetailContent | switched `backHref` Link → `onBack={handleBack}` via `useBackWithRefresh("order")` |
| InvoiceDetailPage delete | `navigateTo("/invoices")` instead of bare `router.push` |
| router.refresh() removed | ProductDetailPage, CategoryDetailPage, SupplierDetailPage (duplicate handler), ProductActions, CategoryActions, SupplierActions (copy handler) — mutation hooks already call `invalidateAllRelatedQueries` |
| Dead imports | `useRouter` import+instance removed from `ProductActions`, `CategoryActions` |

**Rule:** Every detail page back button must use `handleBack` or `navigateTo` from `useBackWithRefresh`. No bare `<Link href>` for back nav on pages with CRUD. No `router.refresh()` after mutations (hooks handle it).

## Order/Invoice UX (REQ-0058–0062)

| Piece | Location |
|-------|----------|
| CopyableText | `components/shared/CopyableText.tsx` — inline copy icon (Check ~1.5s, no toast); `stopPropagation` safe in `<Link>` cells; on all order/invoice number render points (tables, detail headers, portals, catalog recent-order cards) |
| ProductThumb | `components/products/ProductOptionRow.tsx` — extracted SafeImage 32/40px + Package fallback; used by `OrderItemsCard` line items, `WarehouseDetailPage` allocations, category/supplier product grids |
| Detail imageUrl | `prisma/order.ts` (5 detail fetches + `updateOrder` include), `transform-order-detail.ts`, PUT response, `OrderItem.imageUrl?`; `stock-allocations` API + `warehouse-stock-data.ts` + `StockAllocation.product.imageUrl?` |
| OrderPickerCommand | `components/invoices/OrderPickerCommand.tsx` — searchable Command picker in `InvoiceDialog` create mode; `initialOrderId` prop pre-selects (admin client-orders leg auto-loads) |
| invoiceForOrder on lists | `getInvoiceLinkMap` (batch, `lib/server/orders-data.ts`) → all 4 SSR transforms + `GET /api/orders`; `OrderForPage.invoiceForOrder` |
| OrderActions invoice items | no invoice + admin/owner → Create Invoice (dialog hosted in `OrderList`); linked → View (all) / Edit (nav to detail) / Delete (AlertDialog) admin/owner only |
| Detail Create Invoice | `OrderDetailPage` action row + `AdminOrderDetailContent` invoice card |
| InvoiceActions order items | View Order (all roles, admin base-aware); Cancel Order admin/owner w/ confirm; Edit/Send/Delete now role-gated for client/supplier |

**Invalidation:** unchanged — `INVOICE_PATTERNS` already clears `orders:*` in Redis; TanStack `invalidateAfterOrderGraphChange` covers all new mutation paths.

## Detail polish (REQ-0063)

| Piece | Location |
|-------|----------|
| mapOrderItemsFromRaw | `lib/orders/map-order-items.ts` — shared Prisma→OrderItem mapper (order + invoice detail) |
| Invoice line items | `enrichInvoice` widens product select (no extra query); `linkedOrderNumber` + `linkedOrderItems` on Invoice |
| ProductLineItemsList | `components/shared/ProductLineItemsList.tsx` — shared thumb rows; `OrderItemsCard` + `InvoiceDetailPage` |
| Invoice Related Order | CopyableText on order #; `/admin/orders` when `embedInAdmin` |
| Shipping copy | `ShippingManagement` order#/tracking + `OrderTrackingInfo` tracking # → `CopyableText` |

**No invalidation changes** — read-only SSR enrichment on invoice GET.

## Polish + glass backlog (REQ-0064 + REQ-0051)

| Piece | Location |
|-------|----------|
| CopyableText payment ref | `PaymentDialog.tsx` |
| OrderItem.createdAt | `types/order.ts` → ISO string; no cast in `map-order-items.ts` |
| Body typography | `TYPO_BODY` / `TYPO_BODY_MUTED` in `typography-scale.ts` |
| Detail CTAs | Order/Invoice/Category/Warehouse detail bottom rows → `GLASS_*` |
| FABs | `FloatingActionButtons.tsx` → glass tokens per hue |

**CSS-only** — no TanStack/SSR/invalidation changes.

## Admin detail parity (REQ-0065)

| Piece | Location |
|-------|----------|
| Headers | `AdminSupportTicketDetailContent`, `AdminProductReviewDetailContent`, `AdminUserManagementDetailContent` → `PageSectionHeader` + icons |
| Action rows | Back (ghost) + Delete (rose) bottom rows; `AdminOrderDetailContent` bottom Back |
| Status cards | Inline Selects wrapped in labeled glass cards — "Changes apply immediately" |

**No invalidation changes** — UI only.

## Warehouse integration (REQ-0066)

| Piece | Location |
|-------|----------|
| APIs | `GET stock-allocations?productId=`; `POST stock-transfers` create+complete; warehouse DELETE allocation cleanup |
| Order sync | `lib/products/decrement-stock-allocations.ts` — greedy decrement on confirm/paid + Stripe webhook |
| Hooks | `useStockByProduct`, `useCreateStockTransfer`, `useWarehouseStockSummary(initialData)` |
| UI | `AllocateStockDialog`, `TransferStockDialog` on `WarehouseDetailPage`; product warehouse card; list stock-share column |
| SSR | `product-stock-data.ts`; user + **admin** product/warehouse list prefetch |
| Transfer safety | `cancelStockTransfer` if complete fails after create |
| Hardening | `planAllocationDecrements` (avail−reserved); `stock-product-access` role gates; client POST/transfer → 403 |

**Invalidation:** `invalidateAfterStockChange`; Redis `scheduleInvalidateStockAllocationCaches` on writes; audit +1 route (207 checks).

## Per-warehouse order picking (REQ-0068)

| Piece | Location |
|-------|----------|
| Schema | `OrderItem.warehouseId` + `warehouseName` snapshot |
| Sync | `lib/products/stock-allocation-order-sync.ts` — reserve/fulfill/release/restore |
| Decrement | `decrement-stock-allocations.ts` — targeted pick or greedy fallback |
| UI | `OrderLineWarehouseSelect` in `OrderDialog`; warehouse on `ProductLineItemsList` |
| Gaps fixed | Invoice-paid allocation fulfill; warehouse DELETE clears `products:*` Redis |

**Invalidation:** unchanged — order/invoice writes use `invalidateOnOrderChange`; warehouse delete uses `invalidateAfterStockChange`.

## AI warehouse insights (REQ-0067)

| Piece | Location |
|-------|----------|
| Enrichment | `app/api/ai/insights/route.ts` — appends `getWarehouseStockSummary` per-warehouse lines |
| Prompt | System prompt mentions rebalancing and inter-warehouse transfers |

## Warehouse UX polish (REQ-0066 AC6)

| Piece | Location |
|-------|----------|
| Enrich | `lib/stock-allocation/stock-allocation-enrich.ts` — price/category/supplier on allocation rows (API + SSR) |
| Dialogs | `AllocateStockDialog`, `TransferStockDialog` — `DIALOG_EDGE_SCROLL_*` shell; Popover full-width picker |
| Quantity | `StockQuantityField` + `getStockQuantityValidation` |
| Submit | `DialogSubmitButton` — spinner + pending label (catalog/order/invoice/ticket/review dialogs) |
| FAB | `lib/ui/fab-button-styles.ts` — visible gradient (no ghost bleed) |
| Glass CTA | `GLASS_PRIMARY_BUTTON` uses `!text-white`; detail CTAs drop `variant="ghost"` |
| Stale fix | `hooks/use-sync-ssr-query-data.ts` — generalized SSR→TanStack sync (REQ-0069); all detail + list pages |

**Invalidation:** unchanged — `invalidateAfterStockChange` + `useBackWithRefresh("warehouse")`.

## SSR cache sync + submit UX (REQ-0069)

| Piece | Location |
|-------|----------|
| Sync hooks | `hooks/use-sync-ssr-query-data.ts` — `useSyncSsrQueryData`, `useSyncSsrQueryDataMany`; exported from `lib/react-query` |
| Back nav stock | `useBackWithRefresh` — `warehouse` / `product` → `invalidateAfterStockChange` |
| Detail + lists | All `*DetailPage*` + `ProductList`, `OrderList`, `InvoiceList`, `WarehouseList`, `CategoryList`, `SupplierList`, `HomePage`, `StatisticsSection` |
| Submit sweep | `PaymentDialog`, `CreateUserDialog`, `dialog-footer-actions`, detail CTAs → `DialogSubmitButton` |
| Tests | `lib/stock-allocation/stock-allocation-enrich.test.ts` |
| Orphans removed | `AdminPage.tsx`, `SidebarLayout.tsx` (zero importers; `app/admin/page.tsx` redirects) |

**No invalidation registry changes** — bridges `withInitialData` + `refetchOnMount:false` only.

## SSR sync completion (REQ-0070)

| Piece | Location |
|-------|----------|
| Hook harden | `useSyncSsrQueryDataMany` — fingerprint-only deps |
| Client browse | `ClientProductList` — meta + products (ownerId-gated) |
| Role portals | `ClientPortalPage`, `SupplierPortalPage` — userId-scoped portal keys |
| Admin portals | `AdminClientPortalContent`, `AdminSupplierPortalContent` |
| Admin lists | `ProductReviewList`, `SupportTicketList`, `SupportTicketsPageContent`, `UserManagementList`, `HistoryList`, `AdminMyActivityContent`, `AdminAnalyticsContent`, `ForecastingSection` |
| Many adoption | `ProductDetailPage`, `ProductReviewsSection`, ticket detail components |

## Portal & detail UX (REQ-0071)

| Piece | Location |
|-------|----------|
| Portal headers | `ClientPortalPage`, `SupplierPortalPage` — `PageSectionHeader` + View All icons |
| Browse | `ClientProductList` header; `storeOwners` counts in browse meta + `ProductFilters` |
| Line items | `enrich-order-items-catalog.ts`; `ProductLineItemsList` category/supplier |
| Detail CTAs | `glassDetailFooterButtonClass`; detail page sweep (no `variant="ghost"` on primaries) |
| Info cards | `DetailInfoRow`; expanded order/invoice information rows |
| Stripe back | `stripe-return.ts` + `useBackWithRefresh` fallback + `location.replace` on return |
| Hotfixes | `useSyncSsrQueryData` fingerprint deps; `FabButton` `forwardRef` |

## REQ-0071 completion sweep (REQ-0072)

| Piece | Location |
|-------|----------|
| Header back token | `DETAIL_HEADER_BACK_ICON_CLASS` in `glass-button-styles.ts`; 8+ detail headers |
| Admin glass | `AdminOrderDetailContent` + 3 admin embeds + `AdminHistoryDetailContent` |
| Catalog info cards | Product/Category/Supplier/Warehouse → `DetailInfoRow` inside `GlassCard` |
| Partial payment | Order detail row links to invoice when `invoiceForOrder` + `paymentStatus === "partial"` |
| Enrich test | `lib/orders/enrich-order-items-catalog.test.ts` |

**No TanStack/SSR/invalidation changes** — CSS/docs/tests only.

## Portal/browse/order UX (REQ-0073)

| Piece | Location |
|-------|----------|
| Portal spacing | `ClientPortalPage`, `SupplierPortalPage` — `flex flex-col` + header `pb-0` |
| Recent cards | `CARD_LIST_*` + `ClientCompactDateTime`; badge `overflow-visible` |
| Owner avatars | `ProductOwnerSelect` + browse meta `image`; single-row `ProductFilters` |
| FAB toggle | `FloatingActionButtons` — click expand, dialog close collapse |
| Line items | `ProductLineItemsList` — thumb + SKU/qty rows; warehouse link by role |
| Paid date | `order-detail-data.ts` invoice `paidAt` → Order `paidAt` row |
| Icons | `OrderSummaryCard`, `OrderPartiesCard`, `OrderStatusBadges`, `DialogSubmitButton` |

## Portal/chart/detail parity (REQ-0074)

| Piece | Location |
|-------|----------|
| Portal spacing | `PAGE_STATS_GRID_CLASS` + section `pb-6` on client/supplier/browse |
| Chart labels | `lib/ui/chart-point-label.tsx` — value at data points |
| FAB hover | `FloatingActionButtons` — hover+click expand, collapse on leave/dialog close |
| Order dialog | `OrderDialog` 3-col grid + `OrderLineWarehouseSelect` h-11 |
| Detail parity | `PartiesRolesCard`, `InvoiceSummaryCard`, party `image` SSR |

**Next (2026-07-12):** REQ-0078 — supplier UI sweep beyond files touched in REQ-0077.

## Chart labels + portal + product detail UX (REQ-0077)

| Piece | Location |
|-------|----------|
| Chart labels | `lib/ui/chart-point-label.tsx` — `CHART_LABEL_TOP_MARGIN=28`, gray/white `text-xs font-normal`; `ChartCard` body `overflow-visible` |
| Portal catalog meta | `ClientCatalogOverview.meta` — parallel `count()` in `client-catalog-data.ts`; subsection badges on `ClientPortalPage` |
| Shared primitives | `AvatarInlineLink.tsx`, `CARD_EMPTY_MESSAGE_CLASS`, `glassDetailBackButtonClass()` |
| CopyableText sweep | Product/category/supplier/warehouse detail IDs + names; `ProductTableColumns` name/SKU |
| Avatar sweep | Client portal tables, `ProductLineItemsList` supplier, catalog detail creator rows |
| Product detail | Sales stat icons; creator link/copy; client warehouse plain text; recent orders SSR+numbered UI; reviews badge |
| Back buttons | Detail footer Back → `glassDetailBackButtonClass` on all detail + admin embed pages |
| Warehouse status | `StockAllocation.warehouse.status` SSR/API; `ActiveInactiveBadge` on product detail rows |
| Catalog cache | `portal:client:catalog:v2:` Redis key + `cached.meta` guard |
| Parties card | `PartiesRolesCard` uses `AvatarInlineLink`; optional `PartyPerson.href` |

**No TanStack/invalidation changes** — UI/CSS + read-only SSR enrichment only.

## Badge nesting hydration (REQ-0078)

| Piece | Location |
|-------|----------|
| SectionTitleRow | `lib/ui/section-title-row.tsx` — title + trailing Badge as siblings (never inside p/h3) |
| Fixed surfaces | `ClientPortalPage` catalog subsections; `ProductReviewsSection`; `ProductDetailPage` warehouse/recent orders |

**No TanStack/invalidation changes** — presentational HTML fix only.

## Client UI polish (REQ-0079)

| Piece | Location |
|-------|----------|
| SectionCountBadge | `components/shared/SectionCountBadge.tsx` — glass glow counter (light + dark) |
| ListIndexBadge | `components/shared/ListIndexBadge.tsx` — numbered circle for recent-order rows |
| Detail spacing | `shell-layout-styles.ts` — `APP_SHELL_DETAIL_CLASS` gap-6; `DETAIL_PAGE_HEADER_SPACING_CLASS` pb-0 |
| Client portal | `ClientPortalPage` — font-normal AvatarInlineLink; glass catalog count badges |
| Client browse | `ClientProductList`, `ProductTableColumns`, `ProductOwnerSelect`, `SupplierFilter` |
| Product detail | warehouse glass badges; recent orders index + inline owner/buyer |
| StatisticsCard | sub-badges use neutral gray `Badge` (REQ-0080 revert) |

**No TanStack/invalidation changes** — CSS/UI only.

## Stat badge revert + gap closure (REQ-0080)

| Piece | Location |
|-------|----------|
| Stat sub-badges | `StatisticsCard.tsx` — neutral gray `Badge`; not `SectionCountBadge` |
| Section counters | `SectionCountBadge.tsx` — slate default; section-title numeric counters only |
| Hue cleanup | `ClientPortalPage`, `ProductDetailPage`, `ProductReviewsSection` — drop `countHue` overrides |
| List headers | 10 `*List.tsx` — remove redundant `className="pb-6"` on `PageSectionHeader` |
| Padding revert | `order-detail-primitives`, `OrderTrackingInfo`, `analytics-card`, detail/admin GlassCard — `p-4 sm:p-5` |
| Scope revert | `BusinessInsightPage.tsx` — prettier-only diff reverted |

**No TanStack/invalidation changes** — CSS/UI only.

## Client owner picker + category detail (REQ-0081)

| Piece | Location |
|-------|----------|
| Owner picker | `ProductOwnerSelect.tsx` — stacked name/email; `OwnerPickerRow`; trigger `h-auto min-h-10` |
| Category SSR | `category-detail-data.ts` — owner/supplier/placedBy enrichment; `categoryInsights`; admin `categoryForecast` |
| Category UI | `CategoryDetailPage.tsx` — DetailInfoRow stats; SectionTitleRow; charts; ProductDetail recent-order parity |
| Tests | `lib/server/category-detail-data.test.ts` |

**No TanStack invalidation registry changes** — read-only SSR enrichment + CSS/UI.

## Category gap closure + forecast perf (REQ-0082)

| Piece | Location |
|-------|----------|
| UI parity | `CategoryDetailPage` — CopyableText h1; info card `h-9 w-9` header; `ChartBarLabel` on sales chart |
| Forecast rollup | `lib/forecasting/category-forecast-rollup.ts` — client-safe `buildCategoryForecastRollup` |
| Cache-read SSR | `getCachedForecastingSummary` in `forecasting-data.ts` — no generate on category path |
| Client fallback | `useForecastingSummary({ enabled: isAdminRole })` + admin page cache-read prefetch |

**Invalidation unchanged** — `invalidateAllRelatedQueries` clears forecasting query on CRUD.

## Category forecast loading shell (REQ-0083)

| Piece | Location |
|-------|----------|
| Urgent table shell | `CategoryDetailPage` — `TableBodyPulseRows` while `forecastLoading` (REQ-0021 parity with `ForecastingSection`) |
| Rollup comment | `category-forecast-rollup.ts` — client-only; no server embed since REQ-0082 |
| Admin SSR prefetch | `app/categories/[id]/page.tsx` — parallel `getCachedForecastingSummary` for admin role |

**No TanStack/invalidation changes** — UI shell + cache-read SSR only.

## Detail insights parity (REQ-0084)

| Piece | Location |
|-------|----------|
| Shared insights | `lib/server/catalog-insights.ts`, `product-insights.ts`; warehouse compute in `lib/insights/warehouse-insights-compute.ts` |
| Shared UI | `CatalogInsightsSection.tsx`, `WarehouseInsightsSection.tsx` |
| Forecast SSR sync | `useSyncSsrQueryData(queryKeys.forecasting.summary())` on all forecast detail pages |
| Admin prefetch | 6 detail routes parallel `getCachedForecastingSummary` |
| Warehouse admin stock | `getStockByWarehouseForPage(session, id)` — admin scope fix |

**Invalidation unchanged** — `forecasting.all` on CRUD via `invalidateAllRelatedQueries`.

## Insights lib hygiene (REQ-0085)

| Piece | Location |
|-------|----------|
| Constants | `lib/insights/constants.ts` — `CATALOG_LOW_STOCK_THRESHOLD` |
| Warehouse compute | `lib/insights/warehouse-insights-compute.ts` — client-safe `computeWarehouseInsights` |
| Product enrich | `lib/insights/product-insights-enrich.ts` — `enrichProductInsightsWithWarehouseStock` |
| Supplier h1 | `SupplierDetailPage` — `CopyableText` + loading pulse on title |
| Product pie SSR | `app/products/[id]/page.tsx` + admin variant — enrich after parallel stock prefetch |

**No TanStack/invalidation changes** — shared pure helpers; stock CRUD still via `invalidateAfterStockChange`.

## Detail list UI parity (REQ-0086)

| Piece | Location |
|-------|----------|
| Types | `types/catalog-detail-lists.ts` |
| Shared lists | `CatalogDetailProductGrid`, `CatalogDetailRecentOrdersList` |
| Party SSR | `lib/server/catalog-party-snapshot.ts`; supplier-detail-data owner/buyer enrich |
| Pages | CategoryDetailPage + SupplierDetailPage refactored to shared components |

**No invalidation changes** — UI + supplier SSR enrichment only.

## List loading DRY (REQ-0087)

| Piece | Location |
|-------|----------|
| Fix | CategoryDetailPage + SupplierDetailPage pass `loading={dataLoading}` to catalog list components |

**No invalidation changes** — removes duplicate parent `DataSlotPulse` wrappers.

## Demo seed (REQ-0088 / REQ-0091 / REQ-0092)

| Piece | Location |
|-------|----------|
| Users | `lib/auth/demo-seed-users.ts` — email, username, role, robohash `image` |
| Fixtures | `lib/auth/demo-seed-data.ts` — emailPreferences, Test Supplier description/notes; `DEMO_CATALOG_SEED` opt-in only |
| Accounts seed | `scripts/lib/seed-demo-accounts.ts` — `seedDemoAccountsOnly` (reset) + `upsertDemoUserProfile` / `ensureTestSupplierEntity` (legacy) |
| Reset | `scripts/reset-demo-db.ts` — wipe + 3 users + Test Supplier entity only (empty catalog) |
| Opt-in catalog | `scripts/lib/seed-demo-catalog.ts` — manual / future; not run by default reset |
| Verify | `scripts/verify-demo-accounts.ts` — profile completeness + catalog counts (0 expected) |
| Legacy | `create-demo-accounts.ts` — incremental create/backfill; no catalog seed |

**Entity name:** global supplier entity `"Test Supplier"` (`isGlobalDemo` keyed on test@supplier.com userId). Legacy `"Demo Supplier"` backfilled by `create-demo-accounts.ts` (REQ-0091).

**No TanStack/invalidation changes** — seed scripts only.

## Catalog audit user links (REQ-0089)

| Piece | Location |
|-------|----------|
| Helper | `lib/navigation/audit-user-href.ts` — admin → `/admin/user-management/{id}`; client/supplier → no link |
| Pages | Supplier/Category info Created by + Updated by; Product Updated by + CopyableText email |

**Keep** `ownerProductsHref` on product owner rows and product-grid owner links.

**No invalidation changes** — UI routing only.

## Warehouse pie unallocated (REQ-0090)

| Piece | Location |
|-------|----------|
| Aggregate | `warehouse-stock-aggregate.ts` — `aggregateWarehouseStockWithUnallocated`, `unallocated` on insights |
| Chart | `catalog-insights-chart-data.ts` — Unallocated slice; `buildWarehouseStockChartDescription` |
| UI | ProductDetailPage + `CatalogInsightsSection.stockChartTrailing` badges |

**No invalidation changes** — client enrich from existing `useStockByProduct` after stock CRUD.

## Supplier UI + gap closure (REQ-0075 / REQ-0076)

| Piece | Location |
|-------|----------|
| Warehouse SSR | `product-stock-data.ts` — warehouse lookup by product owner `userId`; test `product-stock-data.test.ts` |
| Supplier invoices | `getInvoicesForSupplierId`; `app/invoices/page.tsx` + API GET; test `invoices-data.test.ts` |
| Invoice gating | `InvoiceDetailPage` — `disableInvoiceMutations` + supplier Pay hidden (`!isSupplierRole`) |
| Static headers | `ApiStatusPage`, `ApiDocsPage` — `PageSectionHeader` + inner `SectionCardHeader` |
| Admin embeds | review/ticket/user/history/order — `GlassCard` + `DetailInfoRow` + `ClientDateTime` |
| Dead SSR | supplier `/invoices` — no `prefetchListPageStats` |

**No TanStack/Redis/invalidation changes** — UI/CSS + one SSR trim + unit tests only.

## Pre-commit audit (2026-07-14)

| Check | Status |
|-------|--------|
| `npm run lint` | pass |
| `npm run build` | pass |
| `npm run test` | 488 passed |
| `npm run test:invalidate` | 208 passed |
| Prod SHA | `8de1827` (REQ-0106–0113) pushed `origin/main` |
| REQ-0106–0113 | order stock UX + reactive validation + props-only warehouse select |

## Instant UI (REQ-0122–0125)

| Piece | Location |
|-------|----------|
| Patch helpers | `lib/react-query/patch-mutation-cache.ts` — includes `patchDetailCacheMerge` (optimistic) |
| Order | **patch detail/list → then invalidate** (never invalidate-only on visible rows) |
| Pulse | `isDataSlotLoading` (cold + patched rows) · `isDataSlotUnsettled` (dashboard stat cards / stale refetch) |
| Admin list stats | `prefetchListPageStats` in `page.tsx` + `useDashboard` — support tickets, user management (REQ-0125) |
| SSR back | `resolveSsrSyncAction` skips when `cached.updatedAt >= server` |
| Domains | catalog, order graph, portal browse, tickets/reviews/users; stock allocate/delete |
| Dashboard KPIs | pulse-only (no client count patch) · stock transfer invalidate-only |

**Rule:** Patched rows show correct data immediately; pulse only unpatchable aggregates.

## Order/invoice UI sweep (REQ-0126)

| Piece | Location |
|-------|----------|
| Warehouse avail | `formatWarehouseAvailLabel` → `OrderLineWarehouseSelect` trigger + items |
| Date fields | `DialogDateField` + `DIALOG_DATE_CALENDAR_ICON_CLASS` — OrderDialog edit, InvoiceDialog edit |
| Table meta | `compactInvoiceMeta` — invoice list; order table drops duplicate status/Items/Date |
| Detail layout | `InvoiceDetailFactsGrid`; parties + summary `lg:grid-cols-2`; sky header back |
| Payment checkout | `PaymentDialog` — subtotal, fee icons, `ProductThumb` line items |

**No TanStack/SSR/invalidation changes** — CSS/UI/layout only.

## Detail & table UI parity (REQ-0127)

| Piece | Location |
|-------|----------|
| Person rows | `PersonInlineRow.tsx` — sky name · muted email; `AuditUserDetailRow`, `PartiesRolesCard` |
| Stats inline | `CategoryDetailPage`, `SupplierDetailPage` — inventory value baseline like Product |
| Product table | `ProductTableColumns` — QR in Stock column; merged Created/Expire; no QR column |
| Urgent forecast | `UrgentReorderForecastTable` — ProductThumb + `ForecastUrgencyBadge`; Catalog + Warehouse insights |
| Recent orders | `CatalogDetailRecentOrdersList` — status below price + `statusAt`; Product detail `hideProductMeta` |
| Status date SSR | `order-status-display-date.ts`, `catalog-detail-order-select.ts` — category/supplier/product detail |
| Warehouse stock | Product detail allocation rows — icon tile, type badge, MapPin address subtitle |
| Address row | `WarehouseDetailPage` — always visible (`—` when empty) |

**No TanStack/invalidation changes** — CSS/UI + read-only SSR enrichment only.

## REQ-0127 gap closure (REQ-0128)

| Piece | Location |
|-------|----------|
| Dead code | Removed `getProductById` from `prisma/product.ts` |
| Status date SSR | `orderStatusAtSelect` + `withOrderStatusAt` — portal + dashboard SSR |
| Shared column | `RecentOrderStatusColumn` — catalog detail + 5 portal/analytics UIs |
| Warehouse icons | `warehouse-type-styles.ts` — `getWarehouseTypeIcon`; ProductDetailPage stock rows |

**No TanStack/invalidation changes** — read-only SSR + UI DRY only.

## Post-mutation cache (REQ-0052 + REQ-0055)

| Piece | Location |
|-------|----------|
| Sync invalidation | `lib/cache/post-mutation.ts` — `scheduleInvalidate*Caches()` are `async` functions; API routes `await` them **before** response |
| API writes | 32 routes — `await scheduleInvalidate*()` before `NextResponse.json()` eliminates Redis race condition |
| Deferred (exceptions) | `scheduleAfterResponse()` (ImageKit, email) and `scheduleInvalidateAllServerCaches()` still use `after()` |
| Product hard-delete | Redis cleared sync; ImageKit cleanup deferred via `scheduleAfterResponse` |
| Vercel safety | `vercel.json` `maxDuration: 60` on `app/api/**/route.ts` |
| Client sync | TanStack `invalidateAllRelatedQueries` unchanged — immediate UI |
| Stripe back-button | `window.location.replace(url)` in `use-payments.ts` — Stripe URL not added to browser history |

**Race condition fixed (REQ-0055):** TanStack refetch now always hits a clean Redis cache because the SCAN completes before the 200/201 response is sent. Scoped patterns (3–12 per domain) complete in < 200 ms — no 504 risk.

## Admin portal UI parity (REQ-0098)

| Piece | Location |
|-------|----------|
| Semantic badges | `lib/ui/semantic-badges.tsx` — `AdminOrderSourceBadge`, `ForecastUrgencyBadge`, `StockQuantityLeftBadge`, `InventoryHealthBadge`, `NotificationNewBadge` |
| Api inner padding | `ApiStatusPage`, `ApiDocsPage` — `GlassCardBody` |
| QR column | `qr-code-hover.tsx` truncate; `ProductTableColumns` product name title |
| Business insights | `BusinessInsightPage` — `PageSectionHeader`; glow badges; AI spinner + icons |
| Dashboard overall | `AdminAnalyticsContent` — `gap-6`, bottom `GLASS_ACTION_BUTTON` CTAs, centered empty, AI glass button |
| Admin portals | `AdminClientPortalContent`, `AdminSupplierPortalContent` — `SectionCountBadge`, `AvatarInlineLink`, portal SSR `image` |
| Activity history | `ActivityLogSection` — `SectionCardHeader` + `ScrollText`; `AdminHistoryContent` `gap-6` |
| Notifications | `NotificationDropdown` — total/unread counters, inline New badge, full-width Close |

**No TanStack/invalidation changes** — UI/CSS + read-only portal SSR image fields.

## Post-REQ-0098 gaps (REQ-0099)

| Piece | Location |
|-------|----------|
| Analytics section rhythm | `AdminAnalyticsContent.tsx` — Order/Invoice/Warehouse `flex flex-col gap-6` |
| Supplier avatar seed | `SupplierPortalSupplier.userId` SSR + `AvatarInlineLink seed={userId ?? id}` (REQ-0100 stale-cache fallback) |
| Dead scripts | Removed `fix-product2-stock`, `backfill-order-stock`, `check-order-product-stock` + npm entries |

**No TanStack/invalidation changes** — spacing/types/script cleanup + UI seed fallback only.

## Supplier portal avatar fallback (REQ-0100)

| Piece | Location |
|-------|----------|
| Seed fallback | `AdminSupplierPortalContent.tsx` — `seed={s.userId ?? s.id}` when stale Redis omits `userId` |
| SSR | `supplier-portal-data.ts` — fresh rows always include `userId` + User `image` |
| Cache | No `supplierPortal` key bump — TTL/invalidation refreshes; ~5 min post-deploy drift acceptable |

**No TanStack/invalidation changes** — 1-line UI guard only.

## Stock allocation sync (REQ-0102)

| Piece | Location |
|-------|----------|
| Reconcile lib | `catalog-quantity-reconcile.ts` — reserved floor + greedy unreserved shrink |
| Apply transaction | `apply-catalog-quantity-reconcile.ts` — product PUT + row decrements |
| Enrich (single entry) | `enrichStockAllocationRows` — API GET + product/warehouse SSR; `enrichWarehouseAllocationRows` alias |
| Totals copy | `catalog-allocation-copy.ts` — `formatCatalogAllocationSummary` |
| Validation | `validate-allocation-quantity.ts` — POST/PUT budget cap |
| Update hook | `useUpdateStockAllocation` — AllocateStockDialog edit via PUT `[id]` |
| Delete guards | `warehouse-delete-guards.ts` — reserved / active orders / pending transfers |
| Product PUT | `app/api/products/route.ts` — reconcile + `scheduleInvalidateStockAllocationCaches` |
| UI | ProductFormDialog shrink confirm; WarehouseStockAllocationRow archived badge + catalog meta |
| Fetch gates | ProductFormDialog, AllocateStockDialog — `useStockByProduct({ enabled })`; order lines via `useOrderLineStockValidation` |

**Invalidation:** `invalidateAfterStockChange` on allocation/product qty mutations; Redis awaited before API 200; `useSyncSsrQueryData` on detail pages.

## Disjoint order reservation (REQ-0103)

| Piece | Location |
|-------|----------|
| Core helper | `lib/products/order-stock-reservation.ts` — disjoint reserve/release/fulfill |
| Order paths | `prisma/order.ts` create + status + cancelOrder |
| Paid paths | `app/api/payments/webhook/route.ts`, `app/api/invoices/[id]/route.ts` |
| List enrich | `enrich-product-committed-quantity.ts` — `committedQuantity` on GET products/browse/home |
| Display UI | `ProductTableColumns`, `ProductDetailPage`, `CatalogDetailProductGrid` — `getDisplayCommittedQuantity` |
| Manual test | `docs/MANUAL_TEST_FIXTURES.md` §9 — reset DB if stale double-reservation |

**Invalidation unchanged** — order mutations already invalidate products + stockAllocation patterns.

## committedQuantity parity (REQ-0104)

| Piece | Location |
|-------|----------|
| Detail SSR | `category-detail-data.ts`, `supplier-detail-data.ts` — enrich + cache guard |
| Forecast UI | `forecasting-card.tsx` — `getDisplayCommittedQuantity` |
| Forecast API | `demand-forecast.ts` — `batchSumAllocationReserved` + `computeCommittedQuantity` |
| Supplier portal | `supplier-dashboard.ts` — same committed avail math |

**No invalidation changes** — order graph already clears `categories:*`, `suppliers:*`, `forecasting:*`.

## Product detail committedQuantity SSR (REQ-0105)

| Piece | Location |
|-------|----------|
| Single enrich | `enrich-product-committed-quantity.ts` — `enrichProductDetailWithCommittedQuantity` |
| Detail SSR/API | `product-detail-data.ts` — enrich after transform; Redis cache guard requires `committedQuantity` |
| GET route | `app/api/products/[id]/route.ts` — via `getProductDetailForPage` |
| Display UI | `ProductDetailPage` — `getDisplayCommittedQuantity`; warehouse fallback if TanStack lags stock |

**ProductFormDialog:** uses raw `reservedQuantity` + allocation rows — do not merge `committedQuantity` into API `reservedQuantity`.

**No invalidation changes** — `PRODUCT_PATTERNS` already clears `products:*` on order/stock CRUD.

## Order stock UX (REQ-0106–0113)

| Piece | Location |
|-------|----------|
| Auto-assign + cap | `prisma/order.ts` greedy pick; `getOrderLineCatalogAvailable` catalog cap |
| Reactive lines | `useOrderLineStockValidation` — one `useStockByProduct` per line; `prefetchStockByProduct` on product pick |
| Line UI | `OrderDialogCreateLineItem` + `OrderLineWarehouseSelect` props-only (`allocationRows`, `allocationsLoading`) |
| Pick/validate | `buildOrderLineWarehousePickOptions`, `ensureStockAllocationsAndValidate`; `Max {n} at {name}` client+server |
| Errors | `lineStockErrors` keyed by `field.id`; `getAllocationQtyBounds` DRY |
| Product UX | `formatCatalogAllocationSummary` on detail; `useCatalogQuantityReconcilePreview`; dialog edge-scroll shells |
| Types | `OrderFormData` in `OrderDialogCreateLineItem.tsx` (`.types.ts` removed) |
| Tests | `order-line-stock-validation.test.ts`; Beats §9 `MANUAL_TEST_FIXTURES.md` |

**Invalidation unchanged** — `invalidateAfterOrderGraphChange` + `invalidateAfterStockChange`.

## Stock UX + dialog/UI closure (REQ-0114–0116, 2026-07-14)

| REQ | Summary | Key files |
|-----|---------|-----------|
| 0114 | Catalog-commit hints; `committedQuantity` enrich; proportional line amounts; `DialogFormLabel`/`DetailInfoRowGroup`; warehouse insights DRY | `catalog-allocation-copy.ts`, `proportional-line-amount.ts`, `ProductLineItemsList`, `WarehouseDetailPage` |
| 0115 | `mapWarehouseStockSummary` + test; remaining dialog label/footer sweep | `warehouse-insights-compute.ts`, `InvoiceDialog`, `OrderDialog`, `SupportTicketDialog`, `PaymentDialog` |
| 0116 | `ProportionalPriceDisplay` DRY; final dialog gaps; `DETAIL_DATA_VALUE_CLASS` detail typography | `ProportionalPriceDisplay.tsx`, `typography-scale.ts`, `OrderDialogCreateLineItem` |

Gates: lint ✓ test **498** ✓ invalidate **208** ✓ build ✓. **No invalidation/SSR/API changes** — display + CSS only. Manual QA: `docs/MANUAL_TEST_FIXTURES.md` §9.

## Dialog UX parity + admin embed tables (REQ-0117, 2026-07-14)

| Piece | Location |
|-------|----------|
| Flex-safe labels | `dialog-form-label.tsx` + `DIALOG_FORM_LABEL_ROW` in `dialog-edge-scroll.ts` — `wrapperClassName` for spacing; consumer `block` cannot kill flex |
| Select tokens | `DIALOG_SELECT_CONTENT_CLASS` / `DIALOG_SELECT_ITEM_CLASS` — readable popover in light+dark |
| Date field | `DialogDateField.tsx` — single trailing calendar icon |
| Dialog headers | `DialogHeaderBrand.tsx` — icon tile + title + subtitle |
| Order totals empty | `OrderDialog.tsx` — hide fees when no valid lines; `Package` empty state; Receipt/Percent/Truck/Tag row icons |
| Invoice picker | `OrderPickerCommand.tsx` — `w-[var(--radix-popover-trigger-width)]` |
| Admin tables | `AdminEmbedDataTable.tsx` — Client/Supplier portal + My Activity Recent Orders |
| Network audit | VS-045 in `VALIDATION_SUMMARY.md` — defer prefetch cuts to REQ-0118 |

**No TanStack/invalidation changes** — CSS/UI + read-only audit doc only.

## Readable popover full sweep (REQ-0118, 2026-07-14)

| Piece | Location |
|-------|----------|
| Token hub | `lib/ui/popover-readability-styles.ts` — `READABLE_POPOVER_*`, `filterCommandPopoverClass`, `paginationPopoverContentClass` |
| Dialog gaps | `PaymentDialog` `DialogHeaderBrand`; `OrderDialogCreateLineItem`; Allocate/Transfer; CreateUser; Shipping; `LoginRoleSelect` |
| List filters | 15 `*Filter.tsx` + `ProductOwnerSelect` + `pagination-select-styles.ts` + `FilterCommandCheckboxItem` |
| Prod network | VS-046 — timings OK; defer prefetch trim unless HAR duplicate |

**No TanStack/invalidation/SSR/API changes** — CSS-only sweep.

## REQ-0119 gap closure (2026-07-14)

| Piece | Location |
|-------|----------|
| Catalog popovers | `catalog-filter-tokens.ts` → `catalogEntityPopoverContentClass` / `exportMenuPopoverContentClass` (`cyan` hue added) |
| Order address | `DIALOG_FORM_SUB_LABEL` + `OrderAddressFields.tsx` on OrderDialog create |
| Warehouse rollup | `business-insights-warehouse-rollup.ts` + test; `BusinessInsightsWarehouseSection.tsx`; SSR `getWarehouseStockSummary` in `app/business-insights/page.tsx`; Warehouses sidebar tab |

**Invalidation unchanged** — `stockAllocation.all` already cleared on stock CRUD; `useSyncSsrQueryData` on summary key.

## Hydration-safe dates

- `lib/format/` — stable (`format-stable`) + client (`client-locale`) barrel
- `components/shared/ClientFormatDisplay.tsx` — `ClientCurrency`, `ClientCompactDateTime` (REQ-0020)
- `components/shared/ClientDateDisplay.tsx` — `ClientRelativeTime`, `ClientDateTime`, `ClientDate`
- `hooks/use-mounted.ts` — `useSyncExternalStore` client gate
- Use on detail pages + `NotificationDropdown`; avoid `formatDistanceToNow` / `toLocaleDateString` in client components that SSR

## Agent rules

- Minimize scope; match existing patterns; strict TypeScript
- Do not delete working code without reason
- Sentry DSN never hardcoded — use env only
- No `.md` summary files unless user asks; update this file + walkthrough when architecture changes
