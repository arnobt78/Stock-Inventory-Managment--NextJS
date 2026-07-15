# Validation Summary — Cycle C1

**Generated:** 2026-07-15  
**eval_gate_status:** PENDING (Human Gate 2)  
**Prod target SHA:** `46127b2` (REQ-0117–0119)  
**Red Team:** lint ✓ test 504 ✓ invalidate 208 ✓ build ✓ (2026-07-15 REQ-0120)

---

## REQ-0120 nav invalidation + SSR sync evidence

| Check | Result |
|-------|--------|
| Business Insights SSR sync | `useSyncSsrQueryDataMany` — products, orders, warehouse summary keys |
| Admin My Activity table | `AdminEmbedDataTable` + column defs (REQ-0117 AC4 closure) |
| Back nav | `useBackWithRefresh("history")`, `("support-ticket")` |
| Post-delete nav | `navigateTo` on product/category/supplier/warehouse detail delete success |
| Dead code | Removed unused warehouse select props; OrderDialog/LoginRoleSelect imports |
| Docs | Duplicate REQ-0051 backlog entry removed |
| Invalidation registry | unchanged — no new mutation paths |

```
Scope: built/verified | Traceability: REQ-0120 | Findings: PASS
Commands: lint, test 504, test:invalidate 208, build
```

---

## REQ-0106 order auto-assign evidence

| Check | Result |
|-------|--------|
| Shared validator | `validateOrderLineStock` — auto catalog cap + manual warehouse cap |
| Server createOrder | `needsPick && !warehouseId` allowed — product-path reserve |
| OrderDialog | Submit disabled uses committed available; auto-assign default |
| OrderLineWarehouseSelect | Optional picker; "Auto-assign warehouses" sentinel |
| Manual fixture | `MANUAL_TEST_FIXTURES.md` §9 Beats path |

---

## REQ-0107 product detail summary evidence

| Check | Result |
|-------|--------|
| Detail summary | `formatCatalogAllocationDetailSummary` on Warehouse Stock card |
| Badges | catalog avail + in-warehouses counts |
| Invalidation | unchanged — derives from existing hooks |

---

## REQ-0108 live validation evidence

| Check | Result |
|-------|--------|
| Product edit | `useCatalogQuantityReconcilePreview` — live block + shrink preview |
| Allocate edit | `minReserved` floor in `StockQuantityField` |
| Submit gate | disabled when reconcile `!ok` or below reserved |

---

## REQ-0113 warehouse select fetch removal evidence

| Check | Result |
|-------|--------|
| Props-only select | No `useStockByProduct` in `OrderLineWarehouseSelect` |
| Required rows | `allocationRows` + `allocationsLoading` from parent hook |
| Types merge | `OrderFormData` in `OrderDialogCreateLineItem.tsx`; `.types.ts` deleted |
| Invalidation | unchanged |

```
Scope: built/verified | Traceability: REQ-0113 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0112 order line fetch DRY evidence

| Check | Result |
|-------|--------|
| Single fetch | Hook returns `allocationRows`; warehouse select skips internal query when injected |
| Options DRY | `buildOrderLineWarehousePickOptions` shared lib |
| Stock errors | `lineStockErrors` keyed by `field.id`; prune on remove; reset on dialog close |
| Invalidation | unchanged — no registry changes |

```
Scope: built/verified | Traceability: REQ-0112 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0111 order stock workflow evidence

| Check | Result |
|-------|--------|
| Reactive validation | `useOrderLineStockValidation` + `useStockByProduct` |
| Submit ensure | `ensureStockAllocationsAndValidate` before create |
| Manual error DRY | `OrderLineWarehouseSelect.manualPickError` from parent |
| Server parity | `validateWarehousePick` → `Max {n} at {name}` |
| Catalog DRY | `prisma/order.ts` uses `getOrderLineCatalogAvailable` |
| Invalidation | unchanged — no registry changes |

```
Scope: built/verified | Traceability: REQ-0111 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0110 stock UX gap closure evidence

| Check | Result |
|-------|--------|
| Order cap fallback | `getOrderLineCatalogAvailableFromProduct` + `resolveOrderLineHasAllocations` |
| Prefetch | `prefetchStockByProduct` on OrderDialog product select |
| Warehouse errors | Manual pick `Max {n} at {warehouseName}` |
| Bounds DRY | `getAllocationQtyBounds` in validate + AllocateStockDialog |
| Reserve test | Auto-assign qty 40 → product `reservedQuantity` only |
| Dialog shells | ProductForm `DIALOG_EDGE_SCROLL_*`; Allocate `DIALOG_FORM_FEEDBACK_ROW` |
| Invalidation | unchanged — no registry changes |

```
Scope: built/verified | Traceability: REQ-0110 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0109 dialog feedback tokens evidence

| Check | Result |
|-------|--------|
| Tokens | `DIALOG_FORM_FEEDBACK_*` in `dialog-edge-scroll.ts` |
| Applied | ProductForm, Order, OrderLineWarehouseSelect, StockQuantityField |

---

## REQ-0105 product detail committedQuantity SSR evidence

| Check | Result |
|-------|--------|
| Single enrich | `enrichProductDetailWithCommittedQuantity` — one allocation sum query |
| Detail SSR/API | `getProductDetailForPage` enriches after transform |
| Cache guard | Stale Redis entries without `committedQuantity` refetch |
| Display UI | `ProductDetailPage` — `getDisplayCommittedQuantity` + warehouse fallback |
| CLAUDE.md | Removed from `.gitignore`; REQ-0103/0104/0105 sections tracked |
| Invalidation | unchanged — `PRODUCT_PATTERNS` clears `products:*` on order/stock CRUD |

---

## REQ-0104 committedQuantity parity evidence

| Check | Result |
|-------|--------|
| Category/supplier detail SSR | `enrichProductsWithCommittedQuantity` + cache guard |
| ForecastingCard | `getDisplayCommittedQuantity` for avail |
| demand-forecast + supplier-dashboard | `computeCommittedQuantity` with batch allocation sum |
| Invalidation | unchanged — ORDER_GRAPH clears categories/suppliers/forecasting |

---

## REQ-0103 disjoint reservation evidence

| Check | Result |
|-------|--------|
| Reserve create | Warehouse pick → allocation only; no pick → product only |
| Cancel / fulfill | `releasePendingOrderLines` / `fulfillPendingOrderLines` in order + webhook + invoice |
| Catalog floor | Beats scenario: 20 reserved blocks at 10, not 40 |
| List display | `committedQuantity` on products/browse/home APIs |
| UI badges | `getDisplayCommittedQuantity` on table + detail summary |

---

## REQ-0102 enrichment consistency evidence

| Check | Result |
|-------|--------|
| Single enrich impl | `enrichStockAllocationRows` only; `enrichWarehouseAllocationRows` alias |
| All SSR paths | `product-stock-data.ts` + `warehouse-stock-data.ts` use `enrichStockAllocationRows` |
| Dead code removed | `enrichProductAllocationTotals` deleted |
| Fetch gates | ProductFormDialog, AllocateStockDialog, OrderLineWarehouseSelect |
| DRY catalog copy | `formatCatalogAllocationSummary` shared helper |

---

## REQ-0102 enrichment parity evidence

| Check | Result |
|-------|--------|
| Unified enrich | `enrichStockAllocationRows` on API GET all scopes + product SSR |
| Product SSR | `product-stock-data.ts` shared transform + cross-warehouse totals |
| Warehouse row UI | Catalog / allocated / unallocated meta on `WarehouseStockAllocationRow` |
| Allocate dialog gate | `useStockByProduct({ enabled: open && activeProductId })` |
| Dead script | `fix-product2-stock.ts` absent |

---

## REQ-0102 gap closure evidence

| Check | Result |
|-------|--------|
| Warehouse cross-totals | `enrichStockAllocationRows` on SSR + API all list scopes |
| Edit allocation | `useUpdateStockAllocation` + AllocateStockDialog PUT in edit mode |
| Product form gate | `useStockByProduct({ enabled: open && selected })` |
| Reconcile apply test | `apply-catalog-quantity-reconcile.test.ts` |
| Dead script | `fix-product2-stock.ts` absent |

---

## REQ-0102 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0102 |
| Unit tests | `npm run test` | PASS (449) | REQ-0102 |
| Invalidation audit | `npm run test:invalidate` | PASS (208) | REQ-0102 |
| Build | `npm run build` | PASS | REQ-0102 |
| Catalog reconcile | `planCatalogQuantityReconcile` + product PUT transaction | PASS | REQ-0102 AC1–2 |
| Allocation guards | POST/PUT `validateAllocationUpsert` | PASS | REQ-0102 AC3 |
| Warehouse delete | `getWarehouseDeleteBlockers` 409 | PASS | REQ-0102 AC4 |
| Archived rows | `isArchived` enrich + read-only warehouse row | PASS | REQ-0102 AC5 |

---

## REQ-0100 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0100 |
| Unit tests | `npm run test` | PASS (418) | REQ-0100 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0100 |
| Build | `npm run build` | PASS | REQ-0100 |
| Avatar seed fallback | `seed={s.userId ?? s.id}` on supplier portal | PASS | REQ-0100 AC1 |
| No cache bump | supplierPortal Redis key unchanged | PASS | REQ-0100 AC2 |

---

## REQ-0099 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0099 |
| Unit tests | `npm run test` | PASS (418) | REQ-0099 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0099 |
| Build | `npm run build` | PASS | REQ-0099 |
| Analytics gap-6 | Order/Invoice/Warehouse sections | PASS | REQ-0099 AC1 |
| Supplier avatar seed | `userId` on SSR + AvatarInlineLink | PASS | REQ-0099 AC2 |
| Dead scripts | 3 npm entries + files removed | PASS | REQ-0099 AC3 |

---

## REQ-0098 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0098 |
| Unit tests | `npm run test` | PASS (418) | REQ-0098 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0098 |
| Build | `npm run build` | PASS | REQ-0098 |
| Api GlassCardBody | ApiStatus + ApiDocs inner padding | PASS | REQ-0098 AC1 |
| QR truncate | QRCodeHover max-width + product name title | PASS | REQ-0098 AC2 |
| Glow badges | AdminOrderSource, forecast urgency, stock left, health, New | PASS | REQ-0098 AC3–4 |
| Dashboard CTAs | AdminAnalytics recent cards + AI glass button | PASS | REQ-0098 AC5–6 |
| Portal parity | gap-6, SectionCountBadge, AvatarInlineLink + SSR image | PASS | REQ-0098 AC7–8 |
| Activity + notifications | Activity Logs icon; dropdown counter/inline New/Close | PASS | REQ-0098 AC9–10 |

---

## REQ-0097 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0097 |
| Unit tests | `npm run test` | PASS (418) | REQ-0097 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0097 |
| Build | `npm run build` | PASS | REQ-0097 |
| SectionCardHeader titleTrailing | Email prefs inline HelpTooltip | PASS | REQ-0097 AC1 |
| Email prefs spacing | PageSectionHeader pb-0 + gap-6 parent | PASS | REQ-0097 AC1 |
| Admin order audit | AdminOrderDetailContent creator/updater rows | PASS | REQ-0097 AC2 |
| GlassCardBody DRY | 4 catalog detail pages + EmailPreferences | PASS | REQ-0097 AC3 |
| Insights GlassCard | shared import + padding=body | PASS | REQ-0097 AC4 |

---

## REQ-0096 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0096 |
| Unit tests | `npm run test` | PASS (418) | REQ-0096 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0096 |
| Build | `npm run build` | PASS | REQ-0096 |
| GlassCard hub | `lib/ui/glass-card.tsx` + 11-file migration | PASS | REQ-0096 AC1 |
| Audit SSR + UI | order/invoice/warehouse creator/updater | PASS | REQ-0096 AC2 |
| Product section icons | Recent Orders + Warehouse Stock SectionTitleRow | PASS | REQ-0096 AC3 |
| Tests | warehouse-detail-data + transform-order-detail | PASS | REQ-0096 AC4 |

---

## REQ-0095 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0095 |
| Unit tests | `npm run test` | PASS (415) | REQ-0095 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0095 |
| Build | `npm run build` | PASS | REQ-0095 |
| Portal header pb-6 | ClientPortalPage + SupplierPortalPage | PASS — removed pb-0 override | REQ-0095 AC1 |
| Support tickets header | SupportTicketsPageContent PageSectionHeader | PASS | REQ-0095 AC2 |
| Email prefs glass | EmailPreferencesPage GlassCard + SectionCardHeader | PASS | REQ-0095 AC3 |
| Audit user row | AuditUserDetailRow on catalog detail pages | PASS | REQ-0095 AC4 |
| Section icons | Category/Supplier SectionTitleRow icons | PASS | REQ-0095 AC5 |
| Card padding | CategoryDetailPage shell; insights inner trim; WarehouseDetailPage | PASS | REQ-0095 AC6 |

---

## REQ-0094 evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | REQ-0094 |
| Unit tests | `npm run test` | PASS (415) | REQ-0094 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | REQ-0094 |
| Build | `npm run build` | PASS | REQ-0094 |
| Navbar Link prefetch | code review | PASS — brand, nav, profile, mobile | REQ-0094 AC2 |
| Extended RSC warm | `getWarmPathsForRole` | PASS — nav + profile + admin sidebar | REQ-0094 |
| Client filter leak | `CategoryFilter` enabled gate | PASS — no fetch when override | REQ-0094 AC3 |
| REQ-0075 smoke | code review | PASS — no regressions | REQ-0094 AC4 |
| /admin warm redirect fix | `resolveWarmNavPath` | PASS — warms dashboard not redirect | REQ-0094 gap |
| Portal detail prefetch | 5 portal/recent-order files | PASS | REQ-0094 gap |
| Invalidate count note | AdminSidebar logout fetch removed REQ-0094 | INFO — 205 correct (not regression) | REQ-0094 gap |

---

### Manual / production (REQ-0094)

| Check | Result | REQ-ID |
|-------|--------|--------|
| Prod `npm start` nav click baseline | PENDING user QA on Vercel | REQ-0094 AC1/AC2 |
| Sentry 24h after deploy | PENDING | REQ-0009 AC5 |

---

## Automated evidence

| Check | Command | Result | REQ-IDs |
|-------|---------|--------|---------|
| Lint | `npm run lint` | PASS | ALL |
| Unit tests | `npm run test` | PASS (413) | REQ-0092 |
| Invalidation audit | `npm run test:invalidate` | PASS (205) | ALL |
| Build | `npm run build` | PASS | ALL |
| Typecheck (touched scripts) | `tsc --noEmit` | PASS | REQ-0056 |

---

## Manual / production

| Check | Result | REQ-ID |
|-------|--------|--------|
| AI insights 200 + `provider: groq` | PASS (user verified) | REQ-0005 |
| Notification bell dropdown visible | PASS (code + prod reachable) | REQ-0007 |
| Supplier category/supplier detail from product | PENDING user QA | REQ-0029 |
| removeChild nav smoke | PENDING | REQ-0001, REQ-0006, REQ-0017 |
| Sentry 24h regression | PENDING (checklist in REVALIDATION_LOG) | REQ-0009 |
| Gmail OAuth login + navbar avatar before/after profile dropdown click | PASS (user screenshot 2026-07-10) | REQ-0039, REQ-0040 |
| Vercel prod SHA = `73060a1` | PENDING confirm | ALL |
| CRUD delete fast (no 504) | PASS (local dev: category/supplier/warehouse DELETE ~150ms) | REQ-0052 |

---

## Findings

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| VS-007 | INFO | ChunkLoadError auto-reload in ErrorBoundary | PASS |
| VS-008 | INFO | OrderDialog RHF validation logger level | PASS |
| VS-009 | INFO | Hydration /admin/dashboard-overall-insights | PASS (REQ-0019 stable formatters) |
| VS-010 | INFO | OAuth state mismatch logger.warn | PASS |
| VS-011 | INFO | Radix portal removeChild scrub + ErrorBoundary | PASS |
| VS-012 | INFO | Groq model chain migration (REQ-0018) | PASS |
| VS-013 | INFO | Forecasting AI max_tokens + cache v2 (REQ-0019) | PASS |
| VS-014 | INFO | Locale-aware admin formatting (REQ-0020) | PASS |
| VS-015 | INFO | Shell-first nav + data-slot pulse (REQ-0021) | PASS |
| VS-016 | INFO | Tier-3 user detail shell-first gap (REQ-0022) | PASS |
| VS-017 | INFO | Admin detail shell-first gap (REQ-0023) | PASS |
| VS-018 | INFO | Shell-first consistency + detail SSR + order DRY (REQ-0024) | PASS |
| VS-019 | INFO | P3 SSR gaps: ghost fetches, detail secondary, client browse (REQ-0026) | PASS |
| VS-020 | INFO | Client owner dropdown hang fix (ProductOwnerSelect) | PASS |
| VS-021 | INFO | REQ-0027 shallow ownerId URL + deferred admin warm | PASS |
| VS-022 | INFO | Glass badges + invoice list scope (REQ-0028) | PASS (automated) |
| VS-024 | INFO | Auth login/register UX polish (REQ-0030) | PASS (automated) |
| VS-025 | INFO | Auth left panel list + brand redesign (REQ-0031) | PASS (automated) |
| VS-026 | INFO | Auth glass parity, flat list, BG animation (REQ-0032) | PASS (automated) |
| VS-027 | INFO | Auth copy, scroll shift, icon glow, spacing (REQ-0033) | PASS (automated) |
| VS-028 | INFO | Auth welcome/goodbye session toasts (REQ-0034) | PASS (automated + user QA) |
| VS-029 | INFO | Google OAuth welcome toast (REQ-0035) | PASS (automated) |
| VS-030 | INFO | Glass button tokens + Batch A/B migration (REQ-0047) | PASS (automated) |
| VS-031 | INFO | Auth light mode + dialog tables + order thumbs (REQ-0048) | PASS (automated) |
| VS-032 | INFO | Portal & detail UX polish (REQ-0071) | PASS (automated) |
| VS-033 | INFO | REQ-0075 gap closure (REQ-0076) | PASS (automated) |
| VS-034 | INFO | Chart labels, portal headers, product detail UX (REQ-0077) | PASS (automated) |
| VS-035 | INFO | Badge nesting hydration fix on /client (REQ-0078) | PASS (automated) |
| VS-036 | INFO | Client UI polish — badges, spacing, avatars (REQ-0079) | PASS (automated) |
| VS-037 | INFO | Stat badge revert + slate section counters (REQ-0080) | PASS (automated) |
| VS-038 | INFO | Client owner picker + category detail parity (REQ-0081) | PASS (automated) |
| VS-039 | INFO | Category gap closure + non-blocking forecast (REQ-0082) | PASS (automated) |
| VS-040 | INFO | Category forecast loading shell parity (REQ-0083) | PASS (automated) |
| VS-041 | INFO | Detail insights parity + forecast SSR sync (REQ-0084) | PASS (automated) |
| VS-042 | INFO | Stock UX clarity + dialog/detail UI parity (REQ-0114) | PASS (automated) |
| VS-043 | INFO | REQ-0114 dialog gap closure + warehouse summary test (REQ-0115) | PASS (automated) |
| VS-044 | INFO | Dialog parity + proportional price DRY + detail typography (REQ-0116) | PASS (automated) |
| VS-045 | INFO | Dialog UX parity + admin embed tables + admin network audit (REQ-0117) | PASS (automated + audit doc) |
| VS-046 | INFO | Readable popover full sweep + prod network confirm (REQ-0118) | PASS (automated) |
| VS-047 | INFO | Catalog popover parity + order address labels + warehouse rollup (REQ-0119) | PASS (automated) |

**Evidence summary (REQ-0114):** Scope: built/verified | Traceability: REQ-0114 | Findings: PASS | Commands: lint, test 492, test:invalidate 208, build

**Evidence summary (REQ-0115):** Scope: built/verified | Traceability: REQ-0115 | Findings: PASS | Commands: lint, test 494, test:invalidate 208, build

**Evidence summary (REQ-0116):** Scope: built/verified | Traceability: REQ-0116 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0117):** Scope: built/verified | Traceability: REQ-0117 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0118):** Scope: built/verified | Traceability: REQ-0118 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0119):** Scope: built/verified | Traceability: REQ-0119 | Findings: PASS | Commands: lint, test 504, test:invalidate 208, build

### VS-045 — Admin network audit (REQ-0117, read-only)

| Pattern | Sample | Verdict |
|---------|--------|---------|
| RSC prefetch `*_rsc=` | 200–650 ms repeat nav | Expected — `RouteWarmPrefetch` idle + staggered `router.prefetch` |
| Cold list API (`orders`, `products`) | 1.0–2.0 s | Expected — MongoDB + Redis miss on Vercel |
| `session` / `jwe` | 20–290 ms | Expected |
| High total requests (~292–453) | Warm prefetch + TanStack warm + RSC | Expected aggregate — **no duplicate API call proven** |
| Admin My Activity hooks | `useOrders`/`useProducts`/… + SSR `initial*` + `useSyncSsrQueryDataMany` | OK — `withInitialData` / `refetchOnMount:false` pattern (REQ-0021) |

**Recommendation:** Defer prefetch reduction unless HAR shows same endpoint twice on single page mount (confirmed VS-046).

### VS-046 — Production network confirm (REQ-0118)

**Verdict: OK for production** — timings are acceptable for this architecture; not a bug.

| Signal | Range | Status |
|--------|-------|--------|
| Repeat RSC nav | 96–650 ms | Good — warm prefetch working |
| Cold list API | 1.0–2.0 s | Expected — Mongo + Redis miss on serverless |
| session/jwe | 20–290 ms | Normal |
| High request count | ~292–453 | Intentional warm tradeoff — no duplicate proven |
| CRUD instant UI | `invalidateAllRelatedQueries` + `useBackWithRefresh` + SSR `initialData` | Unchanged — no regression |

---

## Dev manual QA (2026-07-08, cold `.next`)

| Role | First compile | Repeat nav | Detail first | Detail repeat | Notes |
|------|---------------|------------|--------------|---------------|-------|
| Admin | RSC 700ms–1.05s | 96–211ms | 1.1–2.7s | 175–477ms | Login warm-prefetch expected |
| Supplier | RSC 400–735ms | 388–401ms | 385–521ms | — | Re-test category link post-REQ-0029 |
| Client | browse-meta 277ms | RSC 249–323ms | 322–601ms | — | Owner dropdown 7 items |

---

## Human Gate 2 checklist

- [x] Deploy REQ-0010–0013 (`9a2e37c`)
- [x] Deploy REQ-0014/0015 (`f5e0461`)
- [x] Deploy REQ-0016/0017 (`20d9d49`)
- [x] Deploy REQ-0018 (`2c1cf32`)
- [x] Deploy REQ-0019 (`4f02cf3`)
- [x] Deploy REQ-0020 (`21d7fc4`)
- [x] Push REQ-0021 (`733681a`)
- [x] Push REQ-0022–0029 (`3ebb4db`)
- [ ] Confirm Vercel prod SHA = `46127b2` (REQ-0117–0119)
- [ ] Sentry 24h: no OAuth state error, no ErrorBoundary removeChild on admin/suppliers nav (REQ-0009)
- [ ] Manual: supplier product → category/supplier detail read-only (REQ-0029)
- [ ] Manual: dialog UX + admin portal embed tables (REQ-0117)
- [ ] Manual: Beats order stock walkthrough after `reset-demo-db` (REQ-0103–0113; `MANUAL_TEST_FIXTURES.md` §9)

**Approver:** _pending_  
**Date:** _pending_
