# Build Manifest — Cycle C1

**Cycle:** C1 | **Risk:** R2 | **Stack:** Next.js 16 / Prisma / MongoDB

## Artifacts (selected)

| ART-ID | REQ-ID | Location | Notes |
|--------|--------|----------|-------|
| ART-0001 | REQ-0001 | `hooks/use-deferred-radix-select.ts` | Defer Radix Select mount |
| ART-0002 | REQ-0001 | `components/shared/DeferredSelectGate.tsx` | Reusable gate |
| ART-0003 | REQ-0001 | `components/shared/PaginationSelector.tsx` | Table page-size |
| ART-0004 | REQ-0001 | `components/orders/OrderDialog.tsx` | Dialog Select gates |
| ART-0005 | REQ-0001 | `components/products/ProductFormDialog.tsx` | Dialog Select gates |
| ART-0006 | REQ-0001 | `components/invoices/InvoiceDialog.tsx` | Dialog Select gates |
| ART-0007 | REQ-0002 | `lib/ai/openrouter.ts` | OpenRouter client |
| ART-0008 | REQ-0005, REQ-0018 | `lib/ai/groq.ts` | Groq chain + resolveGroqModel + failover |
| ART-0009 | REQ-0005 | `lib/ai/create-chat-completion.ts` | Orchestrator |
| ART-0010 | REQ-0005 | `lib/ai/types.ts` | Shared LLM types |
| ART-0011 | REQ-0002, REQ-0005 | `app/api/ai/insights/route.ts` | Insights API |
| ART-0012 | REQ-0005 | `app/api/forecasting/route.ts` | Forecasting AI helper |
| ART-0013 | REQ-0003 | `lib/auth/unique-username.ts` | OAuth username |
| ART-0014 | REQ-0003 | `app/api/auth/oauth/google/callback/route.ts` | P2002 recovery |
| ART-0015 | REQ-0004 | `app/page.tsx` | SSR home, no Suspense |
| ART-0016 | REQ-0007 | `components/shared/NotificationBell.tsx` | DropdownMenu portal |
| ART-0017 | REQ-0007 | `components/shared/NotificationDropdown.tsx` | Panel content |
| ART-0018 | REQ-0007 | `components/layouts/Navbar.tsx` | overflow fix |
| ART-0019 | REQ-0008 | `.agile-v/*` | Agile V state |
| ART-0020 | REQ-0008 | `.cursor/rules/agile-v-core.mdc` | Cursor rule |
| ART-0021 | REQ-0010 | `lib/validations/product.ts` | Product body schemas |
| ART-0022 | REQ-0010 | `app/api/products/route.ts` | POST/PUT safeParse |
| ART-0023 | REQ-0011 | `lib/logger.ts`, `lib/api/errors.ts` | 4xx Sentry guard |
| ART-0024 | REQ-0011 | `lib/api/response-helpers.ts` | warn on 4xx |
| ART-0025 | REQ-0012 | `lib/validations/{category,supplier,warehouse}.ts` | Catalog schemas |
| ART-0026 | REQ-0012 | `docs/SENTRY_ERRORS.md` | Audit doc tracked |
| ART-0027 | REQ-0013 | `lib/validations/{payment,shipping,notification,system-config,ai}.ts` | API Zod sweep |
| ART-0028 | REQ-0013 | `app/api/{payments,shipping,notifications,auth,ai}/*` | safeParse routes |
| ART-0029 | REQ-0018 | `docs/LLM_MODEL_SELECTION.md` | Stock-inventory Groq chain section |
| ART-0030 | REQ-0019 | `lib/ai/constants.ts` | LLM_INSIGHTS_MAX_TOKENS |
| ART-0031 | REQ-0019 | `lib/date/format-stable.ts` | Stable currency + UTC datetime |
| ART-0033 | REQ-0020 | `lib/format/client-locale.ts` | Browser Intl formatters |
| ART-0034 | REQ-0020 | `components/shared/ClientFormatDisplay.tsx` | ClientCurrency + ClientCompactDateTime |
| ART-0035 | REQ-0021 | `components/shared/DataSlotPulse.tsx` | Inline value pulse |
| ART-0036 | REQ-0021 | `lib/react-query/is-data-slot-loading.ts` | Loading predicate |
| ART-0037 | REQ-0021 | `components/ui/table-data-skeleton.tsx` | TableBodyPulseRows |
| ART-0038 | REQ-0021 | `app/**/page.tsx` (tier 1+2) | Suspense shell + streamed data |
| ART-0039 | REQ-0021 | `hooks/queries/*` | initialData on list/dashboard hooks |
| ART-0040 | REQ-0022 | `components/Pages/OrderDetailPage.tsx` | Shell-first detail; DataSlotPulse |
| ART-0041 | REQ-0022 | `components/Pages/InvoiceDetailPage.tsx` | Shell-first detail; embedInAdmin preserved |
| ART-0042 | REQ-0022 | `components/home/index.ts` | Removed dead StatisticsCardSkeleton export |
| ART-0043 | REQ-0023 | `components/admin/AdminHistoryDetailContent.tsx` | Shell-first + DataSlotPulse |
| ART-0044 | REQ-0023 | `components/admin/AdminProductReviewDetailContent.tsx` | Shell-first + status/rating pulse |
| ART-0045 | REQ-0023 | `components/admin/AdminSupportTicketDetailContent.tsx` | Ticket shell; replies pulse independently |
| ART-0046 | REQ-0023 | `components/admin/AdminUserManagementDetailContent.tsx` | Shell-first profile + overview metrics |
| ART-0047 | REQ-0023 | `components/admin/AdminOrderDetailContent.tsx` | Mirror OrderDetailPage pulse map + admin controls |
| ART-0048 | REQ-0024 | `lib/server/system-config-data.ts`, `app/admin/settings/page.tsx` | Admin settings SSR shell-first |
| ART-0049 | REQ-0024 | `lib/orders/transform-order-detail.ts`, `lib/invoices/transform-invoice-detail.ts` | Shared detail transforms |
| ART-0050 | REQ-0024 | `lib/server/*-detail-data.ts` (10 helpers) | Role-scoped SSR prefetch |
| ART-0051 | REQ-0024 | `app/**/[id]/page.tsx` (18 routes) | Suspense + initial* props |
| ART-0052 | REQ-0024 | `components/orders/detail/*` | Shared order detail sections |
| ART-0053 | REQ-0026 | `lib/server/{warehouse-stock,product-reviews-detail,order-review-context,client-catalog,client-browse}-data.ts` | P3 SSR server helpers |
| ART-0054 | REQ-0026 | `OrderList.tsx`, `InvoiceList.tsx`, `ProductList.tsx` | Ghost fetch `enabled` gates |
| ART-0055 | REQ-0026 | `ClientProductList.tsx`, `app/products/page.tsx`, `app/client/page.tsx` | Client browse/catalog SSR |
| ART-0056 | REQ-0026 | `RouteWarmPrefetch.tsx`, `warm-route-prefetch.ts` | Deferred warm prefetch + client keys |
| ART-0057 | REQ-0026 | `use-notifications.ts`, `NotificationBell.tsx` | Notification refetch tuning |
| ART-0058 | REQ-0026 | `components/products/ProductOwnerSelect.tsx` | Searchable owner picker |
| ART-0059 | REQ-0026 | `getProductOwnerAdminsForBrowse` in `client-browse-data.ts` | Owners-with-products filter |
| ART-0060 | REQ-0026 | `components/ui/deferred-chart-section.tsx` | Portal chart mount gate |
| ART-0061 | REQ-0027 | `lib/navigation/shallow-search-param.ts` | Shallow ?ownerId= without RSC |
| ART-0062 | REQ-0027 | `warmAdminClientPortalLists` in `warm-route-prefetch.ts` | Deferred admin client-list warm |
| ART-0063 | REQ-0029 | `lib/server/catalog-entity-access.ts` | Supplier category/supplier access gates |
| ART-0064 | REQ-0029 | `lib/server/category-detail-data.ts`, `lib/server/supplier-detail-data.ts` | Supplier read-only detail branches |
| ART-0065 | REQ-0029 | `lib/cache/cache-utils.ts` | Role-scoped detail cache keys |
| ART-0066 | REQ-0029 | `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx` | disableCrud for supplier + client |

## Tests

| TC-ID | REQ-ID | Location |
|-------|--------|----------|
| TC-0001 | REQ-0002 | `lib/ai/openrouter.test.ts` |
| TC-0002 | REQ-0005 | `lib/ai/groq.test.ts` |
| TC-0003 | REQ-0005 | `lib/ai/create-chat-completion.test.ts` |
| TC-0004 | REQ-0003 | `lib/auth/unique-username.test.ts` |
| TC-0005 | REQ-0010 | `lib/validations/product-api.test.ts` |
| TC-0006 | REQ-0011 | `lib/logger.test.ts`, `lib/api/errors.test.ts` |
| TC-0007 | REQ-0012 | `lib/validations/{category,supplier,warehouse}-api.test.ts` |
| TC-0008 | REQ-0013 | `lib/validations/{payment,shipping,notification,system-config,ai,auth}-api.test.ts` |
| TC-0009 | REQ-0019 | `lib/date/format-stable.test.ts` |
| TC-0010 | REQ-0020 | `lib/format/client-locale.test.ts` |
| TC-0011 | REQ-0027 | `lib/server/client-browse-data.test.ts` |
| TC-0012 | REQ-0027 | `lib/navigation/shallow-search-param.test.ts` |
| TC-0013 | REQ-0029 | `lib/server/catalog-entity-access.test.ts` |
