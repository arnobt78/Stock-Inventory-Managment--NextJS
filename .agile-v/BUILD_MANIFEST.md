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
| ART-0067 | REQ-0028 | `lib/ui/glass-badge-styles.ts`, `lib/ui/semantic-badges.tsx` | GLASS_BADGE_CLASS + semantic maps |
| ART-0068 | REQ-0028 | `*StatusFilter.tsx`, `*PriorityFilter.tsx`, admin import/role filters | Colored glass filter dropdowns |
| ART-0069 | REQ-0028 | `lib/invoices/invoice-list-filters.ts`, `prisma/invoice.ts` | Store-scoped invoice list + payment pending→unpaid |
| ART-0070 | REQ-0028 | `globals.css`, `LoginPage.tsx`, `post-login-welcome.ts` | Scrollbar gutter + login persist |
| ART-0071 | REQ-0030 | `lib/auth/test-accounts.ts` | Demo role meta + credentials |
| ART-0072 | REQ-0030 | `components/auth/*` | AuthPageShell, AuthPromoCard, LoginRoleSelect, animations |
| ART-0073 | REQ-0030 | `components/ui/select.tsx` | Chevron group-data rotate |
| ART-0074 | REQ-0030 | `tailwind.config.ts`, `app/globals.css` | max-w-9xl token + auth-enter keyframes |
| ART-0075 | REQ-0031 | `lib/auth/auth-panel-copy.ts` | Login/register panel copy |
| ART-0076 | REQ-0031 | `components/auth/AuthBrandHeader.tsx`, `AuthInfoPanel.tsx` | List panel + navbar brand |
| ART-0077 | REQ-0032 | `components/auth/AuthFormCard.tsx`, `auth-glass-styles.ts` | Form glass blur-2xl + flat list |
| ART-0078 | REQ-0032 | `AuthPageShell.tsx`, `globals.css` | authBgFloat illustration animation |
| ART-0079 | REQ-0033 | `lib/auth/auth-panel-copy.ts` | Professional login intro copy |
| ART-0080 | REQ-0033 | `auth-glass-styles.ts`, `auth-list-styles.ts`, `AuthInfoListItem.tsx` | AUTH_LIST_ICON_GLASS glow pills |
| ART-0081 | REQ-0033 | `AuthPageShell.tsx`, `globals.css` | auth-page-root + scrollbar-gutter |
| ART-0082 | REQ-0033 | `AuthInfoPanel.tsx`, `AuthInfoListItem.tsx` | Tighter space-y-1 / py-2 spacing |
| ART-0083 | REQ-0034 | `app/layout.tsx`, `AuthSessionToasts.tsx`, `use-toast.ts` | Deferred welcome/goodbye toasts |
| ART-0084 | REQ-0035 | `oauth-success-url.ts`, `auth-welcome-toast.ts`, `AuthSessionToasts.tsx` | OAuth welcome toast on role destinations |
| ART-0085 | REQ-0036 | `lib/ui/shell-layout-styles.ts`, `Navbar.tsx`, `Footer.tsx` | APP_SHELL full bleed (SidebarLayout removed REQ-0069) |
| ART-0086 | REQ-0036 | list/detail page components | Remove max-w-9xl inner caps |
| ART-0087 | REQ-0036 | `tailwind.config.ts` | Remove unused 9xl token |
| ART-0088 | REQ-0036 | `shell-layout-styles.ts` | `APP_SHELL_DETAIL_CLASS` DRY on 6 detail pages |
| ART-0089 | REQ-0037 | `ProductStatusFilter.tsx` | ProductStockStatusBadge in filter dropdown |
| ART-0090 | REQ-0038 | `safe-image.tsx`, `safe-avatar-image.tsx` | next/image + native fallback |
| ART-0091 | REQ-0038 | 12 image consumer components | SafeImage / SafeAvatarImage migration |
| ART-0092 | REQ-0039 | `user-avatar-sources.ts` | Shared Google + robohash resolver |
| ART-0093 | REQ-0039 | `Navbar.tsx` | SafeAvatarImage (SidebarLayout removed REQ-0069) |
| ART-0094 | REQ-0039 | `next.config.ts`, `safe-avatar-image.tsx` | googleusercontent wildcard + referrerPolicy |
| ART-0095 | REQ-0040 | `user-avatar-sources.ts` | resolveAvatarSourcesFromSeed |
| ART-0096 | REQ-0040 | reviews + ticket reply components | DRY robohash via shared resolver |
| ART-0097 | REQ-0041 | `catalog-filter-tokens.ts`, shared filter/export components | CatalogActiveInactiveSelect, chips, export |
| ART-0098 | REQ-0041 | Category/Supplier/Warehouse/Product Filters | wire shared UI |
| ART-0099 | REQ-0042 | `CatalogActiveInactiveSelect.tsx` | div trigger label; placeholder inline |
| ART-0100 | REQ-0042 | `ExportMenuButton.tsx`, `OrderFilters.tsx`, `InvoiceFilters.tsx` | disabled prop; orders/invoices export |
| ART-0101 | REQ-0043 | `filter-chip-styles.ts`, `DismissibleFilterChips.tsx` | shared multi-group chip row |
| ART-0102 | REQ-0043 | Product/Order/Invoice/Review/Ticket/History/User Filters | chip row + Reset |
| ART-0103 | REQ-0044 | `typography-scale.ts` | PAGE/CARD/SUBTITLE/STAT tokens |
| ART-0104 | REQ-0044 | PageSectionHeader, SectionCardHeader, dialog, ~45 files | responsive typography sweep |
| ART-0105 | REQ-0045 | `filter-command-item.tsx` | whole-row cmdk filter toggle |
| ART-0106 | REQ-0045 | `*StatusFilter.tsx`, `filter-dropdown.tsx`, Category/Supplier/Import/User filters | migrate to FilterCommandCheckboxItem |
| ART-0107 | REQ-0045 | `InvoiceList.tsx`, `InvoiceTable.tsx`, `invoice-list-filters.ts` | client-side status filter; API search+scope only |
| ART-0108 | REQ-0045 | `shell-layout-styles.ts`, Home/MyActivity/Email/Analytics pages | header spacing + icons |
| ART-0109 | REQ-0046 | `catalog-filter-tokens.ts` | `CATALOG_TOOLBAR_TRIGGER_LAYOUT` shared filter+export |
| ART-0110 | REQ-0046 | `focus-ring-styles.ts`, `dialog-form-field.ts`, `filter-toolbar-styles.ts` | no-shift + hue focus rings |
| ART-0111 | REQ-0046 | `ui/input|select|textarea`, ~21 dialog/form files | central glass field tokens |
| ART-0112 | REQ-0047 | `glass-button-styles.ts`, `shared/index.ts` | primary/action/ghost + icon hover tokens |
| ART-0113 | REQ-0047 | PaymentDialog, ShippingManagement, ApiStatusPage, BusinessInsightPage, EmailPreferencesPage, SystemConfigSettings | Batch A glass buttons |
| ART-0114 | REQ-0047 | Category/Supplier/Order/Invoice/CreateUser/SupportTicket/Login/Register dialogs | Batch B submit/cancel pairs |
| ART-0115 | REQ-0048 | `auth-glass-styles.ts` | AUTH_FORM_FIELD_* + AUTH_GOOGLE_BUTTON light-mode |
| ART-0116 | REQ-0048 | `dialog-edge-scroll.ts`, Category/Supplier dialogs + columns | DIALOG_TABLE_* tokens; context dialog |
| ART-0117 | REQ-0048 | `ProductOptionRow.tsx`, `OrderDialog.tsx` | product Select thumbs + Package label |
| ART-0118 | REQ-0049 | `dialog-edge-scroll.ts`, column factories + Actions | dual-theme DIALOG_TABLE_*; slim dialog cols; link/action icons |
| ART-0119 | REQ-0049 | `glass-button-styles.ts` | SHELL_RESET + DISABLED; ACTION light opaque base |
| ART-0120 | REQ-0049 | Category/Supplier/Warehouse/ProductForm dialogs | submit validity gates |
| ART-0121 | REQ-0049 | EmailPrefs, SystemConfig, BusinessInsight, ApiStatus, CreateUser | glass CTA PRIMARY + ghost shell reset |
| ART-0122 | REQ-0049 | ProductImport, ProductReview dialogs | GLASS_GHOST_BUTTON cancel backlog |
| ART-0123 | REQ-0050 | `dialog-edge-scroll.ts` | `DIALOG_TABLE_SECTION_TITLE` |
| ART-0124 | REQ-0050 | ProductReview + WriteEditReview dialogs | amber submit shell-reset |
| ART-0125 | REQ-0050 | Order/Invoice/Payment/SupportTicket/Login/Register | Batch B `GLASS_BUTTON_SHELL_RESET` |
| ART-0126 | REQ-0050 | CategoryDialog, SupplierDialog | table section title token |
| ART-0127 | REQ-0052 | `lib/cache/post-mutation.ts` | `scheduleInvalidateAllServerCaches`, scoped schedules, `scheduleAfterResponse` |
| ART-0128 | REQ-0052 | `app/api/**/route.ts` (32 write routes) | non-blocking Redis invalidation via `after()` |
| ART-0129 | REQ-0052 | `app/api/products/route.ts` DELETE | DB-first hard delete; ImageKit deferred |
| ART-0130 | REQ-0052 | `vercel.json` | `maxDuration: 60` on API routes |
| ART-0131 | REQ-0052 | `lib/cache/post-mutation.test.ts` | unit tests for after() scheduling |
| ART-0127 | hotfix | `auth-glass-styles.ts`, Login/Register, page CTAs, `glass-button-styles.ts` | CTA gradient restore `73060a1` |
| ART-0132 | REQ-0055 | `lib/cache/post-mutation.ts`, all `app/api/**/route.ts` | sync await invalidation before response; fixes stale-UI race |
| ART-0133 | REQ-0055 | `hooks/queries/use-payments.ts` | `window.location.replace()` — Stripe URL not in history |
| ART-0134 | REQ-0055 | `components/Pages/OrderDetailPage.tsx` | remove `router.refresh()` on cancel |
| ART-0135 | REQ-0056 | `lib/auth/demo-seed-users.ts` | canonical `DEMO_SEED_USERS` + `DEMO_PASSWORD` |
| ART-0136 | REQ-0056 | `scripts/lib/delete-all-db-data.ts` | shared dependency-ordered Mongo wipe |
| ART-0137 | REQ-0056 | `scripts/reset-demo-db.ts` | one-command wipe + Redis clear + reseed |
| ART-0138 | REQ-0056 | `lib/auth/test-accounts.ts`, `create-demo-accounts.ts`, `delete-all-data.ts`, `verify-demo-accounts.ts`, `package.json` | derive from shared source; `script:reset-demo-db` |
| ART-0139 | REQ-0058 | `components/shared/CopyableText.tsx` | inline copy-to-clipboard icon (Check ~1.5s) |
| ART-0140 | REQ-0058 | order/invoice table columns, detail headers, portal lists, catalog recent-order cards | CopyableText drop-in points |
| ART-0141 | REQ-0059 | `components/products/ProductOptionRow.tsx` | `ProductThumb` extracted (SafeImage + Package fallback) |
| ART-0142 | REQ-0059 | `prisma/order.ts`, `lib/orders/transform-order-detail.ts`, `types/order.ts`, `app/api/orders/[id]/route.ts` | `imageUrl` on detail line items |
| ART-0143 | REQ-0059 | `app/api/stock-allocations/route.ts`, `lib/server/warehouse-stock-data.ts`, `types/stock-allocation.ts`, `WarehouseDetailPage.tsx` | allocation row thumbnails |
| ART-0144 | REQ-0060 | `components/invoices/OrderPickerCommand.tsx`, `components/invoices/InvoiceDialog.tsx` | searchable order picker + `initialOrderId` |
| ART-0145 | REQ-0061 | `lib/server/orders-data.ts`, `app/api/orders/route.ts` | `getInvoiceLinkMap` + `invoiceForOrder` on list rows |
| ART-0146 | REQ-0061 | `components/orders/{OrderActions,OrderTableColumns,OrderList}.tsx`, `OrderDetailPage.tsx`, `AdminOrderDetailContent.tsx` | situation-based invoice actions |
| ART-0147 | REQ-0062 | `components/invoices/InvoiceActions.tsx` | View/Cancel Order + role gating |
| ART-0148 | REQ-0063 | `lib/orders/map-order-items.ts` | shared Prisma→OrderItem mapper |
| ART-0149 | REQ-0063 | `lib/server/invoice-detail-data.ts`, `lib/invoices/transform-invoice-detail.ts`, `types/invoice.ts` | linkedOrderNumber + linkedOrderItems enrichment |
| ART-0150 | REQ-0063 | `components/shared/ProductLineItemsList.tsx` | shared line-item rows (order + invoice detail) |
| ART-0151 | REQ-0063 | `components/Pages/InvoiceDetailPage.tsx` | Order Items card + Related Order copy + admin href |
| ART-0152 | REQ-0063 | `components/shipping/{ShippingManagement,OrderTrackingInfo}.tsx` | CopyableText order#/tracking |
| ART-0153 | REQ-0064 | `types/order.ts`, `lib/ui/typography-scale.ts`, `PaymentDialog.tsx` | OrderItem ISO string; TYPO_BODY; copyable ref |
| ART-0154 | REQ-0051 | detail pages + `FloatingActionButtons.tsx` | Glass CTA backlog complete |
| ART-0155 | REQ-0065 | `components/admin/Admin*DetailContent.tsx` | Admin detail header/action parity |
| ART-0156 | REQ-0066 | `app/api/stock-transfers/route.ts`, `lib/products/decrement-stock-allocations.ts`, warehouse dialogs | Warehouse integration |
| ART-0157 | REQ-0067 | `app/api/ai/insights/route.ts` | Warehouse summary in AI payload |
| ART-0158 | REQ-0066 | `lib/products/plan-allocation-decrements.ts`, `stock-product-access.ts` | Avail-sync planner + role gates |
| ART-0159 | REQ-0066 | `lib/stock-allocation/stock-allocation-enrich.ts` | Shared product context API+SSR |
| ART-0160 | REQ-0066 | `components/shared/{DialogSubmitButton,StockQuantityField}.tsx` | Dialog submit + qty validation |
| ART-0161 | REQ-0066 | `lib/ui/fab-button-styles.ts`, `FloatingActionButtons.tsx` | FAB visible gradients |
| ART-0162 | REQ-0066 | `AllocateStockDialog`, `TransferStockDialog`, `WarehouseDetailPage` | Dialog shell + SSR stock sync + stock card |
| ART-0163 | REQ-0069 | `hooks/use-sync-ssr-query-data.ts`, `lib/react-query/index.ts` | SSR→TanStack sync hooks |
| ART-0164 | REQ-0069 | Detail + list pages (Home, Products, Orders, …) | useSyncSsrQueryData wiring |
| ART-0165 | REQ-0069 | `hooks/use-back-with-refresh.ts` | Stock entity invalidateAfterStockChange |
| ART-0166 | REQ-0069 | `PaymentDialog`, `CreateUserDialog`, detail CTAs, `dialog-footer-actions` | DialogSubmitButton sweep |
| ART-0167 | REQ-0069 | `lib/stock-allocation/stock-allocation-enrich.test.ts` | Enrich unit tests |
| ART-0168 | REQ-0069 | Removed `AdminPage.tsx`, `SidebarLayout.tsx` | Orphan deletion |
| ART-0169 | REQ-0070 | `hooks/use-sync-ssr-query-data.ts` | Fingerprint-only Many + JSDoc |
| ART-0170 | REQ-0070 | Client/portal components (5) | Browse + portal SSR sync |
| ART-0171 | REQ-0070 | Admin/user list components (8) | List + activity + analytics sync |
| ART-0172 | REQ-0070 | ProductDetail, ProductReviewsSection, ticket details | useSyncSsrQueryDataMany adoption |
| ART-0173 | REQ-0071 | `hooks/use-sync-ssr-query-data.ts`, `FloatingActionButtons.tsx` | Phase 0 hotfixes (fingerprint deps, forwardRef) |
| ART-0174 | REQ-0071 | `ClientPortalPage`, `SupplierPortalPage`, `ClientProductList` | Portal headers, View All, Quick Links removal |
| ART-0175 | REQ-0071 | `client-browse-data.ts`, `ProductFilters.tsx` | Store owner counts helper |
| ART-0176 | REQ-0071 | `enrich-order-items-catalog.ts`, `ProductLineItemsList.tsx` | Line-item category/supplier |
| ART-0177 | REQ-0071 | `stripe-return.ts`, `use-back-with-refresh.ts`, order/invoice detail | Stripe back-nav fix |
| ART-0178 | REQ-0071 | `glassDetailFooterButtonClass`, detail pages sweep | Readable glass detail CTAs |
| ART-0179 | REQ-0071 | `DetailInfoRow`, order/invoice detail cards | Richer information cards |
| ART-0180 | REQ-0072 | `DETAIL_HEADER_BACK_ICON_CLASS`, admin detail glass sweep | Shared back token + admin embed parity |
| ART-0181 | REQ-0072 | catalog detail pages | Product/Category/Supplier/Warehouse `DetailInfoRow` |
| ART-0182 | REQ-0072 | `enrich-order-items-catalog.test.ts` | Catalog name enrich unit tests |
| ART-0183 | REQ-0073 | `ClientPortalPage`, `SupplierPortalPage` | Portal spacing + recent card lists |
| ART-0184 | REQ-0073 | `ProductOwnerSelect`, `client-browse-data.ts` | Owner row avatars |
| ART-0185 | REQ-0073 | `FloatingActionButtons.tsx`, dialog shells | FAB click-toggle collapse |
| ART-0186 | REQ-0073 | `ProductLineItemsList`, order detail cards | Line-item layout + icons + paidAt |
| ART-0187 | REQ-0074 | portal pages, `chart-point-label.tsx` | Spacing + chart headers + point labels |
| ART-0188 | REQ-0074 | `PartiesRolesCard`, `InvoiceSummaryCard` | Detail parity + party avatars |
| ART-0189 | REQ-0074 | `FloatingActionButtons`, `OrderDialog` | FAB hover + order line grid |
| ART-0190 | REQ-0075 | `product-stock-data.ts`, `ProductDetailPage` | Supplier warehouse SSR owner scope |
| ART-0191 | REQ-0075 | `invoices-data.ts`, `app/invoices/page.tsx`, API GET | Supplier invoice SSR/API path |
| ART-0192 | REQ-0075 | `InvoiceDetailPage`, `InvoicesPage`, `OrdersPage`, `ProductActions` | Role gating parity |
| ART-0193 | REQ-0075 | `ApiStatusPage`, `ApiDocsPage`, `AdminSettingsContent` | PageSectionHeader parity |
| ART-0194 | REQ-0075 | Admin detail embeds | GlassCard + DetailInfoRow + APP_SHELL_DETAIL_CLASS |
| ART-0195 | REQ-0076 | `ApiStatusPage`, `ApiDocsPage` | SectionCardHeader inner sections |
| ART-0196 | REQ-0076 | Admin review/ticket/user embeds | DetailInfoRow + ClientDateTime |
| ART-0197 | REQ-0076 | `InvoiceDetailPage` | Supplier Pay gate (`!isSupplierRole`) |
| ART-0198 | REQ-0076 | `app/invoices/page.tsx` | Remove dead supplier prefetchListPageStats |
| ART-0199 | REQ-0077 | `chart-point-label.tsx`, `chart-card.tsx`, portal chart pages | Label styling + margin + overflow |
| ART-0200 | REQ-0077 | `client-catalog-data.ts`, `ClientPortalPage.tsx` | Meta totals + subsection badges |
| ART-0201 | REQ-0077 | `AvatarInlineLink.tsx`, `card-empty-styles.ts`, `glass-button-styles.ts` | Shared UX primitives |
| ART-0202 | REQ-0077 | `ProductDetailPage.tsx`, `product-detail-data.ts` | Sales icons, recent orders, warehouse gating |
| ART-0203 | REQ-0077 | Detail pages + `ProductTableColumns.tsx`, `ProductLineItemsList.tsx` | CopyableText + avatar sweeps |
| ART-0204 | REQ-0077 | `AdminHistoryDetailContent.tsx` | Footer glassDetailBackButtonClass |
| ART-0205 | REQ-0077 | `stock-allocation-enrich.ts`, product-stock/API | Warehouse status on allocation rows |
| ART-0206 | REQ-0077 | `PartiesRolesCard.tsx` | AvatarInlineLink parity |
| ART-0207 | REQ-0077 | `app/api/portal/client/catalog/route.ts` | Redis v2 + meta guard |
| ART-0208 | REQ-0078 | `section-title-row.tsx` | Valid HTML title + Badge sibling row |
| ART-0209 | REQ-0078 | ClientPortal, ProductReviews, ProductDetail | Badge nesting hydration fix |
| ART-0210 | REQ-0079 | `SectionCountBadge`, `ListIndexBadge` | Glass counter + list index badges |
| ART-0211 | REQ-0079 | shell-layout-styles, detail pages, ApiDocs/ApiStatus | gap-6 detail spacing; header pb-0 |
| ART-0212 | REQ-0079 | ClientPortal, ClientProductList, ProductTableColumns, filters | Client browse UX polish |
| ART-0213 | REQ-0080 | StatisticsCard, SectionCountBadge, *List.tsx, detail GlassCard padding | Stat badge revert; slate counters; pb-6 cleanup |
| ART-0214 | REQ-0081 | ProductOwnerSelect, CategoryDetailPage, category-detail-data | Owner picker + category detail parity + insights charts |
| ART-0215 | REQ-0082 | category-forecast-rollup, forecasting-data, CategoryDetailPage | Non-blocking forecast + UI gap closure |
| ART-0216 | REQ-0083 | CategoryDetailPage, category-forecast-rollup, categories/[id]/page | Forecast table shell + admin SSR prefetch parity |
| ART-0217 | REQ-0084 | catalog-insights, CatalogInsightsSection, detail pages | Product/supplier/warehouse insights + forecast SSR sync |
| ART-0218 | REQ-0085 | lib/insights/*, SupplierDetailPage, product routes | Client-safe insights lib; Supplier h1 CopyableText; product warehouse pie SSR enrich |
| ART-0219 | REQ-0086 | catalog-detail/*, supplier-detail-data | Shared product/order list UI; supplier stats/info parity; SSR party enrich |
| ART-0220 | REQ-0087 | CategoryDetailPage, SupplierDetailPage | loading prop DRY for catalog list components |
| ART-0221 | REQ-0088 | `lib/auth/demo-seed-data.ts`, `scripts/lib/seed-demo-catalog.ts`, `scripts/reset-demo-db.ts` | Full connected demo seed |
| ART-0222 | REQ-0089 | `lib/navigation/audit-user-href.ts`, Supplier/Category/Product detail pages | Role-aware audit user links |
| ART-0223 | REQ-0090 | `lib/insights/warehouse-stock-aggregate.ts`, `catalog-insights-chart-data.ts`, ProductDetailPage | Warehouse pie unallocated slice + labels |
| ART-0224 | REQ-0091 | `demo-seed-data.ts`, `create-demo-accounts.ts`, `verify-demo-accounts.ts` | Test Supplier naming + legacy backfill + catalog seed |
| ART-0225 | REQ-0092 | `demo-seed-users.ts`, `seed-demo-accounts.ts`, `reset-demo-db.ts`, `create-demo-accounts.ts`, `verify-demo-accounts.ts` | Accounts-only reset; robohash image; opt-in catalog retained |
| ART-0226 | REQ-0093 | `role-nav-config.ts`, `warm-route-prefetch.ts`, `RouteWarmPrefetch.tsx`, filter hooks, `ApiStatusPage.tsx` | Role-scoped batched warm + RSC prefetch; filter enabled gate; ApiStatus dedupe |
| ART-0227 | REQ-0094 | `Navbar.tsx`, `nav-link-styles.ts`, `admin-nav-config.ts`, `role-nav-config.ts`, portal prefetch | Link prefetch + warm paths + gap closure |
| ART-0228 | REQ-0095 | `AuditUserDetailRow.tsx`, portal pages, `EmailPreferencesPage.tsx`, detail pages, insights sections | UI polish: spacing, headers, glass cards, audit rows, padding |
| ART-0229 | REQ-0096 | `lib/ui/glass-card.tsx`, detail pages (order/invoice/warehouse/product), SSR enrich, tests | Shared GlassCard hub; audit creator/updater; section icon parity |
| ART-0230 | REQ-0097 | `SectionCardHeader.tsx`, `EmailPreferencesPage.tsx`, `AdminOrderDetailContent.tsx`, catalog detail pages, insights sections | Gap closure: admin audit, GlassCardBody, insights import, email layout |
| ART-0231 | REQ-0098 | `semantic-badges.tsx`, Api pages, `AdminAnalyticsContent.tsx`, portal pages, `NotificationDropdown.tsx`, `BusinessInsightPage.tsx` | Admin portal UI parity + glow badge sweep |
| ART-0232 | REQ-0099 | `AdminAnalyticsContent.tsx`, `supplier-portal.ts`, `supplier-portal-data.ts`, `AdminSupplierPortalContent.tsx`, `package.json` | gap-6 sections; userId avatar seed; dead script cleanup |
| ART-0233 | REQ-0100 | `AdminSupplierPortalContent.tsx` | Avatar seed `userId ?? id` stale-cache fallback |
| ART-0234 | REQ-0102 | `lib/stock-allocation/catalog-quantity-reconcile.ts`, `apply-catalog-quantity-reconcile.ts`, `validate-allocation-quantity.ts`, `warehouse-delete-guards.ts` | Catalog reconcile + allocation validation + warehouse delete guards |
| ART-0235 | REQ-0102 | `app/api/products/route.ts`, `stock-allocations/*`, `warehouses/route.ts` | Server enforcement + Redis invalidation |
| ART-0236 | REQ-0102 | `ProductFormDialog.tsx`, `WarehouseStockAllocationRow.tsx`, `stock-allocation-enrich.ts` | Shrink confirm UI + archived rows + derived totals |
| ART-0237 | REQ-0102 | `enrichStockAllocationRows`, `product-stock-data.ts`, `stock-allocations/route.ts`, `WarehouseStockAllocationRow.tsx`, `AllocateStockDialog.tsx` | Enrichment parity API + product SSR + warehouse row meta |
| ART-0238 | REQ-0102 | `catalog-allocation-copy.ts`, `warehouse-stock-data.ts`, `OrderLineWarehouseSelect.tsx`, enrich lib consolidation | Enrichment consistency closure |
| ART-0239 | REQ-0105 | `enrich-product-committed-quantity.ts`, `product-detail-data.ts`, `ProductDetailPage.tsx`, `.gitignore`, `CLAUDE.md` | Product detail committedQuantity SSR + display DRY |
| ART-0240 | REQ-0106 | `order-line-stock-validation.ts`, `prisma/order.ts`, `OrderDialog.tsx`, `OrderLineWarehouseSelect.tsx` | Order auto-assign + catalog cap |
| ART-0241 | REQ-0107 | `catalog-allocation-copy.ts`, `ProductDetailPage.tsx` | Detail allocation summary line |
| ART-0242 | REQ-0108 | `use-catalog-quantity-reconcile-preview.ts`, `ProductFormDialog.tsx`, `StockQuantityField.tsx`, `AllocateStockDialog.tsx` | Live reserved-floor validation |
| ART-0243 | REQ-0109 | `dialog-edge-scroll.ts`, dialog components | Feedback layout tokens |
| ART-0244 | REQ-0110 | `order-line-stock-validation.ts`, `use-stock-allocation.ts`, `OrderDialog.tsx`, `validate-allocation-quantity.ts`, `ProductFormDialog.tsx`, `AllocateStockDialog.tsx` | Stock UX gap closure |
| ART-0245 | REQ-0111 | `order-line-stock-validation.ts`, `use-order-line-stock-validation.ts`, `OrderDialogCreateLineItem.tsx`, `OrderLineWarehouseSelect.tsx`, `stock-allocation-order-sync.ts`, `prisma/order.ts` | Reactive order stock workflow |
| ART-0246 | REQ-0112 | `order-line-stock-validation.ts`, `use-order-line-stock-validation.ts`, `OrderLineWarehouseSelect.tsx`, `OrderDialog.tsx` | Single fetch per line + stable stock errors |
| ART-0247 | REQ-0113 | `OrderLineWarehouseSelect.tsx`, `OrderDialogCreateLineItem.tsx` | Props-only warehouse select; types merge |
| ART-0248 | REQ-0114 | `catalog-allocation-copy.ts`, `stock-allocation-enrich.ts`, `proportional-line-amount.ts` | Catalog-commit hints; proportional line amounts |
| ART-0249 | REQ-0114 | `ProductLineItemsList.tsx`, `WarehouseDetailPage.tsx` | Fee-adjusted line display; insights DRY stat cards |
| ART-0250 | REQ-0114 | `dialog-form-label.tsx`, `DetailInfoRowGroup.tsx`, `dialog-edge-scroll.ts` | Dialog labels + table link tokens + detail row groups |
| ART-0251 | REQ-0114 | `ProductFormDialog.tsx`, `OrderDialogCreateLineItem.tsx`, catalog CRUD dialogs | Dialog UX parity sweep |
| ART-0252 | REQ-0115 | `warehouse-insights-compute.ts`, `types/warehouse-insights.ts` | `mapWarehouseStockSummary` DRY + test |
| ART-0253 | REQ-0115 | `InvoiceDialog.tsx`, `OrderDialog.tsx`, `SupportTicketDialog.tsx`, `PaymentDialog.tsx` | Remaining dialog label/footer sweep |
| ART-0254 | REQ-0115 | `ImageField.tsx`, `CategoryDialog.tsx`, `SupplierDialog.tsx` | Minor DialogFormLabel parity |
| ART-0255 | REQ-0116 | `ProportionalPriceDisplay.tsx`, `proportional-line-amount.ts` | DRY fee-adjusted line price display + test |
| ART-0256 | REQ-0116 | `SupplierDialog.tsx`, `OrderDialog.tsx`, `PaymentDialog.tsx`, `WarehouseDialog.tsx` | Final dialog label/footer gaps |
| ART-0257 | REQ-0116 | `OrderDialogCreateLineItem.tsx`, `typography-scale.ts`, `OrderSummaryCard.tsx` | Create preview + detail data typography |
| ART-0258 | REQ-0117 | `dialog-form-label.tsx`, `DialogDateField.tsx`, `DialogHeaderBrand.tsx`, `dialog-edge-scroll.ts` | Flex-safe labels + select tokens + date/header primitives |
| ART-0259 | REQ-0117 | `OrderDialog.tsx`, `InvoiceDialog.tsx`, `OrderPickerCommand.tsx`, catalog CRUD dialogs | Dialog UX sweep (totals empty state, selects, headers) |
| ART-0260 | REQ-0117 | `AdminEmbedDataTable.tsx`, `AdminClientPortalContent.tsx`, `AdminSupplierPortalContent.tsx`, `AdminMyActivityContent.tsx` | Admin embed table parity |
| ART-0261 | REQ-0118 | `lib/ui/popover-readability-styles.ts`, `pagination-select-styles.ts`, `filter-command-item.tsx` | Readable popover token hub |
| ART-0262 | REQ-0118 | `PaymentDialog.tsx`, warehouse dialogs, `OrderDialogCreateLineItem.tsx`, auth/shipping/admin selects | Dialog gap closure |
| ART-0263 | REQ-0118 | 15 `*Filter.tsx` + `ProductOwnerSelect.tsx` | Full list filter Command sweep |
| ART-0264 | REQ-0119 | `catalog-filter-tokens.ts`, `popover-readability-styles.ts` | Catalog/export popover readability parity |
| ART-0265 | REQ-0119 | `OrderAddressFields.tsx`, `dialog-edge-scroll.ts` | Order address sub-label tokens |
| ART-0266 | REQ-0119 | `business-insights-warehouse-rollup.ts`, `BusinessInsightsWarehouseSection.tsx`, `app/business-insights/page.tsx` | Warehouse rollup tab + SSR |
| ART-0267 | REQ-0120 | `BusinessInsightPage.tsx` | useSyncSsrQueryDataMany products/orders/warehouse |
| ART-0268 | REQ-0120 | `AdminMyActivityContent.tsx` | AdminEmbedDataTable Recent Orders (REQ-0117 AC4) |
| ART-0269 | REQ-0120 | `use-back-with-refresh.ts` | history entity + narrow list invalidation |
| ART-0270 | REQ-0120 | `AdminHistoryDetailContent.tsx`, `SupportTicketDetailContent.tsx` | back nav via useBackWithRefresh |
| ART-0271 | REQ-0120 | Product/Category/Supplier/Warehouse detail pages | post-delete navigateTo |
| ART-0272 | REQ-0120 | `OrderLineWarehouseSelect.tsx`, `OrderDialog.tsx`, `LoginRoleSelect.tsx` | dead props/imports cleanup |

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
| TC-0014 | REQ-0039 | `lib/ui/user-avatar-sources.test.ts` |
| TC-0015 | REQ-0040 | `lib/ui/user-avatar-sources.test.ts` (seed resolver) |
| TC-0016 | REQ-0068 | `lib/products/stock-allocation-order-sync.test.ts` |
| TC-0017 | REQ-0069 | `lib/stock-allocation/stock-allocation-enrich.test.ts` |
| TC-0018 | REQ-0072 | `lib/orders/enrich-order-items-catalog.test.ts` |
| TC-0019 | REQ-0073 | `lib/orders/transform-order-detail.test.ts` (paidAt) |
| TC-0020 | REQ-0074 | `lib/ui/chart-point-label.test.ts` |
| TC-0021 | REQ-0075 | `lib/server/product-stock-data.test.ts` |
| TC-0022 | REQ-0076 | `lib/server/invoices-data.test.ts` |
| TC-0023 | REQ-0077 | `lib/server/client-catalog-data.test.ts` |
| TC-0024 | REQ-0077 | `lib/ui/chart-point-label.test.ts` (margin constant) |
| TC-0026 | REQ-0089 | `lib/navigation/audit-user-href.test.ts` |
| TC-0027 | REQ-0090 | `lib/ui/catalog-insights-chart-data.test.ts` |
| TC-0028 | REQ-0090 | `lib/insights/product-insights-enrich.test.ts` (unallocated) |
| TC-0029 | REQ-0091 | `lib/insights/warehouse-stock-aggregate.test.ts` |
| TC-0030 | REQ-0094 | `lib/navigation/role-nav-config.test.ts` |
| TC-0031 | REQ-0096 | `lib/server/warehouse-detail-data.test.ts` |
| TC-0032 | REQ-0096 | `lib/orders/transform-order-detail.test.ts` (creator/updater) |
| TC-0033 | REQ-0102 | `lib/stock-allocation/catalog-quantity-reconcile.test.ts`, `validate-allocation-quantity.test.ts`, `lib/warehouses/warehouse-delete-guards.test.ts` |
| TC-0034 | REQ-0103 | `lib/products/order-stock-reservation.test.ts`, `enrich-product-committed-quantity.test.ts` |
| TC-0035 | REQ-0104 | detail SSR enrich + forecast/supplier-dashboard committed avail |
| TC-0036 | REQ-0105 | `product-detail-data.test.ts`, `enrich-product-committed-quantity.test.ts` (single-product enrich) |
| TC-0037 | REQ-0106 | `order-line-stock-validation.test.ts` |
| TC-0038 | REQ-0107 | `catalog-allocation-copy.test.ts` |
| TC-0039 | REQ-0108 | `use-catalog-quantity-reconcile-preview.test.ts`, `StockQuantityField.test.ts` |
| TC-0040 | REQ-0110 | `order-line-stock-validation.test.ts`, `validate-allocation-quantity.test.ts`, `order-stock-reservation.test.ts` |
| TC-0041 | REQ-0111 | `order-line-stock-validation.test.ts`, `stock-allocation-order-sync.test.ts` |
| TC-0042 | REQ-0112 | `order-line-stock-validation.test.ts` (buildOrderLineWarehousePickOptions) |
