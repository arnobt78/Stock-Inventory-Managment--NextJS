# Validation Summary — Cycle C1

**Generated:** 2026-07-17 pre-commit audit REQ-0146–0149  
**eval_gate_status:** PENDING (Human Gate 2)  
**Prod target SHA:** `61c1e79` (REQ-0146–0149)  
**Red Team:** PASS — lint/test573/invalidate213/build; no invalidate registry drift  
**Resume:** **REQ-0136** UI explore → §10 A1/A2/B1 (see STATE.md)

---

## REQ-0149 line price + Owner/Buyer size evidence

| Check | Result |
|-------|--------|
| Final price | `text-sm sm:text-base` via ProportionalPriceDisplay |
| Strike price | `text-xs sm:text-sm` |
| Owner/Buyer | `linkClassName="text-xs"` on catalog recent orders + product grid |
| Invalidation | unchanged |
| Gates | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0149 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0148 summary total + line meta + light Back evidence

| Check | Result |
|-------|--------|
| Total typo | Order + Invoice Summary `text-sm sm:text-base` |
| Line meta | · separators; Invoice FileText + CopyableText + sky Link |
| Header Back | light gray glass token + Order `variant="ghost"` (Product parity; was red default) |
| Invalidation | unchanged |
| Gates | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0148 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0147 order detail gap closure evidence

| Check | Result |
|-------|--------|
| Carrier | `CarrierGlassBadge` span — no shadcn Badge |
| Layout | Items\|Summary; Info\|(Parties+addresses); related cards removed |
| Invoice | DetailInfoRow in Order Information |
| Parties | admin sky hrefs |
| Header Back | slate glass, no ghost |
| Invalidation | unchanged |
| Gates | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0147 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0146 order detail density evidence

| Check | Result |
|-------|--------|
| Status + tracking | equal-height `layout="stack"` + glass carrier badge |
| Body grids | Created/Updated row; Shipping\|Billing; related cards |
| Strike | dual-price only when list > adjusted |
| trackingCarrier | updateOrderSchema + prisma + admin mutate |
| Invalidation | unchanged |
| Gates | lint ✓ test **572** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0146 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## EOD park 2026-07-16

| Area | Status |
|------|--------|
| REQ-0137–0145 | done + pushed `origin/main` |
| UI explore (REQ-0136) | in progress — continue tomorrow |
| §10 cache A1/A2/B1 | **not started** — after UI/calc OK |
| Gate 2 Sentry 24h | blocked on smoke |

```
Scope: parked | Traceability: REQ-0136, REQ-0144–0145 | Findings: PASS (shipped); PENDING (human QA)
Commands: lint, test, invalidate, build (571 / 213)
```

---

## REQ-0145 orders table Invoice # evidence

| Check | Result |
|-------|--------|
| Status/Payment | `SemanticEventDate` icons + semantic hues |
| Order # | clickable product links + meta icons |
| Invoice # | 2-line nowrap; paid/cancelled/refunded/due event |
| SSR | InvoiceLinkFields + sentAt/cancelledAt; orders:list:v3 |
| Invalidation | unchanged |
| Gates | lint ✓ test 571 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0145 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0144 products hydration + theme evidence

| Check | Result |
|-------|--------|
| Stock header | `label="QR & Stock"` (plain `&`; no `&amp;` props) |
| Product header | `label="Product & SKU"` |
| ThemeProvider | Dev-only filter for next-themes script false positive |
| Forecasting model | `openai/gpt-4o-mini` |
| Invalidation | unchanged |
| Gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0144 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0143 detail meta polish evidence

| Check | Result |
|-------|--------|
| Product grid | Owner · Supplier |
| Recent orders | SKU · Category · Qty; Owner · Buyer; INV when linked |
| SSR | category + invoiceForOrder via getInvoiceLinkMap |
| Invalidation | unchanged |
| Gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0143 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0142 cat/sup polish evidence

| Check | Result |
|-------|--------|
| Nest button | Name control + email CopyableText siblings |
| Supplier & Email | product-like avatar \| name \| email stack |
| Products tooltip | `HelpTooltip` + `CATALOG_PRODUCT_SHARE_TOOLTIP` |
| Count scope | groupBy `userId` = viewer |
| Detail headers | iconTile + subtitle Products/Recent Orders |
| Gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0142 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0141 category/supplier UI evidence

| Check | Result |
|-------|--------|
| List enrich | `productCount` + supplier `email`; home + GET lists |
| Tables/export | Notes removed; Products count · %; CSV Products |
| Detail Status | Badge by Created; no top STATUS strip |
| Product grid | Name · SKU; category link; SSR category on supplier products |
| Stock companion | `CatalogSnapshotCompanion` → no pie `lg:col-span-2` |
| Invalidation | unchanged |
| Gates | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0141 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0140 seed stock coherence evidence

| Check | Result |
|-------|--------|
| Beats seed | `product.reservedQuantity=0`; Main alloc reserved 20 |
| Sony seed | catalog 99; Main alloc 49 (post ORD-DEMO-001 fulfill) |
| Sold filter | `isOrderCountedAsSold` — delivered or paid |
| Insights stock | `qty − committed` in product/catalog insights |
| Manual fixtures | §9 REQ-0140 floor documented |
| Re-seed spot-check | Beats committed **20**, avail **30**; Sony qty **99** / Main **49** |
| Gates | lint ✓ test 556 ✓ invalidate 213 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0140 | Findings: PASS
Commands: lint, test, invalidate, build, reset-demo-db --with-catalog
```

---

## REQ-0125 loading parity evidence

| Check | Result |
|-------|--------|
| patchDetailCacheMerge | helper + test + export |
| useUpdateInvoice | optimistic detail + list; patchDetailCache rollback |
| Admin support/users | prefetchListPageStats + split loading predicates |
| Client tickets | unsettled stat cards + loading table |

```
Scope: built/verified | Traceability: REQ-0125 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0124 secondary entities evidence

| Check | Result |
|-------|--------|
| Support/reviews/users | list+detail patch before invalidate |
| Soft-delete portal | `removeProductFromPortalCaches` on soft + hard delete |
| Docs | PROJECT_WALKTHROUGH §7 Instant UI; CLAUDE compact block |
| Stock transfer / dashboard KPI | invalidate-only / pulse-only (documented) |

```
Scope: built/verified | Traceability: REQ-0124 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0123 instant UI gap closure evidence

| Check | Result |
|-------|--------|
| Order graph lists | `patchOrderGraphListCaches` on orders/invoices create/update/cancel/send |
| Portal browse | `patchProductInPortalCaches` + `removeProductFromPortalCaches` on product CRUD |
| Stock delete | `removeStockAllocationFromCaches` wired with scoped delete input |
| Admin activity | `isAnyDataSlotUnsettled` on stat cards |
| Dashboard KPIs | pulse-only (intentional — no client-side aggregate patch) |

```
Scope: built/verified | Traceability: REQ-0123 | Findings: PASS
Commands: lint, test 518, test:invalidate 208, build
```

---

## REQ-0122 instant UI evidence

| Check | Result |
|-------|--------|
| Cache patch | `patchDetailCache` + `patchListCaches` on catalog CRUD hooks before invalidate |
| SSR sync | `resolveSsrSyncAction` skips when cached `updatedAt >= server` |
| Pulse | `isDataSlotUnsettled` on dashboard/portal/forecast/stock aggregates |
| Dialog | `mutateAsync` + patch in `onSuccess` before close |
| Invalidation registry | audit accepts `patchDetailCache`; 208 checks pass |

```
Scope: built/verified | Traceability: REQ-0122 | Findings: PASS
Commands: lint, test 516, test:invalidate 208, build
```

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

## REQ-0121 — UI/data-sync bug sweep (2026-07-15)

**Repro method:** Live browser QA against `npm run dev` (Redis + Mongo dev instances) using `reset-demo-db` → admin login → created category/warehouse/product (Sony TV, SK34, qty 50, $50) → allocated 20 to Main Warehouse → created 20-unit order (auto-assign) → edited product qty 50→20.

**P0 finding:** Every reproduction path (same-page mutation, cross-page nav via Link, browser back-button to a pre-mutation-cached page, dialog reopen) showed correct fresh data at HEAD `efb2e88` (post-REQ-0120). No repro. Found and fixed one adjacent real defect: `WarehouseDetailPage.tsx` `allocationRows` fallback ternary would keep showing frozen SSR `initialStockAllocations` whenever the live query resolved to `[]` (e.g. last allocation deleted) — changed to `stockAllocations ?? initialStockAllocations ?? []`.

**P1–P12 findings:** Visually confirmed via live browser (zoomed screenshots) before fixing: date-field placeholder near-invisible in dark dialog (P2), supplier dropdown item text white-on-white in light popover (P3), order-line subtotal showing fee-adjusted total instead of plain line amount at qty 120 (P6), order fee tier producing total > subtotal on a $1000 test order (P7 — server totals confirmed client-only computation, no server duplicate to sync). Remaining items (P1, P4, P5, P8–P12) fixed from code-level analysis matching existing sibling patterns (Category dropdown readability, `OrderPickerCommand`'s existing `rounded-md`, other FAB dialogs' `onOpenChange`).

**Build-time catch:** First `next build` after AC9/AC10 failed TypeScript check — `SemanticBadgeProps.size` is `"compact" | "detail"`, not `"sm"`; fixed across 4 files, gate re-run clean.

**Gates:** lint ✓ · test 504/504 ✓ · invalidate 208/208 ✓ · build ✓ (all re-verified after the size-prop fix, HEAD `efb2e88` + uncommitted REQ-0121 changes).

**Not yet committed** — 15 files changed, pending user go-ahead to commit/push.

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
- [ ] Confirm Vercel prod SHA = `9d7ec21` (REQ-0120)
- [ ] Sentry 24h: no OAuth state error, no ErrorBoundary removeChild on admin/suppliers nav (REQ-0009)
- [ ] Manual: supplier product → category/supplier detail read-only (REQ-0029)
- [ ] Manual: dialog UX + admin portal embed tables (REQ-0117)
- [ ] Manual: Beats order stock walkthrough after `reset-demo-db` (REQ-0103–0113; `MANUAL_TEST_FIXTURES.md` §9)
- [ ] Manual: back-nav (history/support-ticket) + post-delete redirect (REQ-0120)
- [ ] Commit + push REQ-0121; confirm prod SHA after deploy (REQ-0121)
- [ ] Manual: order/invoice UI sweep smoke on prod (REQ-0126)
- [ ] Manual: detail person rows + product table + forecast parity (REQ-0127)
- [ ] Manual: portal recent orders statusAt + warehouse type icons (REQ-0128)

**Approver:** _pending_  
**Date:** _pending_

---

## EOD 2026-07-15 → Tomorrow Gate-2 QA

**Left:** REQ-0133–0135 shipped (`177cac2`); unit gates PASS; **manual cache + UI not run**.

**Tomorrow (short — do not full-matrix):**

| Order | Task | Done when |
|------|------|-----------|
| 0 | Redeploy Vercel + re-login | Cookie/JWT 1d |
| 1 | UI blockers only | Can open lists/dialogs without broken chrome |
| 2 | §10 A1 product edit + 5 min | No revert |
| 3 | §10 A2 back from detail | List shows update |
| 4 | §10 B1 invoice paid → stock | No revert |
| 5 | Stop / optionally one-CRUD each domain | Record PASS/FAIL here |

**Defer:** Infinity staleTime, full B2–D, every role×route. Record results under this section after QA.

---

## REQ-0136 — Session 2026-07-16 (UI → cache smoke)

**Status:** in_progress — product UI blockers closed (REQ-0138); cache smoke next

| Order | Task | Result |
|------|------|--------|
| 0 | Explore seed (REQ-0137) | PASS — local DB seeded |
| 1 | UI mismatches (product list/detail) | PASS — REQ-0138 |
| 2 | §10 A1 | _pending_ |
| 3 | §10 A2 | _pending_ |
| 4 | §10 B1 | _pending_ |

```
Scope: product UI fixed | Traceability: REQ-0138,REQ-0136 | Findings: PASS UI; FLAG cache TBD
```

---

## REQ-0138 — Product table + detail UI parity (2026-07-16)

**Scope:** Stock QR box parity, colored available qty, Created/Exp. text-xs + sort, muted created dates, detail 3-col media, warehouse summary always colored, spacing/icon tiles.

**Gates:** lint ✓ · test 551/551 ✓ · invalidate 213/213 ✓ · build ✓

```
Scope: built/verified | Traceability: REQ-0138 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0139 — Product UI gap closure (2026-07-16)

**Scope:** QR sky border + reserved=SKU mute; Created/Expire full labels; Status/Stock/Price icons + column stretch; ForecastUrgencyBadge; Catalog Allocation companion; TYPO_CARD_TITLE/SUBTITLE.

**Gates:** lint ✓ · test 551/551 ✓ · invalidate 213/213 ✓ · build ✓

```
Scope: built/verified | Traceability: REQ-0139 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0137 — Full explore demo seed (2026-07-16)

**Scope:** Opt-in catalog seed with 1–2 connected rows per user-facing entity + stub models.

| Entity | Count |
|--------|-------|
| Users / Test Supplier | 3 / 1 |
| Local Parts Co supplier | 1 |
| Categories / Warehouses / Products | 2 / 2 / 2 |
| Allocations / Transfers | 3 / 1 |
| Orders / Invoices | 2 / 2 |
| Tickets / Reviews / Notifications | 2 / 2 / 3 |
| Imports / SystemConfig / Audits | 2 / 2 / 2 |
| Stubs | 6 models × 1 |

**Commands:** `script:seed-demo-catalog` ✓ · `verify-demo-accounts` ✓

```
Scope: built/seeded | Traceability: REQ-0137 | Findings: PASS
```

---

## REQ-0135 — Redis invalidate pattern asymmetry (2026-07-15)

**Scope:** `INVOICE_PATTERNS` +`stockAllocation`; supplier/warehouse/auth/import portal parity; category/supplier +stock for enrich labels. Shipped with REQ-0134. Post-audit: unused import removed; pattern membership tests (+5).

**Gates:** lint ✓ · test 549/549 ✓ · invalidate 213/213 ✓

**Evidence summary**

```
Scope: audited + hardened | Traceability: REQ-0134,REQ-0135 | Findings: PASS (wiring OK; manual Gate-2 tomorrow)
Commands: lint, test, test:invalidate
```

---

## REQ-0134 — Session TTL + QR re-invalidate + idle nav (2026-07-15)

**Scope:** 1d JWT+cookie align; auth `refetchOnWindowFocus`; product QR second Redis wipe; `gcTime` 30m.

**Gates:** lint ✓ · test 544/544 ✓ · invalidate 213/213 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0134 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0133 — Cache coherence hardening (2026-07-15)

**Scope:** SSR sync skip guard; Redis pattern widen; TanStack persist auth/user only; `invalidateAfterCatalogChange`; `setCache` re-warm block on all cached GET paths.

**Gates:** lint ✓ · test 544/544 ✓ · invalidate 213/213 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0133 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0132 — Final date gap closure (2026-07-15)

**Scope:** CSV/Excel export `formatStableDate` (6 filters); semantic `ClientDate*` (portals, activity log, reviews, support tickets); PDF + dev script DRY — display/export only.

**Gates:** lint ✓ · test 531/531 ✓ · invalidate 208/208 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0132 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0131 — REQ-0130 gap closure (2026-07-15)

**Scope:** List table semantic dates + catalog `paymentStatus` — CSS/UI + read-only SSR field.

**Gates:** lint ✓ · test 531/531 ✓ · invalidate 208/208 ✓ · build ✓

---

## REQ-0130 — semantic dates + order table statusAt (2026-07-15)

**Scope:** CSS/UI only — semantic date hub + order table statusAt column.

**Gates:** lint ✓ · test 531/531 ✓ · invalidate 208/208 ✓ · build ✓

---

**Scope:** Read-only SSR enrichment + invoice cache invalidation widen — TanStack invalidation registry unchanged.

**Gates:** lint ✓ · test 528/528 ✓ · invalidate 208/208 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0129 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0128 — REQ-0127 gap closure (2026-07-15)

**Scope:** Read-only SSR enrichment + shared UI/DRY cleanup — no TanStack/invalidation changes.

**Gates:** lint ✓ · test 527/527 ✓ · invalidate 208/208 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0128 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0127 — Detail & table UI parity sweep (2026-07-15)

**Scope:** CSS/UI/layout + read-only SSR enrichment — no TanStack mutation, Redis invalidation, or API write changes.

**Gates:** lint ✓ · test 522/522 ✓ · invalidate 208/208 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0127 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0126 — Order/invoice UI bug sweep (2026-07-15)

**Scope:** CSS/UI/layout only — no TanStack, Redis, SSR, or invalidation changes.

**Gates:** lint ✓ · test 519/519 ✓ · invalidate 208/208 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0126 | Findings: PASS
Commands: lint, test, test:invalidate, build
```
