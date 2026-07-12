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
2026-07-08T00:00:00Z | build-agent | Locale-aware ClientCurrency/ClientCompactDateTime | Stable SSR + browser locale after mount for global demo | REQ-0020
2026-07-08T00:00:00Z | build-agent | Shell-first nav + DataSlotPulse | Suspense shell in page.tsx; initialData hooks; table headers always visible | REQ-0021
2026-07-08T00:00:00Z | red-team | REQ-0021 automated gates | lint ✓ test 310 ✓ invalidate 200 ✓ build ✓ | REQ-0021
2026-07-08T00:00:00Z | build-agent | Tier-3 detail shell-first gap closure | OrderDetailPage + InvoiceDetailPage isDataSlotLoading; delete StatisticsCardSkeleton | REQ-0022
2026-07-08T00:00:00Z | build-agent | Admin detail shell-first gap closure | 5 Admin*DetailContent: isDataSlotLoading + DataSlotPulse; dual replies pulse on support ticket | REQ-0023
2026-07-08T00:00:00Z | build-agent | REQ-0024 settings SSR + detail prefetch + order DRY | SystemConfig shell-first; lib/server detail helpers; components/orders/detail | REQ-0024
2026-07-08T00:00:00Z | red-team | REQ-0024 automated gates | lint ✓ test 311 ✓ invalidate 200 ✓ build ✓ | REQ-0024
2026-07-08T00:00:00Z | build-agent | REQ-0026 P3 SSR gaps | Ghost fetches gated; detail secondary SSR; client browse/catalog; defer warm prefetch | REQ-0026
2026-07-08T00:00:00Z | red-team | REQ-0026 automated gates | lint ✓ test 311 ✓ invalidate 200 ✓ build ✓ | REQ-0026
2026-07-08T20:00:00Z | build-agent | ProductOwnerSelect + product-owner filter | Plain DropdownMenu rendered all admin users; hang on open; filter to owners with products | REQ-0026
2026-07-08T20:00:00Z | red-team | Client owner dropdown manual QA | Debug logs: 7 owners, openPaintMs 27–48ms; owner switch browse-products 250–380ms | REQ-0026
2026-07-08T20:00:00Z | requirement-architect | REQ-0027 backlog | URL ownerId sync + narrow admin warm-prefetch deferred to C2 | REQ-0027
2026-07-09T00:00:00Z | build-agent | Shallow ownerId URL via history.replaceState | Avoid RSC refetch on client owner switch; TanStack holds data | REQ-0027
2026-07-09T00:00:00Z | build-agent | warmAdminClientPortalLists on / or /admin | Defer client-orders/invoices warm from login idle callback | REQ-0027
2026-07-09T00:00:00Z | red-team | REQ-0027 automated gates | lint ✓ test 318 ✓ invalidate 200 ✓ build ✓ | REQ-0027
2026-07-09T15:00:00Z | build-agent | Invoice glass badges + list data fixes | payment pending→unpaid; INVOICE_STATUS glass; cache userId scope; store-wide /invoices list; orderUserId Self/Client tags | REQ-0028
2026-07-09T16:00:00Z | build-agent | Invoice warm-prefetch + store-scope Prisma filters | Role-scoped TanStack keys; applyInvoiceFiltersToWhere on getInvoicesByOrderIds | REQ-0028
2026-07-09T17:00:00Z | build-agent | GLASS_BADGE_CLASS dark mode tokens | dark:border/bg-gradient/text/shadow on all 15 hues for table/dashboard readability | REQ-0028
2026-07-09T17:50:00Z | build-agent | Ticket/review glass badges + colored filters | TICKET_STATUS/PRIORITY + REVIEW_STATUS → GLASS; badge filter dropdowns; detail pages use semantic badges | REQ-0028
2026-07-09T18:00:00Z | build-agent | Admin user-mgmt + activity-history glass badges | USER_ROLE/IMPORT/AUDIT → GLASS; ImportTypeBadge; colored role/import filters | REQ-0028
2026-07-09T18:20:00Z | build-agent | Supplier catalog detail Option B | Read-only category/supplier detail via assigned-product gate; role-scoped Redis cache; disableCrud on detail pages | REQ-0029
2026-07-09T18:25:00Z | red-team | REQ-0029 automated gates + push main | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓; SHA `3ebb4db` | REQ-0029
2026-07-09T18:30:00Z | product-owner | C2 backlog opened | Human Gate 2 + user live-test issues deferred to C2; see STATE.md Open backlog | REQ-0009
2026-07-10T09:13:00Z | agile-v-core | Session bootstrap resume | PLAYBOOK.md created; config.json synced; Red Team re-run PASS; skills 01+02+03 active | REQ-0008
2026-07-10T09:27:00Z | requirement-architect | REQ-0030 auth UX polish | Dropdown icons, chevron, max-w-7xl, stagger anim, viewport bg; shared components/auth | REQ-0030
2026-07-10T09:30:00Z | build-agent | REQ-0030 implemented | AuthPageShell, LoginRoleSelect, select chevron group, tailwind 9xl token | REQ-0030
2026-07-10T09:31:00Z | red-team | REQ-0030 automated gates | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓ | REQ-0030
2026-07-10T09:40:00Z | requirement-architect | REQ-0031 auth left list redesign | Brand header + list panel; replace promo grid | REQ-0031
2026-07-10T09:43:00Z | build-agent | REQ-0031 implemented | AuthInfoPanel, AuthBrandHeader, auth-panel-copy; removed AuthPromoCard | REQ-0031
2026-07-10T09:44:00Z | red-team | REQ-0031 automated gates | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓ | REQ-0031
2026-07-10T09:57:00Z | build-agent | REQ-0032 auth glass + flat list + bg anim | AuthFormCard blur-2xl, flat list space-y-2, authBgFloat, 6 copy items | REQ-0032
2026-07-10T09:59:00Z | red-team | REQ-0032 automated gates | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓ | REQ-0032
2026-07-10T10:14:00Z | build-agent | REQ-0033 auth polish | Professional copy, scrollbar-gutter on auth, icon glass glow, tighter spacing | REQ-0033
2026-07-10T10:15:00Z | red-team | REQ-0033 automated gates | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓ | REQ-0033
2026-07-10T10:32:00Z | build-agent | REQ-0034 auth session toasts | Toaster before AuthSessionToasts; useToast memoryState sync; removed dead hook | REQ-0034
2026-07-10T10:33:00Z | red-team | REQ-0034 automated gates | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓ | REQ-0034
2026-07-10T10:40:00Z | build-agent | REQ-0035 OAuth welcome toast | AuthSessionToasts oauth_success handler; oauth-success-url + auth-welcome-toast helpers | REQ-0035
2026-07-10T10:41:00Z | red-team | REQ-0035 automated gates | lint ✓ test 335 ✓ invalidate 202 ✓ build ✓ | REQ-0035
2026-07-10T13:05:00Z | build-agent | REQ-0036 app shell full bleed | Remove max-w-9xl; APP_SHELL_WIDTH_CLASS; auth stays max-w-7xl | REQ-0036
2026-07-10T13:06:00Z | red-team | REQ-0036 automated gates | lint ✓ test 335 ✓ invalidate 202 ✓ build ✓ | REQ-0036
2026-07-10T13:10:00Z | red-team | REQ-0036 DRY + build | lint ✓ test 335 ✓ invalidate 202 ✓ build ✓ | REQ-0036
2026-07-10T13:26:00Z | build-agent | REQ-0037 product status filter glass | ProductStockStatusBadge in ProductStatusFilter; closes REQ-0028 AC7 gap | REQ-0037
2026-07-10T13:29:00Z | red-team | REQ-0037 automated gates | lint ✓ test 335 ✓ invalidate 202 ✓ build ✓ | REQ-0037
2026-07-10T13:38:00Z | build-agent | REQ-0038 SafeImage rollout | safe-image + safe-avatar-image; migrate 12 consumers | REQ-0038
2026-07-10T13:40:00Z | red-team | REQ-0038 automated gates | lint ✓ test 335 ✓ invalidate 202 ✓ build ✓ | REQ-0038
2026-07-10T13:50:00Z | build-agent | REQ-0039 navbar SafeAvatarImage | resolveUserAvatarSources; Navbar/Sidebar SafeAvatarImage; googleusercontent wildcard | REQ-0039
2026-07-10T13:52:00Z | red-team | REQ-0039 automated gates | lint ✓ test 340 ✓ invalidate 202 ✓ build ✓ | REQ-0039
2026-07-10T13:58:00Z | build-agent | REQ-0040 avatar URL DRY | resolveAvatarSourcesFromSeed; migrate reviews/tickets; Gmail QA PASS | REQ-0040
2026-07-10T13:59:00Z | red-team | REQ-0040 automated gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ | REQ-0040
2026-07-10T14:15:00Z | build-agent | REQ-0041 catalog filter UI | shared select/chips/export; entity icons + glass badges | REQ-0041
2026-07-10T14:17:00Z | red-team | REQ-0041 automated gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ | REQ-0041
2026-07-10T14:26:00Z | red-team | REQ-0042 automated gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ | REQ-0042
2026-07-10T14:40:00Z | build-agent | REQ-0043 filter chip rollout | DismissibleFilterChips + filter-chip-styles; wire 8 filter surfaces; rose/sky hover | REQ-0043
2026-07-10T14:44:00Z | red-team | REQ-0043 automated gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ | REQ-0043
2026-07-10T14:44:00Z | build-agent | Hang diagnostic | No duplicate next dev; ClientProductList useEffect deps fix | REQ-0043
2026-07-10T14:55:00Z | build-agent | REQ-0044 typography scale | typography-scale.ts; hub headers + ~45 file sweep | REQ-0044
2026-07-10T15:00:00Z | red-team | REQ-0044 automated gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ | REQ-0044
2026-07-10T15:08:00Z | build-agent | REQ-0044 ApiStatus gap | cache/DB metric divs text-xl → text-sm sm:text-lg | REQ-0044
2026-07-10T15:12:00Z | build-agent | REQ-0044 text-xl sweep | Navbar/AuthBrandHeader lg:text-xl removed; PaymentDialog title+total → card/stat tier | REQ-0044
2026-07-10T15:15:00Z | build-agent | REQ-0044 bare text-lg | brand/AdminPage/PaymentDialog/misc → responsive pairs only | REQ-0044
2026-07-10T15:18:00Z | red-team | REQ-0044 final audit | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; zero text-xl; no TanStack/SSR delta | REQ-0044
2026-07-10T16:00:00Z | build-agent | FilterCommandCheckboxItem | cmdk onSelect only; checkbox visual — fixes hang + whole-row click | REQ-0045
2026-07-10T16:02:00Z | build-agent | Invoice status client-side | match OrderList; API search+scope only — no query key churn | REQ-0045
2026-07-10T16:04:00Z | red-team | REQ-0045 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; no TanStack/invalidation delta | REQ-0045
2026-07-10T16:12:00Z | build-agent | CATALOG_TOOLBAR_TRIGGER_LAYOUT | px-4 gap-2 sm:w-auto parity filter+export | REQ-0046
2026-07-10T16:14:00Z | red-team | REQ-0046 lint | CSS-only; catalog-filter-tokens + placeholder | REQ-0046
2026-07-10T16:34:00Z | build-agent | GLASS_FOCUS_RING | hue ring dark-visible; no border-width shift; dialog-form-field sweep | REQ-0046
2026-07-10T16:35:00Z | red-team | REQ-0046 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; CSS-only | REQ-0046
2026-07-10T16:50:00Z | build-agent | GLASS_*_BUTTON tokens | primary/action/ghost + icon hover; focus-ring build-on | REQ-0047
2026-07-10T16:51:00Z | build-agent | Batch A+B glass migration | 14 files; Email prefs icon h-4 w-4 mr-2 | REQ-0047
2026-07-10T16:52:00Z | red-team | REQ-0047 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; CSS-only | REQ-0047
2026-07-10T16:52:00Z | release-manager | commit split note | REQ-0046 focus-ring separate from REQ-0047 glass+email prefs | REQ-0046, REQ-0047
2026-07-10T17:16:00Z | build-agent | AUTH_FORM_FIELD_* | light-mode auth fields; stop DIALOG_FORM_FIELD on login/register | REQ-0048
2026-07-10T17:16:00Z | build-agent | DIALOG_TABLE_* | td zebra + white text; category/supplier dialog tables | REQ-0048
2026-07-10T17:16:00Z | build-agent | ProductOptionRow | OrderDialog product Select SafeImage thumbs | REQ-0048
2026-07-10T17:17:00Z | red-team | REQ-0048 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; CSS/UI only | REQ-0048
2026-07-10T17:50:00Z | build-agent | Dual-theme DIALOG_TABLE_* | light list-page parity; dark glass rows in dialogs | REQ-0049
2026-07-10T17:50:00Z | build-agent | GLASS_BUTTON_SHELL_RESET | variant ghost strips bg-primary bleed under glass gradients | REQ-0049
2026-07-10T17:50:00Z | build-agent | Submit isValid gates | Category/Supplier/Warehouse/ProductForm disabled until required valid | REQ-0049
2026-07-10T17:51:00Z | red-team | REQ-0049 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; CSS/UI only | REQ-0049
2026-07-10T18:03:00Z | build-agent | DIALOG_TABLE_SECTION_TITLE | light-readable embedded table headings in Category/Supplier dialogs | REQ-0050
2026-07-10T18:03:00Z | build-agent | Batch B shell-reset sweep | variant ghost + SHELL_RESET on remaining primary glass buttons | REQ-0050
2026-07-10T18:03:00Z | build-agent | Review dialog submit tokens | ProductReview + WriteEditReview amber PRIMARY migration | REQ-0050
2026-07-10T18:04:00Z | red-team | REQ-0050 gates | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓; CSS/UI only | REQ-0050
2026-07-10T18:35:00Z | build-agent | Revert auth/page CTA shell-reset | bg-transparent killed gradients; Login sky unchanged; Register AUTH_SUBMIT_BUTTON_EMERALD | hotfix
2026-07-10T18:35:00Z | build-agent | SHELL_RESET trim | shadow-only reset; never bg-transparent with PRIMARY | hotfix
2026-07-10T18:36:00Z | release | Push main 73060a1 | REQ-0049/0050 + hotfix on main | REQ-0049
2026-07-11T10:34:00Z | agile-v-core | session-activate | Infinity Loop resume; Red Team lint/test/invalidate/build PASS @ d397b4a; next REQ-0051 | REQ-0008, REQ-0051
2026-07-11T10:45:00Z | build-agent | REQ-0052 post-mutation | after() deferred Redis + ImageKit; 32 API routes; maxDuration 60 | REQ-0052
2026-07-11T10:46:00Z | red-team | REQ-0052 gates | lint ✓ test 346 ✓ invalidate 202 ✓ build ✓ | REQ-0052
2026-07-11T11:32:00Z | debug-agent | REQ-0055 root-cause | Redis after() race: TanStack refetch fires before SCAN completes → stale data | REQ-0055
2026-07-11T11:32:00Z | build-agent | REQ-0055 sync-invalidation | scheduleInvalidate* now async/sync (no after()); all 32 routes await before response | REQ-0055
2026-07-11T11:33:00Z | build-agent | REQ-0055 stripe-history | window.location.replace() prevents Stripe URL polluting history | REQ-0055
2026-07-11T11:33:00Z | build-agent | REQ-0055 order-cancel | Removed router.refresh() after cancel (mutation onSuccess handles invalidation) | REQ-0055
2026-07-11T11:34:00Z | red-team | REQ-0055 gates | lint ✓ test 352 ✓ invalidate 202 ✓ build ✓ | REQ-0055
2026-07-11T13:55:00Z | agile-v-core | session-resume | Found REQ-0055 code complete + gates logged but uncommitted; found untracked demo-DB-reset refactor with no REQ — assigned REQ-0056 for traceability | REQ-0055, REQ-0056
2026-07-11T13:58:00Z | build-agent | REQ-0056 demo seed DRY | demo-seed-users.ts single source; scripts/lib/delete-all-db-data.ts shared wipe; reset-demo-db.ts one-command reseed; test-accounts.ts derives from seed source | REQ-0056
2026-07-11T14:00:00Z | red-team | REQ-0055 + REQ-0056 combined gates | lint ✓ test 352 ✓ invalidate 202 ✓ build ✓; tsc --noEmit clean on touched scripts | REQ-0055, REQ-0056
2026-07-11T14:10:00Z | build-agent | REQ-0057 back-button sweep | remove router.refresh() from 7 components; AdminOrderDetailContent → useBackWithRefresh("order"); InvoiceDetailPage delete → navigateTo; ProductActions/CategoryActions useRouter removed | REQ-0057
2026-07-11T14:11:00Z | red-team | REQ-0057 gates | lint ✓ test 352 ✓ invalidate 202 ✓ | REQ-0057
2026-07-11T14:30:00Z | build-agent | REQ-0058 CopyableText | shared inline copy icon (Check ~1.5s, stopPropagation in Link cells); dropped into order/invoice tables, detail headers, portals, catalog recent-order cards | REQ-0058
2026-07-11T14:35:00Z | build-agent | REQ-0059 ProductThumb | extracted from ProductOptionRow; imageUrl added to order detail Prisma selects (5 role variants) + updateOrder include + transforms + OrderItem/StockAllocation types; OrderItemsCard/WarehouseDetailPage/catalog grids render thumb w/ Package fallback | REQ-0059
2026-07-11T14:40:00Z | build-agent | REQ-0060 OrderPickerCommand | Popover+Command searchable order picker replaces plain Select in InvoiceDialog create mode; initialOrderId prop pre-selects; z-[100] above dialog | REQ-0060
2026-07-11T14:50:00Z | build-agent | REQ-0061 invoice actions on orders | getInvoiceLinkMap batch helper → invoiceForOrder on all 4 SSR list transforms + GET /api/orders (shared Redis shape); OrderActions situation menu (Create/View/Edit/Delete invoice, role-gated); OrderList hosts InvoiceDialog; OrderDetailPage + AdminOrderDetailContent Create Invoice buttons | REQ-0061
2026-07-11T14:55:00Z | build-agent | REQ-0062 order actions on invoices | InvoiceActions: View Order (all roles), Cancel Order (admin/owner, AlertDialog); Edit/Send/Delete invoice now role-gated for client/supplier | REQ-0062
2026-07-11T14:58:00Z | agile-v-core | REQ-0061 invalidation audit | INVOICE_PATTERNS already clears orders:* in Redis; invalidateAfterOrderGraphChange covers TanStack — no invalidation changes needed | REQ-0061
2026-07-11T15:00:00Z | red-team | REQ-0058–0062 gates | lint ✓ test 352 ✓ invalidate 202 ✓ build ✓ | REQ-0058, REQ-0059, REQ-0060, REQ-0061, REQ-0062
2026-07-11T15:05:00Z | build-agent | REQ-0063 mapOrderItemsFromRaw | shared Prisma→OrderItem mapper; transform-order-detail DRY | REQ-0063
2026-07-11T15:08:00Z | build-agent | REQ-0063 invoice line items | enrichInvoice widens product select (no extra query); linkedOrderNumber + linkedOrderItems on invoice detail SSR/API | REQ-0063
2026-07-11T15:10:00Z | build-agent | REQ-0063 ProductLineItemsList | shared line-item rows; OrderItemsCard + InvoiceDetailPage reuse | REQ-0063
2026-07-11T15:12:00Z | build-agent | REQ-0063 copy shipping | CopyableText on ShippingManagement order#/tracking + OrderTrackingInfo | REQ-0063
2026-07-11T15:15:00Z | red-team | REQ-0063 gates | lint ✓ test 356 ✓ invalidate 202 ✓ build ✓ | REQ-0063
2026-07-11T15:30:00Z | build-agent | REQ-0064 polish | CopyableText payment ref; OrderItem.createdAt string; TYPO_BODY tokens | REQ-0064
2026-07-11T15:32:00Z | build-agent | REQ-0051 glass sweep | Detail CTAs + FABs + ShippingManagement + WriteEditReview cancel → GLASS_* tokens | REQ-0051
2026-07-11T15:35:00Z | build-agent | REQ-0065 admin parity | PageSectionHeader + bottom action rows on admin detail pages | REQ-0065
2026-07-11T15:40:00Z | build-agent | REQ-0066 warehouse integration | stock-transfers API; allocation UI; product warehouse card; order sync | REQ-0066
2026-07-11T15:42:00Z | build-agent | REQ-0067 AI warehouse | insights route appends getWarehouseStockSummary; prompt rebalancing | REQ-0067
2026-07-11T15:45:00Z | red-team | REQ-0064–0067 gates | lint ✓ test 361 ✓ invalidate 207 ✓ build ✓ | REQ-0064, REQ-0051, REQ-0065, REQ-0066, REQ-0067
2026-07-11T16:00:00Z | build-agent | REQ-0066 hardening | avail−reserved decrement planner; role-aware stock product access; 5 unit tests | REQ-0066
2026-07-11T16:02:00Z | red-team | REQ-0066 hardening gates | lint ✓ test 366 ✓ invalidate 207 ✓ build ✓ | REQ-0066
2026-07-11T15:38:00Z | build-agent | Pre-test gaps | clientMayWriteStock wired; WAREHOUSE_PATTERNS + products; delete hook invalidateAfterStockChange | REQ-0068 prep
2026-07-11T15:45:00Z | build-agent | REQ-0068 picking | OrderItem warehouse pick; stock-allocation-order-sync; OrderDialog UI; invoice/webhook gap | REQ-0068
2026-07-11T16:40:00Z | build-agent | REQ-0066 AC6 warehouse UX | allocate/transfer dialog polish; FAB restore; SSR stock sync; DialogSubmitButton; stock-allocation-enrich | REQ-0066
2026-07-11T16:42:00Z | red-team | REQ-0066 AC6 gates | lint ✓ test 372 ✓ invalidate 207 ✓ build ✓ | REQ-0066
2026-07-11T17:00:00Z | build-agent | useSyncSsrQueryData hooks | useLayoutEffect setQueryData bridges withInitialData + refetchOnMount:false on App Router nav | REQ-0069
2026-07-11T17:02:00Z | build-agent | SSR sync wiring | All detail pages + primary list pages; WarehouseDetailPage inline effect migrated | REQ-0069
2026-07-11T17:04:00Z | build-agent | useBackWithRefresh stock entities | warehouse/product → invalidateAfterStockChange belt-and-suspenders | REQ-0069
2026-07-11T17:06:00Z | build-agent | DialogSubmitButton sweep | PaymentDialog, CreateUserDialog, dialog-footer-actions, detail CTAs | REQ-0069
2026-07-11T17:08:00Z | build-agent | stock-allocation-enrich tests | transformStockAllocationRow + fetchStockAllocationProductMap empty early return | REQ-0069
2026-07-11T17:15:00Z | red-team | REQ-0069 gates | lint ✓ test 376 ✓ invalidate 206 ✓ build ✓ | REQ-0069
2026-07-11T17:20:00Z | red-team | REQ-0069 post-audit | All AC1–AC5 wired; dead import cleanup; prod SHA 29b9675 | REQ-0069
2026-07-11T17:30:00Z | build-agent | REQ-0070 client/portal sync | ClientProductList + portal pages + admin portal content | REQ-0070
2026-07-11T17:32:00Z | build-agent | REQ-0070 admin list sync | 8 list/activity/analytics surfaces wired | REQ-0070
2026-07-11T17:34:00Z | build-agent | REQ-0070 Many adoption + hook harden | fingerprint-only deps; ProductDetail/reviews/tickets | REQ-0070
2026-07-11T17:36:00Z | build-agent | REQ-0070 doc scrub | SidebarLayout refs removed from REQ-0034/36/39 | REQ-0070
2026-07-11T17:40:00Z | red-team | REQ-0070 gates | lint ✓ test 376 ✓ invalidate 206 ✓ build ✓ | REQ-0070
2026-07-11T18:00:00Z | build-agent | REQ-0071 phase 0 | useSyncSsrQueryData fingerprint-only deps; FabButton forwardRef | REQ-0071
2026-07-11T18:10:00Z | build-agent | REQ-0071 portal UX | PageSectionHeader; View All icons; Quick Links removed | REQ-0071
2026-07-11T18:20:00Z | build-agent | REQ-0071 detail polish | glassDetailFooterButtonClass; DetailInfoRow; Stripe back-nav; catalog names enrich | REQ-0071
2026-07-11T18:30:00Z | red-team | REQ-0071 gates | lint ✓ test 376 ✓ invalidate 206 ✓ build ✓ | REQ-0071
2026-07-11T19:00:00Z | build-agent | REQ-0072 header back token | DETAIL_HEADER_BACK_ICON_CLASS centralizes 8+ detail headers | REQ-0072
2026-07-11T19:10:00Z | build-agent | REQ-0072 admin glass sweep | AdminOrder + 3 embeds + History; dead GLASS_PRIMARY removed | REQ-0072
2026-07-11T19:20:00Z | build-agent | REQ-0072 catalog DetailInfoRow | Product/Category/Supplier/Warehouse info cards; partial→invoice link | REQ-0072
2026-07-11T19:30:00Z | build-agent | REQ-0072 enrich test | enrich-order-items-catalog.test.ts with prisma mocks | REQ-0072
2026-07-11T20:00:00Z | build-agent | REQ-0073 portal spacing + cards | header gap fix; CARD_LIST recent orders/invoices | REQ-0073
2026-07-11T20:10:00Z | build-agent | REQ-0073 owner avatars + FAB | ProductOwnerSelect SafeAvatarImage; FAB click-toggle | REQ-0073
2026-07-11T20:20:00Z | build-agent | REQ-0073 order detail UX | line-item layout; paidAt; icon parity | REQ-0073
2026-07-11T20:30:00Z | red-team | REQ-0073 gates | lint ✓ test 381 ✓ invalidate 206 ✓ build ✓ | REQ-0073
2026-07-11T21:00:00Z | build-agent | REQ-0074 portal spacing + charts | pb-6 rhythm; SectionCardHeader; chart point labels | REQ-0074
2026-07-11T21:10:00Z | build-agent | REQ-0074 FAB + order dialog | hover+click FAB; 3-col order line grid | REQ-0074
2026-07-11T21:20:00Z | build-agent | REQ-0074 detail parity | PartiesRolesCard; InvoiceSummaryCard; party image SSR | REQ-0074
2026-07-11T21:30:00Z | red-team | REQ-0074 gates | lint ✓ test 384 ✓ invalidate 206 ✓ build ✓ | REQ-0074
2026-07-11T22:00:00Z | red-team | REQ-0074 audit | All phases done; minor gap AdminOrderDetailContent status rows; lint warn fixed | REQ-0074
2026-07-11T22:05:00Z | po | C2 backlog | OB-011–015 supplier/UI sweep queued for 2026-07-12 | REQ-0075 candidate
2026-07-12T10:05:00Z | agile-v-core | session-activate | Bootstrap confirmed; .agile-v/ 24 skills + all artifacts present; main synced origin at ce7c80b | REQ-0008
2026-07-12T10:06:00Z | red-team | session gates | lint ✓ test 384 ✓ invalidate 206 ✓ build ✓ | ALL
2026-07-12T10:07:00Z | po | REQ-0075 specify | Formal REQ added from OB-011–015 backlog; status planned; resume token REQ-0075-supplier-ui-sweep | REQ-0075
2026-07-12T10:18:00Z | build-agent | REQ-0075 AC1 | product-stock-data ownerUserId warehouse scope; supplier plain-text warehouse names; unit test | REQ-0075
2026-07-12T10:19:00Z | build-agent | REQ-0075 AC2 | getInvoicesForSupplierId; invoices page/API supplier branch; invoice detail gating; FAB/import parity | REQ-0075
2026-07-12T10:20:00Z | build-agent | REQ-0075 AC3–AC5 | PageSectionHeader static pages; admin embed GlassCard/DetailInfoRow; AdminOrder status rows | REQ-0075
2026-07-12T10:21:00Z | red-team | REQ-0075 gates | lint ✓ test 386 ✓ invalidate 206 ✓ build ✓ | REQ-0075
2026-07-12T12:20:00Z | build-agent | REQ-0076 AC1 | ApiStatus/ApiDocs SectionCardHeader inner sections; Lucide icon migration on docs endpoints | REQ-0076
2026-07-12T12:22:00Z | build-agent | REQ-0076 AC2–AC3 | InvoiceDetailPage supplier Pay gate; admin review/ticket/user DetailInfoRow + ClientDateTime | REQ-0076
2026-07-12T12:24:00Z | build-agent | REQ-0076 AC4–AC5 | invoices-data.test.ts; supplier invoices SSR dead prefetch removed | REQ-0076
2026-07-12T12:28:00Z | red-team | REQ-0076 gates | lint ✓ test 389 ✓ invalidate 206 ✓ build ✓ | REQ-0076
2026-07-12T13:10:00Z | build-agent | REQ-0077 AC1–AC3 | Chart labels + ChartCard overflow; client catalog meta totals; AvatarInlineLink + empty/back tokens | REQ-0077
2026-07-12T13:15:00Z | build-agent | REQ-0077 AC4–AC7 | CopyableText/avatar sweeps; ProductDetailPage enrichment; glassDetailBackButtonClass on detail pages | REQ-0077
2026-07-12T13:25:00Z | red-team | REQ-0077 gates | lint ✓ test 391 ✓ invalidate 206 ✓ build ✓ | REQ-0077
2026-07-12T13:30:00Z | build-agent | REQ-0077 gap closure | AdminHistory footer Back; warehouse status badge SSR+UI; PartiesRolesCard AvatarInlineLink; catalog v2 cache; product-detail test | REQ-0077
2026-07-12T13:31:00Z | red-team | REQ-0077 gap gates | lint ✓ test 392 ✓ invalidate 206 ✓ build ✓ | REQ-0077
2026-07-12T13:45:00Z | build-agent | REQ-0078 AC1–AC3 | SectionTitleRow; fix Badge nesting in ClientPortal, ProductReviews, ProductDetail | REQ-0078
2026-07-12T13:46:00Z | red-team | REQ-0078 gates | lint ✓ test 392 ✓ invalidate 206 ✓ build ✓ | REQ-0078
2026-07-12T14:21:00Z | build-agent | REQ-0079 AC1–AC9 | SectionCountBadge, ListIndexBadge, spacing tokens, client browse/detail polish | REQ-0079
2026-07-12T14:21:00Z | red-team | REQ-0079 gates | lint ✓ test 392 ✓ invalidate 206 ✓ build ✓ | REQ-0079
2026-07-12T14:35:00Z | build-agent | REQ-0080 AC1–AC4 | Revert StatisticsCard sub-badges; slate-only section counters; list pb-6 cleanup; padding revert | REQ-0080
2026-07-12T14:35:00Z | red-team | REQ-0080 gates | lint ✓ test 392 ✓ invalidate 206 ✓ build ✓ | REQ-0080
2026-07-12T15:05:00Z | build-agent | REQ-0081 AC1–AC7 | OwnerPickerRow; CategoryDetail parity; SSR insights + forecast; charts | REQ-0081
2026-07-12T15:05:00Z | red-team | REQ-0081 gates | lint ✓ test 394 ✓ invalidate 206 ✓ build ✓ | REQ-0081
