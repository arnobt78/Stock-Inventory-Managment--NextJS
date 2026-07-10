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
