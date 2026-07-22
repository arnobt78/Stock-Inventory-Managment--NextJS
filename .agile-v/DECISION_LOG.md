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
2026-07-12T15:12:00Z | build-agent | REQ-0082 AC1–AC5 | UI parity + non-blocking forecast; cache-read SSR + TanStack fallback | REQ-0082
2026-07-12T15:12:00Z | red-team | REQ-0082 gates | lint ✓ test 394 ✓ invalidate 206 ✓ build ✓ | REQ-0082
2026-07-12T15:18:00Z | build-agent | REQ-0083 AC1–AC3 | Urgent table shell; rollup comment; admin category route cache-read forecast | REQ-0083
2026-07-12T15:18:00Z | red-team | REQ-0083 gates | lint ✓ test 394 ✓ invalidate 206 ✓ build ✓ | REQ-0083
2026-07-12T15:32:00Z | build-agent | REQ-0084 AC1–AC5 | Detail insights charts + forecast SSR sync on 4 entity pages | REQ-0084
2026-07-12T15:32:00Z | red-team | REQ-0084 gates | lint ✓ test 397 ✓ invalidate 206 ✓ build ✓ | REQ-0084
2026-07-12T15:40:00Z | build-agent | REQ-0085 AC1–AC4 | lib/insights client-safe compute; Supplier h1 CopyableText; product pie SSR enrich | REQ-0085
2026-07-12T15:40:00Z | red-team | REQ-0085 gates | lint ✓ test 399 ✓ invalidate 206 ✓ build ✓ | REQ-0085
2026-07-12T16:01:00Z | build-agent | REQ-0086 AC1–AC5 | Shared catalog detail list components; supplier SSR party enrich; stats/info parity | REQ-0086
2026-07-12T16:01:00Z | red-team | REQ-0086 gates | lint ✓ test 399 ✓ invalidate 206 ✓ build ✓ | REQ-0086
2026-07-12T16:05:00Z | build-agent | REQ-0087 AC1–AC3 | Pass loading prop to catalog list components; remove duplicate pulse wrappers | REQ-0087
2026-07-12T16:05:00Z | red-team | REQ-0087 gates | lint ✓ test 399 ✓ invalidate 206 ✓ build ✓ | REQ-0087
2026-07-12T16:55:00Z | build-agent | REQ-0088 full demo seed | demo-seed-data.ts + seed-demo-catalog; remove orphaned description script | REQ-0088
2026-07-12T16:55:00Z | build-agent | REQ-0089 audit user href | Admin-only user-management links on catalog info cards; no ownerProductsHref on audit rows | REQ-0089
2026-07-12T16:55:00Z | build-agent | REQ-0090 warehouse pie unallocated | unallocated slice + chart labels/badges reconcile catalog qty vs allocations | REQ-0090
2026-07-12T16:55:00Z | red-team | REQ-0088–0090 gates | lint ✓ test 406 ✓ invalidate 206 ✓ build ✓; reset-demo-db QA ✓ | REQ-0088, REQ-0089, REQ-0090
2026-07-12T17:05:00Z | build-agent | REQ-0091 Test Supplier naming | entity name aligned; verify by userId; create-demo-accounts backfill + catalog seed | REQ-0091
2026-07-12T17:05:00Z | red-team | REQ-0091 gates | lint ✓ test 411 ✓ invalidate 206 ✓ build ✓ | REQ-0091
2026-07-12T18:00:00Z | build-agent | REQ-0092 accounts-only seed | seedDemoAccountsOnly; robohash image; no default catalog; verify profile checks | REQ-0092
2026-07-12T18:35:00Z | red-team | REQ-0092 gates | lint ✓ test 413 ✓ invalidate 206 ✓ build ✓; reset-demo-db + verify ✓ (catalog 0) | REQ-0092
2026-07-12T19:00:00Z | build-agent | REQ-0093 role-nav-config DRY | Navbar + RouteWarmPrefetch share getNavPathsForRole | REQ-0093
2026-07-12T19:00:00Z | build-agent | REQ-0093 filter enabled gate | CategoryFilter/SupplierFilter skip fetch when browse override present | REQ-0093
2026-07-12T19:00:00Z | build-agent | REQ-0093 warm harden | Batched TanStack warm; logout ref reset; staggered router.prefetch | REQ-0093
2026-07-12T19:00:00Z | build-agent | REQ-0093 ApiStatus dedupe | Strict Mode cancel guard; remove debug ingest | REQ-0093
2026-07-12T19:20:00Z | red-team | REQ-0093 gates | lint ✓ test 413 ✓ invalidate 206 ✓ build ✓ | REQ-0093
2026-07-12T19:25:00Z | product-owner | REQ-0094 planned | Prod nav perf, detail UI, API dedupe — tomorrow session | REQ-0094
2026-07-13T09:45:00Z | build-agent | REQ-0094 Navbar Link prefetch | router.push → Link prefetch brand/nav/profile/mobile; nav-link-styles shared tokens | REQ-0094
2026-07-13T09:45:00Z | build-agent | REQ-0094 warm path extension | getWarmPathsForRole: nav + profile + admin sidebar; admin-nav-config DRY | REQ-0094
2026-07-13T09:45:00Z | build-agent | REQ-0094 shell hygiene | force-dynamic support-tickets/api-docs; admin redirect; ApiDocs mount skeleton removed | REQ-0094
2026-07-13T09:45:00Z | build-agent | REQ-0094 table prefetch | explicit prefetch on product/order/invoice # column Links | REQ-0094
2026-07-13T09:50:00Z | red-team | REQ-0094 gates | lint ✓ test 415 ✓ invalidate 205 ✓ build ✓; REQ-0075 smoke PASS | REQ-0094
2026-07-13T09:50:00Z | product-owner | REQ-0094 hover prefetch skipped | Link prefetch sufficient; no extra onMouseEnter warm | REQ-0094
2026-07-13T10:55:00Z | build-agent | REQ-0094 gap /admin warm | resolveWarmNavPath maps /admin → dashboard-overall-insights for RSC warm only | REQ-0094
2026-07-13T10:55:00Z | build-agent | REQ-0094 gap portal prefetch | explicit prefetch on portal/recent-order detail links (5 files) | REQ-0094
2026-07-13T10:55:00Z | build-agent | REQ-0094 gap invalidate docs | 205 correct — AdminSidebar inline fetch removed; docs synced | REQ-0094
2026-07-13T11:00:00Z | red-team | REQ-0094 gap gates | lint ✓ test 415 ✓ invalidate 205 ✓ build ✓ | REQ-0094
2026-07-13T12:40:00Z | build-agent | AuditUserDetailRow shared component | Merged name+email on catalog detail pages; CopyableText email | REQ-0095
2026-07-13T12:40:00Z | build-agent | EmailPreferencesPage GlassCard | SectionCardHeader; single padding layer; font-medium email | REQ-0095
2026-07-13T12:40:00Z | build-agent | CategoryDetailPage GlassCard shell | Remove article padding; match Supplier/Product pattern | REQ-0095
2026-07-13T12:40:00Z | build-agent | Insights inner padding trim | CatalogInsightsSection + WarehouseInsightsSection — shared GlassCard already pads | REQ-0095
2026-07-13T12:45:00Z | red-team | REQ-0095 gates | lint ✓ test 415 ✓ invalidate 205 ✓ build ✓ | REQ-0095
2026-07-13T12:55:00Z | build-agent | Shared GlassCard hub | `lib/ui/glass-card.tsx` + migrate 11 local copies; order-detail `padding="body"` default | REQ-0096
2026-07-13T12:55:00Z | build-agent | Order/invoice/warehouse audit SSR | `creator`/`updater` via `toParty`; `AuditUserDetailRow` on detail info cards | REQ-0096
2026-07-13T12:55:00Z | build-agent | Product section icon parity | Recent Orders + Warehouse Stock `SectionTitleRow` icon-only headers | REQ-0096
2026-07-13T12:55:00Z | red-team | REQ-0096 gates | lint ✓ test 418 ✓ invalidate 205 ✓ build ✓ | REQ-0096
2026-07-13T13:10:00Z | build-agent | SectionCardHeader titleTrailing | Inline HelpTooltip after card title; REQ-0097 email prefs | REQ-0097
2026-07-13T13:10:00Z | build-agent | Email prefs spacing | PageSectionHeader DETAIL_PAGE_HEADER_SPACING_CLASS; GlassCardBody | REQ-0097
2026-07-13T13:10:00Z | build-agent | Admin order audit rows | AdminOrderDetailContent creator/updater AuditUserDetailRow | REQ-0097
2026-07-13T13:10:00Z | build-agent | GlassCardBody catalog sweep | Category/Supplier/Product/Warehouse detail shell cards | REQ-0097
2026-07-13T13:10:00Z | build-agent | Insights shared GlassCard | CatalogInsightsSection + WarehouseInsightsSection padding=body | REQ-0097
2026-07-13T13:10:00Z | red-team | REQ-0097 gates | lint ✓ test 418 ✓ invalidate 205 ✓ build ✓ | REQ-0097
2026-07-13T13:45:00Z | build-agent | semantic-badges REQ-0098 | AdminOrderSource, ForecastUrgency, StockQuantityLeft, InventoryHealth, NotificationNew | REQ-0098
2026-07-13T13:45:00Z | build-agent | Admin portal UI sweep | Api GlassCardBody; dashboard CTAs; portal gap-6; notification dropdown | REQ-0098
2026-07-13T13:45:00Z | build-agent | Portal SSR image | client-portal + supplier-portal linked user image on table rows | REQ-0098
2026-07-13T13:45:00Z | red-team | REQ-0098 gates | lint ✓ test 418 ✓ invalidate 205 ✓ build ✓ | REQ-0098
2026-07-13T13:50:00Z | build-agent | AdminAnalytics gap-6 | Order/Invoice/Warehouse sections flex flex-col gap-6 | REQ-0099
2026-07-13T13:50:00Z | build-agent | Supplier portal userId seed | SupplierPortalSupplier.userId + AvatarInlineLink seed | REQ-0099
2026-07-13T13:50:00Z | build-agent | Dead stock scripts | Removed fix-product2/backfill/check-order npm + files | REQ-0099
2026-07-13T13:50:00Z | red-team | REQ-0099 gates | lint ✓ test 418 ✓ invalidate 205 ✓ build ✓ | REQ-0099
2026-07-13T13:57:00Z | build-agent | Avatar seed userId ?? id | Stale Redis supplierPortal cache may omit userId until TTL | REQ-0100
2026-07-13T13:57:00Z | build-agent | No cache-key bump | Avoid deploy-wide DB reload; UI fallback sufficient | REQ-0100
2026-07-13T15:08:00Z | build-agent | REQ-0102 enrichment consistency | Single enrichStockAllocationRows impl; warehouse SSR alias; remove dead enrichProductAllocationTotals; OrderLineWarehouseSelect gate; catalog copy DRY | REQ-0102
2026-07-13T15:02:00Z | build-agent | REQ-0102 enrichment parity | enrichStockAllocationRows unified API+product SSR; warehouse row catalog meta; AllocateStockDialog fetch gate | REQ-0102
2026-07-13T14:56:00Z | build-agent | REQ-0102 gap closure | Cross-warehouse totals on warehouse SSR/API; useUpdateStockAllocation; gated product form fetch; apply reconcile test | REQ-0102
2026-07-13T14:48:00Z | build-agent | Catalog reconcile on product PUT | Reserved floor + greedy unreserved shrink; sync Redis stock caches | REQ-0102
2026-07-13T14:48:00Z | build-agent | Warehouse delete blockers | Reserved allocations, active order picks, pending transfers → 409 | REQ-0102
2026-07-13T14:48:00Z | build-agent | ProductFormDialog shrink confirm | Client preview via shared pure reconcile lib | REQ-0102
2026-07-13T14:48:00Z | red-team | REQ-0102 gates | lint ✓ test 441 ✓ invalidate 208 ✓ build ✓ | REQ-0102
2026-07-13T13:57:00Z | red-team | REQ-0100 gates | lint ✓ test 418 ✓ invalidate 205 ✓ build ✓ | REQ-0100
2026-07-13T18:15:00Z | build-agent | Disjoint order reservation | Central order-stock-reservation helper; warehouse pick → allocation only | REQ-0103
2026-07-13T18:15:00Z | build-agent | committedQuantity list enrich | Display-only badge field; ProductFormDialog keeps raw DB fields | REQ-0103
2026-07-13T18:15:00Z | red-team | REQ-0103 gates | lint ✓ test 460 ✓ invalidate 208 ✓ build ✓ | REQ-0103
2026-07-13T18:22:00Z | build-agent | REQ-0104 committedQuantity parity | Detail SSR + forecast + supplier dashboard avail math | REQ-0104
2026-07-13T18:22:00Z | red-team | REQ-0104 gates | lint ✓ test 461 ✓ invalidate 208 ✓ build ✓ | REQ-0104
2026-07-13T18:30:00Z | build-agent | REQ-0105 product detail SSR | Single-product enrich + cache guard; CLAUDE.md un-ignored | REQ-0105
2026-07-13T18:30:00Z | red-team | REQ-0105 gates | lint ✓ test 464 ✓ invalidate 208 ✓ build ✓ | REQ-0105
2026-07-13T18:35:00Z | build-agent | REQ-0105 AC6 P3 DRY | ProductDetailPage uses getDisplayCommittedQuantity + warehouse fallback | REQ-0105
2026-07-14T09:48:00Z | orchestrator | Session bootstrap | Resume C2 from REQ-0105 @ 3cc5c4b; Red Team re-run PASS; Gate 2 still PENDING deploy+Sentry | REQ-0105, REQ-0009
2026-07-14T10:42:00Z | build-agent | REQ-0106 order auto-assign | Shared validator; server optional warehouse; client default auto | REQ-0106
2026-07-14T10:42:00Z | build-agent | REQ-0107 detail summary | formatCatalogAllocationDetailSummary + Warehouse Stock card | REQ-0107
2026-07-14T10:42:00Z | build-agent | REQ-0108 live validation | Reconcile preview hook; allocate minReserved floor | REQ-0108
2026-07-14T10:42:00Z | build-agent | REQ-0109 feedback tokens | DIALOG_FORM_FEEDBACK_* applied across dialogs | REQ-0109
2026-07-14T10:42:00Z | red-team | REQ-0106–0109 gates | lint ✓ test 479 ✓ invalidate 208 ✓ build ✓ | REQ-0106–0109
2026-07-14T13:10:00Z | build-agent | REQ-0110 gap closure | committedQuantity fallback; prefetch; bounds DRY; dialog shells | REQ-0110
2026-07-14T13:10:00Z | red-team | REQ-0110 gates | lint ✓ test 484 ✓ invalidate 208 ✓ build ✓ | REQ-0110
2026-07-14T13:20:00Z | build-agent | REQ-0111 workflow | Reactive hook; CreateLineItem; server message parity | REQ-0111
2026-07-14T13:20:00Z | red-team | REQ-0111 gates | lint ✓ test 486 ✓ invalidate 208 ✓ build ✓ | REQ-0111
2026-07-14T13:27:00Z | build-agent | REQ-0112 fetch DRY | Injected allocationRows; field.id stock errors | REQ-0112
2026-07-14T13:27:00Z | red-team | REQ-0112 gates | lint ✓ test 488 ✓ invalidate 208 ✓ build ✓ | REQ-0112
2026-07-14T13:34:00Z | build-agent | REQ-0113 warehouse select | Removed internal fetch; merged OrderFormData types | REQ-0113
2026-07-14T13:34:00Z | red-team | REQ-0113 gates | lint ✓ test 488 ✓ invalidate 208 ✓ build ✓ | REQ-0113
2026-07-14T14:52:00Z | build-agent | REQ-0114 stock UX + dialog parity | Catalog-commit hints; proportional pricing; DialogFormLabel; DetailInfoRowGroup; no invalidation changes | REQ-0114
2026-07-14T14:52:00Z | red-team | REQ-0114 gates | lint ✓ test 492 ✓ invalidate 208 ✓ build ✓ | REQ-0114
2026-07-14T16:59:00Z | build-agent | REQ-0115 dialog gap closure | mapWarehouseStockSummary; Invoice/Order/SupportTicket/Payment dialogs; ImageField + Category/Supplier labels | REQ-0115
2026-07-14T16:59:00Z | red-team | REQ-0115 gates | lint ✓ test 494 ✓ invalidate 208 ✓ build ✓ | REQ-0115
2026-07-14T17:12:00Z | build-agent | REQ-0116 UI closure | ProportionalPriceDisplay; dialog gaps; detail typography tokens | REQ-0116
2026-07-14T17:12:00Z | red-team | REQ-0116 gates | lint ✓ test 498 ✓ invalidate 208 ✓ build ✓ | REQ-0116
2026-07-14T18:15:00Z | build-agent | REQ-0117 dialog UX + admin tables | DialogFormLabel flex-safe; DialogDateField/DialogHeaderBrand; AdminEmbedDataTable; VS-045 audit doc-only | REQ-0117
2026-07-14T18:15:00Z | red-team | REQ-0117 gates | lint ✓ test 498 ✓ invalidate 208 ✓ build ✓ | REQ-0117
2026-07-14T18:22:00Z | build-agent | REQ-0118 popover sweep | Readable popover hub; PaymentDialog header; full filter/pagination sweep; hygiene | REQ-0118
2026-07-14T18:22:00Z | red-team | REQ-0118 gates | lint ✓ test 498 ✓ invalidate 208 ✓ build ✓ | REQ-0118
2026-07-14T18:30:00Z | build-agent | REQ-0119 gap closure | catalog popover parity; OrderAddressFields; business insights warehouse tab + SSR | REQ-0119
2026-07-14T18:30:00Z | red-team | REQ-0119 gates | lint ✓ test 504 ✓ invalidate 208 ✓ build ✓ | REQ-0119
2026-07-14T18:33:00Z | release | REQ-0117–0119 push | SHA 46127b2 → origin/main | REQ-0117, REQ-0118, REQ-0119
2026-07-15T09:35:00Z | orchestrator | Session bootstrap | Agile V activated; C2 REQ-0119 done; Gate 2 PENDING; Red Team re-run PASS (504 tests) | REQ-0008, REQ-0009
2026-07-15T09:52:00Z | build-agent | REQ-0120 gap closure | SSR sync insights; AdminEmbedDataTable; back-nav + post-delete navigateTo; dead code cleanup | REQ-0120
2026-07-15T09:52:00Z | red-team | REQ-0120 gates | lint ✓ test 504 ✓ invalidate 208 ✓ build ✓ | REQ-0120
2026-07-15T10:05:00Z | release | REQ-0120 push | SHA 9d7ec21 → origin/main | REQ-0120
2026-07-15T13:00:00Z | red-team | REQ-0120 docs commit re-verify | lint ✓ test 504 ✓ invalidate 208 ✓ build ✓ at HEAD 9d7ec21; docs-only diff cleared for commit | REQ-0120
2026-07-15T14:15:00Z | build-agent | REQ-0121 P0 investigation | Live browser repro (reset-demo-db → product qty 50→20 with 20 reserved) across same-page/cross-page/back-nav/dialog-reopen — no staleness reproduced at HEAD efb2e88; REQ-0120 already fixed it. Fixed adjacent defect: WarehouseDetailPage allocationRows fallback ternary masked live empty-array data with stale SSR snapshot | REQ-0121
2026-07-15T14:35:00Z | build-agent | REQ-0121 P1-P12 fixes | FAB onOpenChange wiring, date input color-scheme, supplier dropdown popover-foreground, warehouse-select rounded-md, popover content rounded-md sweep (25+ consumers via shared token), order-line plain subtotal, free-shipping <$100 tier, rich order picker + invoice summary, order/invoice table meta lines, product-dialog grid reorder, warehouse allocation copy capitalize/color + dedupe, product-detail layout fixes | REQ-0121
2026-07-15T14:42:00Z | red-team | REQ-0121 build-time catch | next build type-check failed: SemanticBadgeProps.size is "compact"|"detail" not "sm" (4 files); fixed via sed, re-verified | REQ-0121
2026-07-15T14:45:00Z | red-team | REQ-0121 gates | lint ✓ test 504 ✓ invalidate 208 ✓ build ✓ at HEAD efb2e88 + uncommitted REQ-0121 diff; not yet committed pending user go-ahead | REQ-0121
2026-07-15T14:25:00Z | build-agent | REQ-0122 instant UI | patch-mutation-cache + isDataSlotUnsettled + updatedAt SSR skip + catalog/stock hook patches + aggregate pulse wiring | REQ-0122
2026-07-15T14:25:00Z | red-team | REQ-0122 gates | lint ✓ test 516 ✓ invalidate 208 ✓ build ✓ | REQ-0122
2026-07-15T14:32:00Z | build-agent | REQ-0123 gap closure | patchOrderGraphListCaches + patchProductInPortalCaches; order/invoice/product/stock hooks; AdminMyActivity unsettled | REQ-0123
2026-07-15T14:32:00Z | red-team | REQ-0123 gates | lint ✓ test 518 ✓ invalidate 208 ✓ build ✓ | REQ-0123
2026-07-15T14:45:00Z | build-agent | REQ-0124 backlog | tickets/reviews/users list patch; soft-delete portal remove; walkthrough + CLAUDE docs | REQ-0124
2026-07-15T14:46:00Z | red-team | REQ-0124 gates | lint ✓ test ✓ invalidate ✓ build ✓ | REQ-0124
2026-07-15T15:00:00Z | build-agent | REQ-0125 gap closure | patchDetailCacheMerge; invoice optimistic DRY; admin list dashboard stats + split loading | REQ-0125
2026-07-15T15:01:00Z | red-team | REQ-0125 gates | lint ✓ test ✓ invalidate ✓ build ✓ | REQ-0125
2026-07-15T16:40:00Z | build-agent | REQ-0126 UI sweep | 12 order/invoice UI fixes — shared helpers, table columns, dialog dates, payment checkout; no TanStack/SSR changes | REQ-0126
2026-07-15T16:40:00Z | red-team | REQ-0126 gates | lint ✓ test 519 ✓ invalidate 208 ✓ build ✓ | REQ-0126
2026-07-15T17:25:00Z | build-agent | REQ-0127 detail parity | PersonInlineRow + table/forecast/recent-order/warehouse stock UI; read-only SSR statusAt + supplier email + warehouse address/type | REQ-0127
2026-07-15T17:25:00Z | red-team | REQ-0127 gates | lint ✓ test 522 ✓ invalidate 208 ✓ build ✓ | REQ-0127
2026-07-15T17:32:00Z | build-agent | REQ-0128 gap closure | dead getProductById; portal statusAt SSR; RecentOrderStatusColumn; warehouse type icons | REQ-0128
2026-07-15T17:32:00Z | red-team | REQ-0128 gates | lint ✓ test 527 ✓ invalidate 208 ✓ build ✓ | REQ-0128
2026-07-15T17:50:00Z | build-agent | REQ-0129 statusAt paidAt | invoice.paidAt for paid statusAt; OrderForPage.statusAt on list SSR/API; INVOICE_PATTERNS catalog+supplierPortal | REQ-0129
2026-07-15T17:50:00Z | red-team | REQ-0129 gates | lint ✓ test 528 ✓ invalidate 208 ✓ build ✓ | REQ-0129
2026-07-15T18:00:00Z | build-agent | REQ-0130 semantic dates | hub + ClientDate* semantic prop + order table statusAt | REQ-0130
2026-07-15T18:00:00Z | red-team | REQ-0130 gates | lint ✓ test 531 ✓ invalidate 208 ✓ build ✓ | REQ-0130
2026-07-15T18:03:00Z | build-agent | REQ-0131 gap closure | list table semantic dates; catalog paymentStatus; order meta ClientDate | REQ-0131
2026-07-15T18:15:00Z | build-agent | REQ-0132 date gap closure | CSV formatStableDate in 6 Filters; ClientDate* semantic in 3 UI surfaces | REQ-0132
2026-07-15T18:16:00Z | red-team | REQ-0132 gates | lint ✓ test 531 ✓ invalidate 208 ✓ build ✓ | REQ-0132
2026-07-15T18:21:00Z | build-agent | REQ-0132 gap sweep | support ticket ClientDateTime; check-all-data + invoice PDF formatStableDate | REQ-0132
2026-07-15T19:20:00Z | build-agent | REQ-0133 cache coherence | SSR sync guard; Redis patterns; persist trim; invalidateAfterCatalogChange; setCache re-warm guard | REQ-0133
2026-07-15T19:22:00Z | red-team | REQ-0133 gates | lint ✓ test 544 ✓ invalidate 213 ✓ build ✓ | REQ-0133
2026-07-15T19:35:00Z | build-agent | REQ-0134 session+QR+idle | JWT/cookie 1d; useSession focus refetch; QR second invalidate; gcTime 30m | REQ-0134
2026-07-15T19:36:00Z | red-team | REQ-0134 gates | lint ✓ test 544 ✓ invalidate 213 ✓ build ✓ | REQ-0134
2026-07-15T20:00:00Z | build-agent | REQ-0135 Redis pattern close | INVOICE+stock; SUPPLIER/WAREHOUSE portals; CATEGORY/SUPPLIER stock; AUTH/IMPORT portals | REQ-0135
2026-07-15T20:05:00Z | red-team | REQ-0134+0135 gates | lint/test/invalidate/build (see VALIDATION_SUMMARY) | REQ-0134,REQ-0135
2026-07-15T20:05:00Z | red-team | post-ship audit | wiring PASS; unused import fix; +pattern membership tests; manual §10 | REQ-0135
2026-07-15T20:05:00Z | product | QA order | UI blockers first, then MANUAL_TEST_FIXTURES §10 cache (do not mix) | REQ-0135
2026-07-15T20:20:00Z | product | EOD park | Keep Redis+SSR; no SPA rewrite; tomorrow short QA only A1/A2/B1; resume `tomorrow-QA` | REQ-0135
2026-07-15T20:20:00Z | product | codebook lesson | Infinity stale optional later; do not dump Redis for Gate 2 | REQ-0133
2026-07-16T11:40:00Z | product-owner | Session resume | Agile V active; resume `tomorrow-QA`; open REQ-0136 UI mismatch → §10 A1/A2/B1; HEAD `9a51387` clean | REQ-0136
2026-07-16T11:40:00Z | product-owner | Halt pending symptoms | UI mismatches mentioned but not listed — need route + expected vs actual before Orchestrate | REQ-0136
2026-07-16T11:45:00Z | build-agent | REQ-0137 explore seed | Expanded DEMO_CATALOG_SEED + seed-demo-catalog; --with-catalog on reset; ran seed on local DB | REQ-0137
2026-07-16T11:45:00Z | product-owner | QA path | Human explores seeded pages → report UI fixes under REQ-0136 before cache smoke | REQ-0136,REQ-0137
2026-07-16T12:45:00Z | build-agent | REQ-0138 product UI | Table QR/stock/dates; detail 3-col; warehouse summary; created→muted; capitalize reorder | REQ-0138
2026-07-16T12:45:00Z | product-owner | created semantic | Sky reserved for links; created dates muted gray globally | REQ-0138,REQ-0130
2026-07-16T13:28:00Z | build-agent | REQ-0139 product UI gaps | QR sky border; Created/Expire labels; stretch stats+icons; Catalog Allocation companion; ForecastUrgencyBadge; TYPO tokens | REQ-0139
2026-07-16T14:05:00Z | build-agent | REQ-0140 seed coherence | Beats product.reserved=0 (warehouse-pick only); Sony post-fulfill 99/49; sold=delivered|paid; insights qty−committed | REQ-0140
2026-07-16T14:05:00Z | red-team | REQ-0140 not live reservation bug | Live create/cancel/pay already disjoint; double 40 was seed-only | REQ-0140,REQ-0103
2026-07-16T15:40:00Z | build-agent | REQ-0141 cat/sup UI | List productCount+% + supplier email; drop Notes; Status badge by Created; grid Name·SKU + category; CatalogSnapshotCompanion | REQ-0141
2026-07-16T15:40:00Z | build-agent | List % = role-visible catalog share | No warehouse/order aggregates on list; companion from existing statistics/insights | REQ-0141
2026-07-16T15:45:00Z | red-team | REQ-0141 automated gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ | REQ-0141
2026-07-16T16:00:00Z | build-agent | REQ-0142 nest-button + share UX | Name/email siblings; HelpTooltip; productCount scoped to viewer userId | REQ-0142
2026-07-16T16:02:00Z | red-team | REQ-0142 automated gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ | REQ-0142
2026-07-16T16:30:00Z | build-agent | REQ-0143 detail meta polish | Party · separators; category sky link; invoice via getInvoiceLinkMap on recentOrders | REQ-0143
2026-07-16T16:32:00Z | red-team | REQ-0143 automated gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ | REQ-0143
2026-07-16T16:50:00Z | build-agent | REQ-0144 hydration + theme noise | Plain Stock/Product labels (no &amp; props); ThemeProvider filters React 19 script warn; forecasting gpt-4o-mini | REQ-0144
2026-07-16T16:52:00Z | red-team | REQ-0144 automated gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ | REQ-0144
2026-07-16T16:55:00Z | build-agent | Keep display "QR & Stock" | Plain ampersand string — entity was the bug, not the label text | REQ-0144
2026-07-16T17:10:00Z | build-agent | REQ-0145 order table Invoice # | Widen invoiceForOrder via getInvoiceLinkMap; align=start Status; product preview helper; orders:list:v2 | REQ-0145
2026-07-16T17:12:00Z | red-team | REQ-0145 automated gates | lint ✓ test 565 ✓ invalidate 213 ✓ build ✓ | REQ-0145
2026-07-16T17:18:00Z | release | Prod SHA 3c3a441 pushed origin/main | REQ-0144 + REQ-0145; redeploy Vercel | REQ-0145
2026-07-16T17:25:00Z | build-agent | REQ-0145 gap — SemanticEventDate | Product links; invoice nowrap; paid/cancelled/refunded events; orders:list:v3 | REQ-0145
2026-07-16T17:26:00Z | red-team | REQ-0145 gap gates | lint ✓ test 571 ✓ invalidate 213 ✓ build ✓ | REQ-0145
2026-07-16T17:27:00Z | release | Prod SHA c62d364 pushed origin/main | REQ-0145 gap; redeploy Vercel | REQ-0145
2026-07-16T17:30:00Z | product-owner | EOD park — resume tomorrow-UI-then-cache | Shipped 0141–0145; next human UI/calc then §10 A1/A2/B1 only | REQ-0136
2026-07-17T11:30:00Z | agile-v-core | Session activate — Infinity Loop | .agile-v intact; resume REQ-0136 UI explore before §10; skills 01+02+17+19 | REQ-0136,REQ-0008
2026-07-17T12:45:00Z | build-agent | REQ-0146 order detail density + strike fix | Equal-height tracking; glass UPS; strike only list>adj; trackingCarrier persist; related cards | REQ-0146
2026-07-17T12:50:00Z | red-team | REQ-0146 gates | lint ✓ test 572 ✓ invalidate 213 ✓ build ✓ | REQ-0146
2026-07-17T13:30:00Z | build-agent | REQ-0147 order detail gap closure | CarrierGlassBadge; Items|Summary; Parties+addresses stack; slate header Back; remove related cards | REQ-0147
2026-07-17T13:35:00Z | red-team | REQ-0147 gates | lint ✓ test 573 ✓ invalidate 213 ✓ build ✓ | REQ-0147
2026-07-17T14:40:00Z | build-agent | REQ-0148 summary total + line meta + light Back | Total text-sm sm:text-base; ProductLineItemsList · + invoice chip; light DETAIL_HEADER_BACK_ICON_CLASS | REQ-0148
2026-07-17T14:45:00Z | red-team | REQ-0148 gates | lint ✓ test 573 ✓ invalidate 213 ✓ build ✓ | REQ-0148
2026-07-17T14:50:00Z | build-agent | REQ-0148 Order Back parity | OrderDetailHeader variant=ghost + DETAIL_HEADER_BACK_ICON_CLASS (was default primary red) | REQ-0148
2026-07-17T14:55:00Z | build-agent | REQ-0149 line price + Owner/Buyer size | ProportionalPriceDisplay final base/strike xs; catalog AvatarInlineLink text-xs | REQ-0149
2026-07-17T14:58:00Z | red-team | REQ-0149 gates | lint ✓ test 573 ✓ invalidate 213 ✓ build ✓ | REQ-0149
2026-07-17T15:10:00Z | red-team | Pre-commit audit REQ-0146–0149 | UI/CSS+trackingCarrier only; no RQ/Redis/invalidate delta; ListIndexBadge dark text-gray-700; gates PASS | REQ-0146,REQ-0147,REQ-0148,REQ-0149
2026-07-17T15:12:00Z | release | Prod SHA 61c1e79 pushed origin/main | REQ-0146–0149 order detail polish | REQ-0146,REQ-0147,REQ-0148,REQ-0149
2026-07-17T15:35:00Z | build-agent | REQ-0150 invoice table + edit fixes | Cancel type=button; solid/opaque status Select; list:v2 enrich; dense columns | REQ-0150
2026-07-17T15:40:00Z | red-team | REQ-0150 gates | lint ✓ test 578 ✓ invalidate 213 ✓ build ✓ | REQ-0150
2026-07-17T16:20:00Z | build-agent | REQ-0151 edit submit + Order # badges | Zod date-only timestamps; onInvalid toast; linked order status/payment; due Clock | REQ-0151
2026-07-17T16:25:00Z | red-team | REQ-0151 gates | lint ✓ test 580 ✓ invalidate 213 ✓ build ✓ | REQ-0151
2026-07-17T17:00:00Z | build-agent | REQ-0152 partial pay sync + Pay toggle | derive/sync order payment from invoice money; Stripe amount+incremental webhook; PaymentMoneyBreakdown; admin checkout | REQ-0152
2026-07-17T17:10:00Z | red-team | REQ-0152 gates | lint ✓ test 593 ✓ invalidate 213 ✓ build ✓ | REQ-0152
2026-07-17T17:20:00Z | build-agent | REQ-0153 instant linked-order patch | patchLinkedOrderFromInvoiceMoney on invoice money CRUD; optimistic amountDue | REQ-0153
2026-07-17T17:25:00Z | red-team | REQ-0153 gates | lint ✓ test 595 ✓ invalidate 213 ✓ build ✓ | REQ-0153
2026-07-17T18:00:00Z | release | Prod SHA 122da3d pushed origin/main | REQ-0150–0153 invoice densify + partial pay + linked-order patch | REQ-0150,REQ-0151,REQ-0152,REQ-0153
2026-07-17T18:05:00Z | release | EOD park — resume REQ-0136 UI+§10; seed ORD-DEMO-002 partial; tip ea20bef | REQ-0136
2026-07-19T12:56:00Z | orchestrator | Agile V session activate (core+pipeline) | No re-bootstrap; resume REQ-0136 UI→§10→Gate2; tip 157c581 | REQ-0136
2026-07-19T11:16:20Z | build-agent | Invoice-money KPI partition (Paid/Partial/Due/Pending) | Order-total pending ignored mid-pay collected; no fake invoice status partial | REQ-0154
2026-07-19T11:16:20Z | build-agent | dashboard cache key v3 | New partialOrderAmount/partialCount semantics must not serve stale v2 payload | REQ-0154
2026-07-19T11:16:20Z | red-team | REQ-0154 gates | lint · test · invalidate · build | REQ-0154
2026-07-19T11:50:50Z | build-agent | Store Total Orders: Shipping + Delivered separate | Delivered was missing from KPI row while table showed Delivered | REQ-0155
2026-07-19T11:50:50Z | build-agent | Outstanding label → Due on AOV | Align with Revenue Due; My Activity used pendingUnpaidDue under wrong label | REQ-0155
2026-07-19T12:12:39Z | build-agent | My Activity order/invoice badges = store sets | Confirmed/Refund missing on self KPI | REQ-0156
2026-07-19T12:12:39Z | build-agent | buildStoreInvoiceStatusBadges | DRY store invoice KPI cards | REQ-0156
2026-07-19T12:18:49Z | build-agent | Portal order helper keeps In progress/Shipping | store Confirmed not portal model | REQ-0157
2026-07-19T12:18:49Z | build-agent | Test-only tsc hygiene | Vitest green; typecheck clean | REQ-0157
2026-07-19T13:00:46Z | build-agent | Keep userId+clientId; Self=null buyer | role-only userId collapses parties | REQ-0158
2026-07-19T13:00:46Z | build-agent | Client portal filter clientId + overview:v2 | creator userId showed 0 | REQ-0158

2026-07-19T15:45:00Z | build-agent | Buyer display + /invoices Self-only | placedBy/orderedBy/customerDisplay from resolveBuyerUserId; admin /invoices match /orders Self table; Store · labels; Redis list v5/v3 | REQ-0159

2026-07-19T15:50:00Z | build-agent | Remove dead store invoice list path | getStoreInvoicesForAdmin + API scope=store unused after Self-only /invoices; KPIs keep getStoreOrderIds | REQ-0159

2026-07-19T16:20:00Z | build-agent | Role-aware user overview copy + My Activity tip | Numbers unchanged; tip only isOwner store-owner | REQ-0160

2026-07-19T16:30:00Z | build-agent | Order/Invoice header HelpTooltips | Sibling of SortableHeader; shared tip copy hub | REQ-0161
2026-07-19T17:00:00Z | build-agent | Invoice Detail Order Detail layout parity | Reuse DetailInfoRow/SectionCardHeader/Items+Parties cards; hide empty dates; no invalidation | REQ-0162
2026-07-19T17:20:00Z | build-agent | Invoice items relatedOrder chip + SSR review context | Match OrderItemsCard; drop footer ghost Back; compact no Loader2 hydrate | REQ-0163
2026-07-19T17:35:00Z | build-agent | Compact review rating + owner-products party hrefs | Self gray name; Invoice Summary icon hues; no invalidation | REQ-0164

2026-07-20T11:17:00Z | orchestrator | Agile V session activate (core+pipeline) | No re-bootstrap — .agile-v intact (24 skills, runtime contracts); sync config.json resume_token + prod SHA; resume REQ-0136 Human UI explore → §10 A1/A2/B1 → Gate 2; tip 32711fa | REQ-0136,REQ-0008

2026-07-20T11:50:00Z | build-agent | REQ-0165 detail review UX | Parties self sky; detail audit href all roles; compact reviews left+hues; WriteEdit dialog parity; delete AlertDialog; eligibility patch before invalidate | REQ-0165
2026-07-20T11:52:00Z | red-team | REQ-0165 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0165
2026-07-20T11:58:00Z | build-agent | REQ-0166 catalog audit sky + drop PARTY_SELF | resolveDetailAuditUserHref on cat/sup/wh/product Updated; dead class removed | REQ-0166
2026-07-20T11:59:00Z | red-team | REQ-0166 gates | lint ✓ test 629 ✓ invalidate 213 ✓ build ✓ | REQ-0166
2026-07-20T12:18:00Z | build-agent | REQ-0167 compact review under price + dialog contrast | GLASS_COMPACT_AMBER; dialogTextClass; Cancel secondary+ghost | REQ-0167
2026-07-20T12:19:00Z | red-team | REQ-0167 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0167
2026-07-20T12:28:00Z | build-agent | Compact review same-row justify-between | rating left · edit/delete right full-width under line item | REQ-0167
2026-07-20T12:29:00Z | release | Pre-commit audit PASS — docs CLAUDE/walkthrough/agile-v; ship REQ-0165–0167 | REQ-0165,REQ-0166,REQ-0167
2026-07-20T13:00:00Z | build-agent | REQ-0168 admin/BI spacing + recent density | gap-6 BI; healthy reorder copy; ActivityLog mb-4; My Activity createOrderColumns embed; dashboard Latest 5 enrich + v4 cache | REQ-0168
2026-07-20T13:05:00Z | red-team | REQ-0168 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0168
2026-07-20T13:10:00Z | build-agent | REQ-0169 shell stats token + optional onEdit | PAGE_STATS_GRID_IN_SHELL_CLASS; hide Edit when no onEdit; My Activity embed | REQ-0169
2026-07-20T13:12:00Z | red-team | REQ-0169 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0169
2026-07-20T13:15:00Z | release | Ship REQ-0168–0169 tip b3155a9; docs CLAUDE/walkthrough/agile-v; resume REQ-0136 | REQ-0168,REQ-0169
2026-07-20T13:45:00Z | build-agent | REQ-0170 portal/dashboard denser cards + forecast shell | AvatarInlineLink/ProductThumb; cache v5/v2/v3; StatisticsCard+ChartCard ForecastingSection | REQ-0170
2026-07-20T13:50:00Z | red-team | REQ-0170 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0170
2026-07-20T14:00:00Z | build-agent | REQ-0171 forecast compact KPIs + denser cells | StatisticsCard compact; square supplier SafeImage (not Avatar); forecast cache v4 | REQ-0171
2026-07-20T14:05:00Z | red-team | REQ-0171 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0171
2026-07-20T14:35:00Z | build-agent | REQ-0172 forecast 2-line + AvatarInlineLink + table overflow-x | User override: circle ring like products table; Table overflow-auto caused nested Y scrollbar | REQ-0172
2026-07-20T14:40:00Z | red-team | REQ-0172 gates | lint ✓ test 630 ✓ invalidate 213 ✓ | REQ-0172
2026-07-20T14:45:00Z | build-agent | REQ-0173 Top Products dense cell + dashboard v6 | Extract DenseCatalogProductCell; enrich topProducts; font-medium headers | REQ-0173
2026-07-20T14:50:00Z | red-team | REQ-0173 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0173
2026-07-20T14:55:00Z | build-agent | REQ-0173 gap — category/supplier missing on Top Products | Stale TanStack dashboard from warm prefetch; bump overview v2 + Redis shape guard; empty SKU hide; show top 10 | REQ-0173
2026-07-20T15:05:00Z | build-agent | REQ-0174 recent cards clip + densify | CARD_LIST_META_ROW (no truncate); AvatarInlineLink ring/overflow; Orders 3-line; review category; dashboard v7 | REQ-0174
2026-07-20T15:10:00Z | red-team | REQ-0174 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0174
2026-07-20T15:15:00Z | build-agent | REQ-0175 portal meta clip parity | Admin Client/Supplier portal avatar rows → CARD_LIST_META_ROW_CLASS | REQ-0175
2026-07-20T15:20:00Z | red-team | REQ-0175 gates | lint ✓ test 630 ✓ invalidate 213 ✓ | REQ-0175
2026-07-20T15:25:00Z | build-agent | REQ-0176 recent meta gap + date-first | gap-1.5; Calendar·date before buyer/reviewer avatar (ring-offset vs ProductThumb) | REQ-0176
2026-07-20T15:30:00Z | red-team | REQ-0176 gates | lint ✓ invalidate 213 ✓ | REQ-0176
2026-07-20T15:35:00Z | build-agent | REQ-0177 portal densify + typography | SectionCardHeader; SSR product meta; supplierPortal v3 + clientPortal v4 + shape guards | REQ-0177
2026-07-20T15:40:00Z | red-team | REQ-0177 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0177
2026-07-20T15:45:00Z | build-agent | REQ-0178 supplier order buyer row | placedBy* SSR + AvatarInlineLink; supplierPortal Redis v4 | REQ-0178
2026-07-20T15:50:00Z | red-team | REQ-0178 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0178
2026-07-20T16:00:00Z | build-agent | REQ-0179 review dialog densify | getRatingDisplay on Select; DialogProductOptionRow; products list v3 party enrich | REQ-0179
2026-07-20T16:05:00Z | red-team | REQ-0179 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0179
2026-07-20T16:20:00Z | build-agent | REQ-0180 review table+detail densify | list/detail catalog enrich; productReviews:list:v2; Edit Review dialog; keep instant selects | REQ-0180
2026-07-20T16:25:00Z | red-team | REQ-0180 gates | lint ✓ test 630 ✓ invalidate 213 ✓ build ✓ | REQ-0180
2026-07-20T16:30:00Z | build-agent | REQ-0180 nit unused detail Redis key | Revert detail:v2→unversioned unused helper; AC2 list:v2 only; hasReviewListV2Shape unit test | REQ-0180
2026-07-20T16:35:00Z | red-team | REQ-0180 nit gates | lint ✓ test 635 ✓ invalidate 213 ✓ build ✓ | REQ-0180
2026-07-20T16:40:00Z | build-agent | REQ-0181 review edit-only dialog | Detail display-only; WriteEditReviewDialog allowStatusEdit Status Select | REQ-0181
2026-07-20T16:45:00Z | red-team | REQ-0181 gates | lint ✓ test 635 ✓ invalidate 213 ✓ build ✓ | REQ-0181
2026-07-20T16:50:00Z | build-agent | REQ-0182 review table Actions menu | ProductReviewActions View/Edit/Delete MoreVertical | REQ-0182
2026-07-20T16:55:00Z | red-team | REQ-0182 gates | lint ✓ test 636 ✓ invalidate 214 ✓ build ✓ | REQ-0182
2026-07-20T17:00:00Z | build-agent | REQ-0183 review detail UX polish | badge contrast; Status+Rating|Comment; purchase enrich; text-sm values | REQ-0183
2026-07-20T17:05:00Z | red-team | REQ-0183 gates | lint ✓ test 636 ✓ invalidate 214 ✓ build ✓ | REQ-0183
2026-07-20T17:10:00Z | build-agent | REQ-0184 restore edit dialog stack | drop 2-col/max-w-2xl; keep badge contrast | REQ-0184
2026-07-20T17:15:00Z | red-team | REQ-0184 gates | lint ✓ test 636 ✓ invalidate 214 ✓ build ✓ | REQ-0184
2026-07-20T17:25:00Z | product-owner | EOD park 2026-07-20 | shipped 0179–0184; tomorrow REQ-0185 tickets → 0186 warehouse → 0187 order dialog → 0136 | REQ-0185
2026-07-20T17:25:00Z | orchestrator | resume token | tomorrow-UI-tickets-warehouse-order → REQ-0185 | REQ-0185
2026-07-21T12:31:00Z | orchestrator | session activate | No re-bootstrap; C2 resume REQ-0185; 24 skills OK; Gate1 APPROVED Gate2 PENDING | REQ-0185
2026-07-21T12:31:00Z | product-owner | wave order | 0185 tickets → 0186 warehouse → 0187 order dialog → 0136 Gate2 | REQ-0185
2026-07-21T13:00:00Z | build-agent | REQ-0185 ticket densify | PersonNameEmailCell; Actions; dialog edit; list:v2; priority contrast | REQ-0185
2026-07-21T13:05:00Z | red-team | REQ-0185 gates | lint ✓ test 641 ✓ invalidate 215 ✓ build ✓ | REQ-0185
2026-07-21T13:10:00Z | build-agent | REQ-0188 Send-to Select clip+text | line-clamp override; OwnerSelectRow trigger/item surfaces | REQ-0188
2026-07-21T13:15:00Z | red-team | REQ-0188 gates | lint ✓ test 641 ✓ invalidate 215 ✓ build ✓ | REQ-0188
2026-07-21T13:20:00Z | build-agent | REQ-0189 ticket/review table polish | Subject&Description sky link; Comment sky link; muted date labels | REQ-0189
2026-07-21T13:25:00Z | red-team | REQ-0189 gates | lint ✓ test 641 ✓ invalidate 215 ✓ build ✓ | REQ-0189
2026-07-21T13:35:00Z | build-agent | REQ-0190 Send-to lock + Reassign | edit read-only; admin Reassign; API policy | REQ-0190
2026-07-21T13:40:00Z | red-team | REQ-0190 gates | lint ✓ test 648 ✓ invalidate 215 ✓ build ✓ | REQ-0190
2026-07-21T14:00:00Z | red-team | REQ-0190 pre-commit audit | plan ACs match; no invalidation gaps; docs sync | REQ-0190
2026-07-21T14:40:00Z | build-agent | REQ-0191 ticket detail redesign | RO cards; chat; notes header edit; footer CTAs; admin API | REQ-0191
2026-07-21T14:50:00Z | red-team | REQ-0191 gates | lint ✓ test 651 ✓ invalidate 217 ✓ build ✓ | REQ-0191
2026-07-21T14:55:00Z | build-agent | REQ-0192 message count parity | description+replies; shared helper; table/detail/KPI | REQ-0192
2026-07-21T15:00:00Z | red-team | REQ-0192 gates | lint ✓ test 656 ✓ invalidate 217 ✓ build ✓ | REQ-0192
2026-07-21T15:25:00Z | build-agent | REQ-0193 ticket UI gaps | reassign smooth; opening bubble; notes confirm; Status contrast | REQ-0193
2026-07-21T15:30:00Z | red-team | REQ-0193 gates | lint ✓ test 656 ✓ invalidate 217 ✓ build ✓ | REQ-0193
2026-07-21T15:35:00Z | release-manager | prod tip SHA 45fd5d6 | REQ-0191–0193 pushed origin/main | REQ-0193
2026-07-21T15:40:00Z | build-agent | REQ-0194 chat bubble glow | w-fit max-w-90%; opposing left/right gradients | REQ-0194
2026-07-21T15:45:00Z | red-team | REQ-0194 gates | lint ✓ test 656 ✓ invalidate 217 ✓ build ✓ | REQ-0194
2026-07-21T15:50:00Z | build-agent | REQ-0195 non-admin ticket parity | list href; detail cards; resolveStatusUpdate | REQ-0195
2026-07-21T15:55:00Z | red-team | REQ-0195 gates | lint ✓ test 659 ✓ invalidate 217 ✓ build ✓ | REQ-0195
2026-07-21T16:00:00Z | build-agent | REQ-0196 single GlassCard pad | strip inner p-2 sm:p-4 ticket+review detail | REQ-0196
2026-07-21T16:05:00Z | red-team | REQ-0196 gates | lint ✓ test 659 ✓ invalidate 217 ✓ build ✓ | REQ-0196
2026-07-21T16:20:00Z | build-agent | REQ-0197 product+reply+reassign | owner-scoped product picker; clear productId on reassign; resolveTicketReplyTarget | REQ-0197
2026-07-21T16:25:00Z | red-team | REQ-0197 gates | lint ✓ test 672 ✓ invalidate 217 ✓ build ✓ | REQ-0197
2026-07-21T17:10:00Z | build-agent | REQ-0198 dialog open smooth | same-route instant DeferredSelect; useSyncDialogOpenState; placeholder parity | REQ-0198
2026-07-21T17:15:00Z | red-team | REQ-0198 gates | lint ✓ test 675 ✓ invalidate 217 ✓ build ✓ | REQ-0198
2026-07-21T17:30:00Z | build-agent | REQ-0199 dialog Combobox | DIALOG_COMBOBOX_TRIGGER_CLASS; modal Popover + closeAutoFocus | REQ-0199
2026-07-21T17:35:00Z | red-team | REQ-0199 gates | lint ✓ test 675 ✓ invalidate 217 ✓ build ✓ | REQ-0199
2026-07-21T17:50:00Z | build-agent | REQ-0200 owner-scoped ticket products | GET owner-products; useSupportTicketOwnerProducts; Select value never undefined | REQ-0200
2026-07-21T17:55:00Z | red-team | REQ-0200 gates | lint ✓ test 677 ✓ invalidate 217 ✓ build ✓ | REQ-0200
2026-07-21T18:10:00Z | build-agent | REQ-0201 related product densify | DialogProductOptionRow price/qty; owner-products party; TicketRelatedProductDense; SSR snap | REQ-0201
2026-07-21T18:15:00Z | red-team | REQ-0201 gates | lint ✓ test 678 ✓ invalidate 217 ✓ build ✓ | REQ-0201
2026-07-21T18:30:00Z | build-agent | REQ-0202 detail no-flicker | SelectValue SSR labels; serverHasRicherDensify sync; supplier image; reviewerEmail | REQ-0202
2026-07-21T18:35:00Z | red-team | REQ-0202 gates | lint ✓ test 683 ✓ invalidate 217 ✓ build ✓ | REQ-0202
2026-07-21T18:40:00Z | docs | session EOD write-through | STATE/config/CLAUDE/walkthrough → resume REQ-0186 | REQ-0202

2026-07-22T10:22:32Z | orchestrator | Agile V session activate (core+pipeline) | No re-bootstrap — .agile-v intact (24 skills, runtime contracts); sync PLAYBOOK resume_token + prod SHA; resume REQ-0186 → 0187 → 0136; tip 8eb7cab | REQ-0186,REQ-0008

2026-07-22T10:50:00Z | build-agent | REQ-0186 warehouse UI | Type badge table; View Details; CopyableText name/address; dialog Select solid/opaque; WAREHOUSE_TYPE_OPTIONS | REQ-0186
2026-07-22T10:50:00Z | red-team | REQ-0186 gates | lint ✓ test 684 ✓ invalidate 217 ✓ build ✓ | REQ-0186

2026-07-22T11:07:00Z | build-agent | REQ-0186 gap closure | getWarehouseTypeLabel; drop WarehouseTypeOptionValue; Select value=type always controlled | REQ-0186
2026-07-22T11:07:00Z | red-team | REQ-0186 gap gates | lint ✓ warehouse-type 6 ✓ invalidate 217 ✓ | REQ-0186

2026-07-22T12:21:00Z | build-agent | REQ-0203 warehouse detail polish | header Status trailing; Info|Stock under stats; TYPO; stock row densify; Allocate/Transfer DialogProductOptionRow + destination badge; canManageStock includes user | REQ-0203
2026-07-22T12:21:00Z | red-team | REQ-0203 gates | lint ✓ test 685 ✓ invalidate 217 ✓ build ✓ | REQ-0203

2026-07-22T14:40:00Z | build-agent | REQ-0203 gap | muted SKU; catalog meta left + edit/delete inline; Transfer useProducts owner densify | REQ-0203
2026-07-22T14:40:00Z | red-team | REQ-0203 gap gates | lint ✓ test 685 ✓ invalidate 217 ✓ build ✓ | REQ-0203

2026-07-22T14:52:00Z | build-agent | REQ-0203 DRY | productSupplierImage/Id → ProductOptionRow; Allocate+Transfer import | REQ-0203
2026-07-22T14:52:00Z | red-team | REQ-0203 DRY gates | lint ✓ test 685 ✓ invalidate 217 ✓ build ✓ | REQ-0203

2026-07-22T14:58:00Z | release | Prod SHA 730813d pushed origin/main | REQ-0203 warehouse detail + gap + DRY | REQ-0203

2026-07-22T15:30:00Z | build-agent | REQ-0009 Sentry noise | order stock warn+disable; warehouse isDataSlotLoading; tracesSampleRate 0 dev; notif DELETE 404+warn | REQ-0009
2026-07-22T15:30:00Z | red-team | REQ-0009 gates | lint ✓ invalidate 217 ✓ logger/errors/sentry tests ✓ | REQ-0009

2026-07-22T15:52:00Z | build-agent | REQ-0187 dialog densify | Invoice picker/panel glass densify; Order line feedback stack; Cat/Sup STATUS parity; Order/Payment solid contrast | REQ-0187
2026-07-22T15:52:00Z | red-team | REQ-0187 gates | lint ✓ test 685 ✓ invalidate 217 ✓ build ✓ | REQ-0187

2026-07-22T16:04:00Z | build-agent | REQ-0187 gap column feedback | Subtotal under Product; Max/stockError/Auto-assign under Warehouse; drop full-width feedback band | REQ-0187
2026-07-22T16:04:00Z | red-team | REQ-0187 gap gates | lint ✓ invalidate 217 ✓ | REQ-0187

2026-07-22T16:24:00Z | build-agent | REQ-0187 picker densify | Product Combobox+DialogProductOptionRow+reserved; DialogWarehouseOptionRow type·avail; allocation type on pick options | REQ-0187
2026-07-22T16:24:00Z | red-team | REQ-0187 picker densify gates | lint ✓ test 685 ✓ invalidate 217 ✓ | REQ-0187

2026-07-22T16:53:00Z | build-agent | REQ-0204 supplier invoice view | getInvoiceByIdForSupplier + detail/PDF gate; Related Invoices nav; list header | REQ-0204
2026-07-22T16:53:00Z | red-team | REQ-0204 gates | lint ✓ test 688 ✓ invalidate 217 ✓ build ✓ | REQ-0204

2026-07-22T17:05:00Z | build-agent | REQ-0205 supplier invoice KPIs | SSR initialSupplierPortal + InvoiceList 4 portal StatisticsCards | REQ-0205
2026-07-22T17:05:00Z | red-team | REQ-0205 gates | lint ✓ test 688 ✓ invalidate 217 ✓ build ✓ | REQ-0205

2026-07-22T17:09:00Z | build-agent | REQ-0206 portal SSR sync | role portal.*Dashboard(userId); fix Order/Invoice/Product list sync | REQ-0206
2026-07-22T17:09:00Z | red-team | REQ-0206 gates | lint ✓ test 692 ✓ invalidate 217 ✓ build ✓ | REQ-0206

2026-07-22T15:32:00Z | release | Prod SHA b41cb11 pushed origin/main | REQ-0009 Sentry expected-client remediations | REQ-0009
