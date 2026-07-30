# Validation Summary — Cycle C1

**Generated:** 2026-07-27 (REQ-0136 statusAt + hydration)
**eval_gate_status:** PENDING (Human Gate 2)
**Active:** Prod smoke after this deploy
**Last ship:** statusAt under badges + ClientRelativeTime harden

---

## REQ-0136 — statusAt under badges + hydration date sweep (2026-07-27)

| Check | Result |
| ----- | ------ |
| resolveOrderStatusAt | updatedAt fallback for confirmed/processing/pending |
| useUpdateOrder | always patch statusAt when resolved |
| use-invoices | statusAt on optimistic + create/update/send |
| Missing date | "—" (pulse only while dataLoading) |
| ClientRelativeTime | suppressHydrationWarning |
| Gates | lint ✓ order-status + ssr-sync tests ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0136, REQ-0009 | Findings: PASS
```

---

## REQ-0136 — Idle badge harden + Fix B + hydration (2026-07-27)

| Check | Result |
| ----- | ------ |
| Fix A | intact — invalidated/fetching → refetch only |
| Idle badge | apply only when `serverAt > cachedAt`; equal/missing → skip |
| Fix B | `applyDensifyOnly` + `mergeSsrIntoCache` / `mergeDensifyOnly` |
| Hydration | `toDateOrNull`; gated ClientRelativeTime on catalog/warehouse headers |
| Gates | lint ✓ test 748 ✓ invalidate 221 ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0136, REQ-0009 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0136 — Fix B (merge not replace) + hydration-unsafe date fallback (2026-07-27, prior draft)

**Trigger:** User-reported recurring badge-revert + Sentry `STOCK-INVENTORY-3` Hydration Error on `/orders/[id]` (prod, 27 events/6 users, regressed).

**Scope:**
- `lib/react-query/ssr-sync-policy.ts` — added `"applyDensifyOnly"` action + `mergeSsrIntoCache`/`mergeDensifyOnly`. The already-shipped `bf6d9f6` fix (Fix A) stops trusting differing SSR badges while a mutation is invalidated/fetching. This adds Fix B: even the remaining "apply" paths now **merge** onto cached (gap-fill densify fields; overlay-merge for proven-fresher/empty-cache cases) instead of a blind `setQueryData(serverData)` full replace, so a thinner/differently-shaped SSR snapshot can never silently drop or clobber an already-patched field.
- `hooks/use-sync-ssr-query-data.ts` — consumes the new action.
- `lib/date/format-stable.ts` (+ `lib/format` barrel) — new `toDateOrNull`. Replaced the `order?.createdAt ? new Date(...) : new Date()` anti-pattern (fallback to "now" differs between SSR render time and client hydration time — a textbook hydration-mismatch source) across all 7 detail pages: Order (store + admin), Invoice, Product, Category, Supplier, Warehouse. Also gated 3 previously **ungated** `ClientRelativeTime`/`ClientDateTime` renders (Category/Supplier/Warehouse header + Warehouse "Created" row rendered unconditionally, not behind `dataLoading`) — the more likely reproducible mismatch source than the already-`dataLoading`-gated Order page.
- Verified Cursor's already-committed Top Products `groupBy(productId)` + collapse-duplicates fix (dashboard-data.ts / AdminAnalyticsContent.tsx) — correct, no changes needed.
- No debug instrumentation found in working tree (already clean before this session's edits).

**Gates:** lint ✓ · tsc ✓ · test 746/746 ✓ (+8 new merge-helper tests) · invalidate 221/221 ✓ · build ✓

**Evidence summary**

```
Scope: built/verified | Traceability: REQ-0136 | Findings: PASS
Decision Points: kept Fix A (bf6d9f6) as-is; added Fix B as pure-additive safety net (no resolveSsrSyncAction test regressions); hydration fix is defense-in-depth — could not conclusively prove it is the exact STOCK-INVENTORY-3 trigger without Sentry's Diff Viewer HTML, but it is the only concrete non-determinism source found in that render tree and the 3 ungated pages are a stronger repro candidate
Log: 2026-07-27 | build-agent | REQ-0136 Fix B + hydration harden | REQ-0136, REQ-0009
```

**Not committed/pushed** — holding for explicit go-ahead since the prior push (`bf6d9f6`) started the Gate-2 Sentry 24h watch; another deploy now would restart that clock.

---

## REQ-0136 — Gate-2 cache smoke §10 A1/A2/B1 (2026-07-27)

**Scope:** No code changes — live browser verification only (dev server + demo catalog seed, admin role). AC1–2 (UI mismatch pass) previously closed via REQ-0141–0187 child REQs.

**Method:** `npm run script:reset-demo-db -- --with-catalog` → `npm run dev` → Playwright browser session logged in as `test@admin.com`.

| Check | Action | 0s | ~5 min / nav-away+back | Result |
|-------|--------|----|-------------------------|--------|
| A1 | Edit product "Beats"→"Beats Pro", qty 50→55 (catalog) | List/detail/category/supplier grids all show Beats Pro, 35 avail, 20 reserved | Same values held after 5 min background wait + `/` → back navigation | PASS |
| A2 | List → click product (Link nav) → detail → Back | — | Back returned to list showing "Beats Pro" 35/20 reserved, not stale "Beats" 30 | PASS |
| B1 | Invoice INV-DEMO-002 Sent/$100-of-$3980 → Edit → Status Paid, Amount Paid 3980 | Invoice detail: Paid, $0.00 due; Order ORD-DEMO-002 paymentStatus instantly "Paid" (order-graph patch) | Same after 5 min + nav away/back — no revert to Sent/partial | PASS |

Warehouse/product reserved qty (20) correctly unchanged by B1 — order stays `Confirmed` (not `Delivered`), so disjoint-reservation stock stays held per REQ-0103; this is expected, not a bug.

**Gates:** lint ✓ · test 738/738 ✓ · invalidate 221/221 ✓ · build ✓ (no code changes)

**Evidence summary**

```
Scope: validated | Traceability: REQ-0136 (AC3–6) | Findings: PASS (3/3 smoke checks)
Decision Points: no code changes needed; disjoint-reservation "no release on paid" behavior confirmed correct per REQ-0103, not a regression
Log: 2026-07-27 | red-team-verifier | REQ-0136 §10 A1/A2/B1 cache smoke PASS | REQ-0136
```

**Remaining before Gate 2:** Sentry 24h watch (REQ-0009) — human-observed, cannot be automated from this session.

---

## Session activate — 2026-07-27 (core + pipeline)

```
Scope: resume/activate | Traceability: REQ-0136, REQ-0008 | Findings: FLAG (human QA pending)
Decision Points: no re-bootstrap; .agile-v intact (24 skills + runtime contracts); resume gate2-0136-cache-smoke
Log: 2026-07-27 | orchestrator | session activate | Infinity Loop ready | REQ-0136
```

**Next:** Sentry 24h watch (REQ-0009) → Gate 2 (`eval_gate_status` PASS).

---

## REQ-0213 — Educational README + Diploi (2026-07-26)

| Check | Result |
| ----- | ------ |
| README | learner guide; badges; env; APIs; reuse; SECURITY link |
| Diploi | Deploying subsection + launch-big button |
| App/invalidation | unchanged (docs-only) |
| Gates | N/A app build (docs) |

```
Scope: built/verified | Traceability: REQ-0213 | Findings: PASS
Commands: docs review
```

---

## REQ-0212 — Vercel deploy unblock (2026-07-26)

| Check | Result |
| ----- | ------ |
| Lockfile | `eslint-import-resolver-typescript` → `3.10.1.tgz` (direct dep) |
| Merge items | always `OrderItem[]` (`previous ?? []`) |
| Dates | `Order` + `OrderTrackingInfo` `string \| Date` |
| Invalidation | unchanged (patch→invalidate) |
| Gates | `tsc` ✓ lint ✓ invalidate **221** ✓ merge tests ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0212 | Findings: PASS
Commands: tsc, lint, test:invalidate, build
```

---

## REQ-0211 harden — instant badges + items densify (2026-07-25)

| Check | Result |
| ----- | ------ |
| Order update | merge detail + `patchLinkedInvoicesFromOrder` (status+payment) |
| Ship label/track | `patchOrdersOnShipping` + API `shippedAt` |
| Cancel | merge detail (parties); `patchInvoicesOnOrderCancel` |
| SSR lists | `listHasFresherStatusBadges` apply while invalidated |
| Line items | `mergeOrderItemsPreservingDensify` on PUT |
| Debug | ingest removed |
| Gates | lint ✓ test **738** ✓ invalidate **221** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0211 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0209 — Stripe return, confirm-on-pay, Cancel vs Refund (2026-07-25)

| Check | Result |
| ----- | ------ |
| Stripe return | `buildStripeCheckoutReturnUrls` — admin → `/admin/...`; store → `/orders|invoices/...` |
| First money | pending + partial\|paid → confirmed + fulfill once; partial→paid no re-fulfill |
| Actions | Cancel unpaid\|partial; Process Refund fully paid (store + admin) |
| Confirm copy | `order-destructive-copy` — partial mentions refund $X |
| Stock cancel | restore product + allocations after fulfill-on-first-money |
| Debug | agent fetch logs removed from back-nav + admin detail |
| Invalidation | unchanged (`invalidateAfterOrderGraphChange` on delete) |
| Gates | lint ✓ test **708** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0209 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0208 — Admin order detail parity (2026-07-25)

| Check | Result |
| ----- | ------ |
| Status badges | admin read-only (no inline Select); edit via OrderDialog |
| Action bar | shared `OrderDetailActionBar` store+admin; paid|partial→Process Refund |
| Partial cancel | `orderCancelShouldRefundPayment` → Stripe + paymentStatus `refunded` |
| Back | admin `fallbackPath=/admin/orders` (log-proven) |
| Cards | Customer/Invoice/Refund removed; Shipping right column + densify dialog |
| Parties User ID | avatar | name·email / User ID start-aligned |
| Scroll | html/body overflow hidden (non-auth); `#main-content` only |
| Invalidation | unchanged (`invalidateAfterOrderGraphChange`) |
| Gates | lint ✓ test **696** ✓ invalidate **217** ✓ |

```
Scope: built/verified | Traceability: REQ-0208 | Findings: PASS (await post-fix repro)
Commands: lint, test, test:invalidate
```

---

## Session activate 2026-07-25

```
Scope: resume/activate | Traceability: REQ-0136, REQ-0008 | Findings: FLAG (human QA pending)
Decision Points: no re-bootstrap; .agile-v intact (24 skills + runtime contracts); resume gate2-0136-cache-smoke
Log: 2026-07-25 | orchestrator | session activate | Infinity Loop ready | REQ-0136
```

**Next:** Human UI explore (AC1–2) → §10 A1/A2/B1 (AC3–5) → record here → Sentry 24h (REQ-0009) → Gate 2.

---

## Session activate 2026-07-24

```
Scope: resume/activate | Traceability: REQ-0136, REQ-0008 | Findings: FLAG (human QA pending)
Decision Points: no re-bootstrap; sync stale config/PLAYBOOK → STATE
Log: 2026-07-24 | orchestrator | session activate | Infinity Loop ready | REQ-0136
```

---

## REQ-0207 SECURITY.md (2026-07-23)

| Check | Result |
| ----- | ------ |
| File | root `SECURITY.md` — private email, scope, out-of-scope |
| README | link + Security section |
| App code | unchanged |
| Gates | docs-only N/A |

```
Scope: built/verified | Traceability: REQ-0207 | Findings: PASS
Commands: docs-only
```

---

## REQ-0206 Portal SSR sync key alignment (2026-07-22)

| Check | Result |
| ----- | ------ |
| Helpers | `portal.supplierDashboard|clientDashboard|clientCatalogDashboard(userId)` |
| Hooks/warm | use helpers (same array shape as before) |
| Lists | Order/Invoice/Product sync role keys (not admin overview) |
| Admin portals | `supplierPortal` / `clientPortal` unchanged |
| Invalidation | unchanged (`portal.all` already clears role dashboards) |
| Gates | lint ✓ test **692** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0206 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0205 Supplier Related Invoices state cards (2026-07-22)

| Check | Result |
| ----- | ------ |
| SSR | `/invoices` supplier → `prefetchListPageStats` → `initialSupplierPortal` |
| Cards | same 4 as supplier `/orders` via `useSupplierPortalDashboard` |
| Client/admin | invoice KPI rows unchanged |
| Invalidation | unchanged (portal cleared on order-graph) |
| Gates | lint ✓ test **688** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0205 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0204 Supplier view-only invoice detail (2026-07-22)

| Check | Result |
| ----- | ------ |
| Detail gate | supplier → `getInvoiceByIdForSupplier` (order has their product) |
| PDF | `getInvoiceDetailForPage` auth (client + supplier + owner) |
| UI | existing `disableInvoiceMutations`; Pay hidden for supplier |
| Nav | Related Invoices → `/invoices`; warm already lists invoices |
| Client | view + Pay unchanged |
| Invalidation | unchanged (read path) |
| Gates | lint ✓ test **688** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0204 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0187 picker densify — Product Combobox + Warehouse two-line (2026-07-22)

| Check | Result |
| ----- | ------ |
| Product | Allocate-style Combobox + search; `DialogProductOptionRow` trigger+list; optional reserved |
| Warehouse | `DialogWarehouseOptionRow` name / type badge · muted avail; trigger densify |
| Data | pick options include `warehouse.type` from enrich |
| Invalidation | unchanged |
| Gates | lint ✓ test **685** ✓ invalidate **217** ✓ |

```
Scope: built/verified | Traceability: REQ-0187 | Findings: PASS
Commands: lint, test, test:invalidate
```

---

## REQ-0187 gap — Order line column feedback (2026-07-22)

| Check | Result |
| ----- | ------ |
| Subtotal | under Product column |
| Required | under Quantity (unchanged) |
| Max / stockError / Auto-assign | under Warehouse; priority Max → stockError → hint |
| Full-width band | removed (`md:col-span-3` + `DIALOG_FORM_FEEDBACK_ROW`) |
| Invalidation | unchanged |
| Gates | lint ✓ invalidate **217** ✓ |

```
Scope: built/verified | Traceability: REQ-0187 | Findings: PASS
Commands: lint, test:invalidate
```

---

## REQ-0187 Invoice/Order dialog densify + catalog STATUS (2026-07-22)

| Check | Result |
| ----- | ------ |
| Invoice picker | no `(sku)`/`(status)`; Package/Boxes/Calendar · densify; solid trigger badges |
| Selected panel | glass-safe text; solid Order/Payment badges; `name · sku`; CopyableText # |
| Order line feedback | Subtotal + hint\|stockError one band; `DIALOG_FORM_ERROR_TEXT` |
| Catalog STATUS | Category/Supplier trailing matches Warehouse |
| Invalidation | unchanged |
| Gates | lint ✓ test **685** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0187 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0009 Sentry expected-client noise (2026-07-22)

| Check | Result |
| ----- | ------ |
| Order stock | toast + warn; Create gated on manual pick |
| Warehouse pulse | `isDataSlotLoading` for stock/forecast |
| Dev traces | sample rate 0 |
| Notif DELETE | 404 + warn; idempotent client |
| Gates | lint ✓ invalidate **217** ✓ logger/errors/sentry tests ✓ |

```
Scope: built/verified | Traceability: REQ-0009 | Findings: PASS
Commands: lint, test:invalidate, vitest logger/errors/sentry-config
```

---

## REQ-0203 DRY — productSupplier helpers

| Check | Result |
| ----- | ------ |
| Hub | `productSupplierImage` / `productSupplierId` in `ProductOptionRow` |
| Consumers | Allocate + Transfer import shared; locals removed |
| Invalidation | unchanged |
| Gates | lint ✓ test **685** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0203 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0203 gap — stock row + Transfer owner densify

| Check | Result |
| ----- | ------ |
| SKU mute | stock row SKU `text-muted-foreground` / gray (not sky) |
| Layout | catalog meta under product left; edit/delete `flex-row` same row |
| Transfer densify | `useProducts` Map join → owner + supplierImage on picker |
| Invalidation | unchanged |
| Gates | lint ✓ test **685** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0203 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0203 Warehouse detail + Allocate/Transfer evidence

| Check | Result |
| ----- | ------ |
| Header Status | trailing compact chip (no tall card) |
| Section order | Stats → Info\|Stock → Insights |
| TYPO | Insights + Info/Stock `TYPO_CARD_TITLE` / `TYPO_SUBTITLE` |
| Stock rows | name·SKU; category·supplier; (gap: meta left + inline actions) |
| Allocate/Transfer | `DialogProductOptionRow` + right Check; destination type badge |
| Roles | `canManageStock` includes user; footer CRUD gated |
| Invalidation | unchanged |
| Gates | lint ✓ test **685** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0203 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0186 Warehouse table + dialog evidence

| Check | Result |
| ----- | ------ |
| Type column | `WarehouseTypeBadge` compact (glass) |
| Name/Address | `CopyableText` + truncate |
| Actions | View Details + `detailBase` |
| Dialog Type Select | solid trigger / opaque items |
| Invalidation | unchanged (`invalidateAfterCatalogChange`) |
| Gates | lint ✓ test **684** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0186 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

## REQ-0186 gap closure (labels + Select)

| Check | Result |
| ----- | ------ |
| Labels | `getWarehouseTypeLabel` → Main Warehouse on table/detail/dialog |
| Dead type | `WarehouseTypeOptionValue` removed |
| Select | `value={type}` always string (no uncontrolled flip) |
| Gates | lint ✓ warehouse-type **6** ✓ invalidate **217** ✓ build ✓ |

---

## Session activate 2026-07-22

```
Scope: resume/activate | Traceability: REQ-0186, REQ-0008 | Findings: PASS (bootstrap intact)
Decision Points: no re-bootstrap; resume tomorrow-0186-warehouse-ui
Log: 2026-07-22 | orchestrator | Infinity Loop ready | tip 8eb7cab | REQ-0186
```

---

## REQ-0202 Detail no-flicker evidence

| Check | Result |
| ----- | ------ |
| Role Select | SelectValue children = UserRoleBadge |
| Order Select | status + carrier SelectValue labels |
| SSR sync | equal updatedAt + richer densify → apply; fresher cache → skip |
| Product densify | supplier image; reviewerEmail on by-product + SSR |
| Invalidation | unchanged |
| Gates | lint ✓ test **683** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0202 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0201 Related product densify evidence

| Check | Result |
| ----- | ------ |
| Dialog densify | DialogProductOptionRow + optional price/qty |
| Owner-products | party owner/supplier avatars mapped |
| Create / edit RO | densify in SupportTicketDialog |
| Detail | TicketRelatedProductDense; title Related Product |
| SSR | loadTicketRelatedSnap densify fields |
| Invalidation | unchanged |
| Gates | lint ✓ test **678** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0201 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0200 Owner-scoped Related products evidence

| Check | Result |
| ----- | ------ |
| API | `GET /api/support-tickets/owner-products?ownerId=` |
| Helper | `getOwnerProductsForSupport` + mergeProductListWhere |
| Dialog | `useSupportTicketOwnerProducts` (not role-scoped useProducts) |
| Select | Send-to value always string (`""` / `"none"`) |
| Invalidation | key under `supportTickets.all`; unchanged registry |
| Gates | lint ✓ test **677** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0200 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0199 Dialog Combobox consistency evidence

| Check | Result |
| ----- | ------ |
| Trigger token | `DIALOG_COMBOBOX_TRIGGER_CLASS` (ghost, no white hover) |
| Invoice Order picker | modal Popover + closeAutoFocus preventDefault |
| Ticket / allocate / transfer | same pattern |
| Invalidation | unchanged |
| Gates | lint ✓ test **675** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0199 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0198 Smooth dialog open evidence

| Check | Result |
| ----- | ------ |
| Same-route enable | Select mounts immediately (derived; no placeholder flash) |
| Pathname change | still one-frame defer |
| Open sync | useSyncDialogOpenState on gated dialogs |
| Placeholders | match triggers (review/ticket/product/…) |
| Invalidation | unchanged |
| Gates | lint ✓ test **675** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0198 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0197 Optional product + Reply-to + safe Reassign evidence

| Check | Result |
| ----- | ------ |
| Create product picker | owner-scoped; reset on Send-to change |
| Reassign | kept; server clears mismatched productId; confirm warns |
| Reply-to | resolveTicketReplyTarget + ReplyThread props |
| Invalidation | unchanged (patch + invalidateAllRelatedQueries) |
| Unit tests | ticket-reply-target + ticket-reassign-product (13) |
| Gates | lint ✓ test **672** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0197 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0196 Detail GlassCard single padding evidence

| Check | Result |
| ----- | ------ |
| Ticket detail | no inner `p-2 sm:p-4` (body pad only) |
| Review detail | same |
| ReplyThread | `space-y-4` only (no card pad) |
| Invalidation | unchanged |
| Gates | lint ✓ test **659** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0196 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0195 Non-admin ticket list/detail/edit parity evidence

| Check | Result |
| ----- | ------ |
| List Customer/Sent to | `resolveDetailAuditUserHref` → sky text-xs |
| Detail cards | Status/Priority/Messages, info, Description, Related (no Notes) |
| Edit Status | RO badge non-admin; Select admin; omit PUT status |
| API | `resolveStatusUpdate` admin-only |
| Invalidation | unchanged |
| Gates | lint ✓ test **659** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0195 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0194 Ticket chat bubble dynamic width + glow evidence

| Check | Result |
| ----- | ------ |
| Width | `w-fit max-w-[90%]` + `break-words` |
| Left glow | slate → white/clear (to-r) |
| Right glow | violet → white/clear (to-l) |
| Tokens | `ticket-chat-bubble-styles.ts` |
| Invalidation | unchanged |
| Gates | lint ✓ test **656** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0194 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0193 Ticket detail/dialog gap closure evidence

| Check | Result |
| ----- | ------ |
| Reassign open | placeholder `h-auto min-h-11`; sync reset (no microtask) |
| Reply header | title-size sky Link for creator name |
| Opening chat | description first left bubble; Description card kept |
| Bubble width | `w-[90%]`; author Link via `authorHrefForUserId` |
| Notes delete | AlertDialogWrapper + subject/notes preview |
| Status Select | TicketStatusBadge contrast solid/opaque |
| Invalidation | unchanged |
| Gates | lint ✓ test **656** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0193 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0192 Ticket message count parity evidence

| Check        | Result                                                    |
| ------------ | --------------------------------------------------------- |
| Formula      | total = 1 + replies; creator includes opening description |
| Table/KPI    | `ticketMessageTotal(replyCount)`                          |
| Detail       | `computeTicketMessageStats`                               |
| Invalidation | unchanged                                                 |
| Gates        | lint ✓ test **656** ✓ invalidate **217** ✓ build ✓        |

```
Scope: built/verified | Traceability: REQ-0192 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0191 Ticket detail redesign evidence

| Check                | Result                                             |
| -------------------- | -------------------------------------------------- |
| Status/Priority      | RO badges; Edit dialog has Status                  |
| Messages stats       | total / creator / staff from replies               |
| Chat + Reply to name | SupportTicketReplyThread                           |
| Notes                | header Edit/Delete; Cancel/Save icons              |
| Footer               | Back · Edit · Reassign · Delete+icon               |
| API                  | admin GET/replies/DELETE via canMutate             |
| Invalidation         | unchanged                                          |
| Gates                | lint ✓ test **651** ✓ invalidate **217** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0191 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0190 Edit Send-to read-only + admin Reassign evidence

| Check          | Result                                                   |
| -------------- | -------------------------------------------------------- |
| Edit Send-to   | read-only densified row; PUT omits assignedToId          |
| Create Select  | unchanged                                                |
| Admin Reassign | Actions → Select → AlertDialog confirm → update mutation |
| API policy     | admin mutate any; assignee change admin-only             |
| Invalidation   | unchanged (patch + invalidateAll)                        |
| Gates          | lint ✓ test **648** ✓ invalidate **215** ✓ build ✓       |

```
Scope: built/verified | Traceability: REQ-0190 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0189 Ticket/review Subject·Comment·Date polish evidence

| Check            | Result                                                     |
| ---------------- | ---------------------------------------------------------- |
| Ticket header    | Subject & Description                                      |
| Subject sky link | `TABLE_CATALOG_LINK_CLASS` → detail; dual truncate + title |
| Review Comment   | sky Link → detail; truncate max-w-[200px]                  |
| Date labels      | muted Created:/Updated: on both tables                     |
| Invalidation     | unchanged                                                  |
| Gates            | lint ✓ test **641** ✓ invalidate **215** ✓ build ✓         |

```
Scope: built/verified | Traceability: REQ-0189 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0188 Send-to Select clip + readable text evidence

| Check        | Result                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Avatar clip  | SelectTrigger `line-clamp-none` + overflow-visible; circle overflow-hidden only |
| Text trigger | white / white/75                                                                |
| Text item    | gray-700 / muted (light popover)                                                |
| Invalidation | unchanged                                                                       |
| Gates        | lint ✓ test **641** ✓ invalidate **215** ✓ build ✓                              |

```
Scope: built/verified | Traceability: REQ-0188 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0185 Support ticket densify evidence

| Check             | Result                                                       |
| ----------------- | ------------------------------------------------------------ |
| Person cells      | Customer/Sent to + Reviewer supplier-style                   |
| Actions           | SupportTicketActions View/Edit/Delete                        |
| Dialog            | create/edit; Send-to required client/supplier; owner densify |
| Priority contrast | solid/opaque in dialog + table opaque                        |
| Redis             | supportTickets:list:v2 + shape guard                         |
| Invalidation      | unchanged                                                    |
| Gates             | lint ✓ test **641** ✓ invalidate **215** ✓ build ✓           |

```
Scope: built/verified | Traceability: REQ-0185 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## Session 2026-07-21 — Agile V activate / resume

```
Scope: activate/resume | Traceability: REQ-0185 | Findings: PASS (built)
Bootstrap: SKIP — .agile-v/ complete (C1/C2, 24 skills, Gate1 APPROVED)
Decision Points: continue from park; no re-bootstrap
Log: 2026-07-21 | orchestrator | session activate | Infinity Loop ready → REQ-0185 done → 0186
```

---

## Session 2026-07-20 EOD — park for tomorrow UI bugs

```
Scope: parked | Traceability: REQ-0179–0184 done; REQ-0185–0187 planned | Findings: PASS (reviews)
Shipped: product reviews densify + edit dialog stack → origin/main 011d655
Tomorrow: ticket table/detail (admin/client/supplier) · warehouse dialog/detail · order dialog
Then: REQ-0136 §10 smoke + Gate 2 Sentry 24h
```

---

## Session 2026-07-20 — Agile V activate

```
Scope: resume/activate | Traceability: REQ-0136, REQ-0008 | Findings: FLAG (human QA pending)
Decision Points: no re-bootstrap; continue C2 from park; config.json sync
Log: 2026-07-20 | orchestrator | session activate | Infinity Loop ready | REQ-0136
```

---

## REQ-0165 Order/Invoice detail + review UX evidence

| Check                 | Result                                                         |
| --------------------- | -------------------------------------------------------------- |
| Parties self          | sky (no PARTY_SELF gray)                                       |
| Created/Updated by    | resolveDetailAuditUserHref — admin UM / else products?ownerId= |
| Compact reviews       | under product row, left; getRatingDisplay hues                 |
| WriteEdit dialog      | HeaderBrand, FormLabels, Cancel+X, Submit+Star                 |
| Delete                | AlertDialog + product/comment truncate                         |
| Flash                 | eligibility patch + showWrite guard                            |
| Invalidation registry | unchanged                                                      |
| Gates                 | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓             |

```
Scope: built/verified | Traceability: REQ-0165 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0166 Dead party class + catalog audit sky evidence

| Check                   | Result                                                      |
| ----------------------- | ----------------------------------------------------------- |
| PARTY_SELF_LINK_CLASS   | removed (code + test)                                       |
| Catalog Created/Updated | Category/Supplier/Warehouse → resolveDetailAuditUserHref    |
| Product Updated by      | resolveDetailAuditUserHref; Created keeps ownerProductsHref |
| Invalidation            | unchanged                                                   |
| Gates                   | lint ✓ test **629** ✓ invalidate **213** ✓ build ✓          |

```
Scope: built/verified | Traceability: REQ-0166 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0167 Compact review placement + dialog contrast evidence

| Check         | Result                                             |
| ------------- | -------------------------------------------------- |
| Placement     | reviews under price column (right)                 |
| Write button  | GLASS_COMPACT_AMBER_BUTTON hover glow              |
| Edit/delete   | justify-between under rating                       |
| Dialog rating | dialogTextClass (bright on dark shell)             |
| Cancel        | secondary + GLASS_GHOST + shell reset              |
| Invalidation  | unchanged                                          |
| Gates         | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0167 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0184 Restore Edit Review dialog stacked layout evidence

| Check                | Result                                             |
| -------------------- | -------------------------------------------------- |
| Stack layout         | Status → Rating → Comment w-full (create + edit)   |
| No 2-col / max-w-2xl | Removed from edit dialog                           |
| Badge contrast       | solid/opaque retained (REQ-0183)                   |
| Detail page          | 2-col Status+Rating \| Comment unchanged           |
| Invalidation         | unchanged                                          |
| Gates                | lint ✓ test **636** ✓ invalidate **214** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0184 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0183 Review detail + Edit dialog UX polish evidence

| Check          | Result                                                         |
| -------------- | -------------------------------------------------------------- |
| Badge contrast | ReviewStatusBadge solid/opaque; dialog Select wired            |
| Layout         | Status+Rating \| Comment (detail + edit dialog)                |
| Purchase       | status/payment/total/date + sky number links                   |
| Polish         | reviewer email dedupe; product text-sm; Trash2; dynamic delete |
| Invalidation   | unchanged                                                      |
| Gates          | lint ✓ test **636** ✓ invalidate **214** ✓ build ✓             |

```
Scope: built/verified | Traceability: REQ-0183 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0182 Product reviews table Actions menu evidence

| Check        | Result                                                  |
| ------------ | ------------------------------------------------------- |
| Actions      | MoreVertical View Details · Edit Review · Delete Review |
| Edit         | WriteEditReviewDialog allowStatusEdit                   |
| Delete       | AlertDialogWrapper + useDeleteProductReview             |
| Invalidation | unchanged                                               |
| Gates        | lint ✓ test **636** ✓ invalidate **214** ✓ build ✓      |

```
Scope: built/verified | Traceability: REQ-0182 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0181 Review detail display-only; edit via dialog evidence

| Check        | Result                                                            |
| ------------ | ----------------------------------------------------------------- |
| Detail       | No Status/Rating Selects; no Edit Comment; badge + stars/comment  |
| Dialog       | allowStatusEdit → Status Select w-full; PUT status+rating+comment |
| Roles        | Admin detail true; client call sites omit                         |
| Invalidation | unchanged                                                         |
| Gates        | lint ✓ test **635** ✓ invalidate **213** ✓ build ✓                |

```
Scope: built/verified | Traceability: REQ-0181 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0180 Product reviews table densify + detail redesign evidence

| Check              | Result                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| List/detail enrich | productImageUrl, category/supplier, reviewerImage; orderNumber + invoice                |
| Redis              | productReviews:list:v2 only; shape guard productImageUrl/reviewerImage; detail no Redis |
| Nit close          | detail key unversioned unused helper; `hasReviewListV2Shape` unit tests                 |
| Table              | ProductThumb + SKU CopyableText; AvatarInlineLink + email copy                          |
| Detail             | Status/Rating selects; Product/Reviewer/Purchase cards; Edit Review + Delete            |
| Add dialog polish  | ratingLabelClass font-medium + dialogTextClass                                          |
| Invalidation       | unchanged                                                                               |
| Gates              | lint ✓ test **635** ✓ invalidate **213** ✓ build ✓                                      |

```
Scope: built/verified | Traceability: REQ-0180 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0179 Add Product Review dialog densify evidence

| Check          | Result                                                   |
| -------------- | -------------------------------------------------------- |
| Rating hues    | getRatingDisplay starClass + dialogTextClass on Select   |
| Product Select | DialogProductOptionRow thumb·SKU·cat·owner·supplier      |
| List API/SSR   | productOwnerName/Image + supplierImage; products:list:v3 |
| Invalidation   | unchanged                                                |
| Gates          | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓       |

```
Scope: built/verified | Traceability: REQ-0179 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0178 Supplier portal recent orders buyer row evidence

| Check        | Result                                             |
| ------------ | -------------------------------------------------- |
| DTO          | placedById/Name/Image on SupplierPortalRecentOrder |
| SSR          | userId/clientId + resolveBuyerDisplayFromUsers     |
| UI           | Calendar · date · AvatarInlineLink buyer           |
| Redis        | supplierPortal:overview:v4 + placedById guard      |
| Invalidation | unchanged                                          |
| Gates        | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0178 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0177 Admin portal recent densify + typography evidence

| Check                  | Result                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| Headers                | SectionCardHeader on 6 GlassCards (supplier + client)                    |
| Supplier products      | name text-sm · SKU copy; stock·reserved·cat·supplier; status/price stack |
| Supplier orders        | product·Tag·supplier + Calendar date                                     |
| Client orders/invoices | product meta + date-first client; invoice price under badge              |
| Redis                  | supplierPortal v3 + clientPortal v4 + shape guards                       |
| Invalidation           | unchanged                                                                |
| Gates                  | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓                       |

```
Scope: built/verified | Traceability: REQ-0177 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0176 Recent Orders/Reviews meta gap + date-first evidence

| Check              | Result                                                          |
| ------------------ | --------------------------------------------------------------- |
| Vertical gap       | Orders + Reviews `flex-col gap-1.5`                             |
| Buyer/reviewer row | Calendar · date · AvatarInlineLink                              |
| Root cause         | Avatar ring-offset left of ProductThumb — avoided by date-first |
| Invalidation/SSR   | unchanged                                                       |
| Gates              | lint ✓ invalidate **213** ✓                                     |

```
Scope: built/verified | Traceability: REQ-0176 | Findings: PASS
Commands: lint, invalidate
```

---

## REQ-0175 Portal recent-card meta row clip parity evidence

| Check                 | Result                                     |
| --------------------- | ------------------------------------------ |
| Admin Client portal   | orders + invoices → CARD_LIST_META_ROW     |
| Admin Supplier portal | products + orders → CARD_LIST_META_ROW     |
| Role portals          | plain-text CARD_LIST_META unchanged        |
| Invalidation          | unchanged                                  |
| Gates                 | lint ✓ test **630** ✓ invalidate **213** ✓ |

```
Scope: built/verified | Traceability: REQ-0175 | Findings: PASS
Commands: lint, test, invalidate
```

---

## REQ-0174 Recent cards clip fix + Orders/Reviews densify evidence

| Check          | Result                                                 |
| -------------- | ------------------------------------------------------ |
| Clip-safe rows | CARD_LIST_META_ROW + AvatarInlineLink ring not clipped |
| Orders layout  | 3 lines: # / product·cat·supplier / buyer·date         |
| Reviews        | Tag category beside ★                                  |
| Cache          | dashboard:overview:v7 + shape guard                    |
| Invalidation   | unchanged                                              |
| Gates          | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓     |

```
Scope: built/verified | Traceability: REQ-0174 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0173 Top Products denser cells + header weight evidence

| Check        | Result                                             |
| ------------ | -------------------------------------------------- |
| SSR enrich   | topProducts image/category/supplier; cache v6      |
| Shared cell  | DenseCatalogProductCell (forecast + Top Products)  |
| Headers      | font-medium text-gray-700 dark:text-white          |
| Invalidation | unchanged                                          |
| Gates        | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0173 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0172 Forecast 2-line cell + table Y-scrollbar fix evidence

| Check         | Result                                     |
| ------------- | ------------------------------------------ |
| Product cell  | Name · SKU / Category · AvatarInlineLink   |
| Supplier ring | Circle AVATAR_RING (products-table parity) |
| Table scroll  | `overflow-x-auto` only (no nested Y)       |
| Invalidation  | unchanged                                  |
| Gates         | lint ✓ test **630** ✓ invalidate **213** ✓ |

```
Scope: built/verified | Traceability: REQ-0172 | Findings: PASS
Commands: lint, test, invalidate
```

---

## REQ-0171 Forecast KPI compact + denser product cells evidence

| Check        | Result                                                            |
| ------------ | ----------------------------------------------------------------- |
| Compact KPIs | StatisticsCard `compact` on ForecastingSection only               |
| SSR enrich   | category/supplier/supplierImage on forecasts + anomalies          |
| Cache        | `forecasting:summary:v4` (SSR + API)                              |
| Product cell | CopyableText SKU · category; square supplier SafeImage + sky link |
| Invalidation | unchanged                                                         |
| Gates        | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓                |

```
Scope: built/verified | Traceability: REQ-0171 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0170 Portal/dashboard recent density + forecast shell evidence

| Check                   | Result                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| Dashboard Latest 5      | buyer/product/category/supplier clickable + avatars/thumbs       |
| Tickets/Reviews/Imports | user(+product) avatars/links                                     |
| Supplier portal         | product thumbs + supplier avatars on recent cards                |
| Client portal           | client avatars on orders/invoices                                |
| Forecasting             | StatisticsCard KPIs; ChartCard headers; ProductThumb links       |
| Cache                   | dashboard v5; supplierPortal v2; clientPortal v3; forecasting v3 |
| Invalidation            | unchanged                                                        |
| Gates                   | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓               |

```
Scope: built/verified | Traceability: REQ-0170 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0169 Stats-grid shell + My Activity Actions polish evidence

| Check             | Result                                                 |
| ----------------- | ------------------------------------------------------ |
| Shell stats token | PAGE_STATS_GRID_IN_SHELL_CLASS on BI + My Activity     |
| Portal pb-6       | PAGE_STATS_GRID_CLASS unchanged                        |
| Optional onEdit   | Edit hidden when absent; OrderList still passes onEdit |
| My Activity       | createOrderColumns(undefined, "/admin/orders")         |
| Invalidation      | unchanged (Cancel/Delete hooks)                        |
| Gates             | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓     |

```
Scope: built/verified | Traceability: REQ-0169 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0168 Admin/Business spacing + Recent Orders density evidence

| Check              | Result                                                      |
| ------------------ | ----------------------------------------------------------- |
| BI spacing         | flex flex-col gap-6 + PAGE_STATS_GRID; trimmed stacked pb-6 |
| Reorder empty      | healthy copy when low+out = 0 (heuristic unchanged)         |
| Activity Logs      | filter row mb-4 before table                                |
| My Activity        | iconTile header; createOrderColumns → AdminEmbedDataTable   |
| Dashboard Latest 5 | buyer/product/category/supplier; denser cards               |
| Cache              | `dashboard:overview:v4:`                                    |
| Invalidation       | unchanged (order-graph already clears dashboard)            |
| Gates              | lint ✓ test **630** ✓ invalidate **213** ✓ build ✓          |

```
Scope: built/verified | Traceability: REQ-0168 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0164 Compact reviews + party links + summary icons evidence

| Check           | Result                                                   |
| --------------- | -------------------------------------------------------- |
| Compact reviews | stars + n/5 + icon Pencil/Trash                          |
| Parties         | owner-products href all roles; self gray                 |
| Summary icons   | sky/violet/cyan/rose/emerald/amber                       |
| Invalidation    | unchanged                                                |
| Gates           | lint ✓ test **620** ✓ invalidate **213** ✓ build ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0164 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0163 Invoice Order Items parity + hydration/Back evidence

| Check        | Result                                                   |
| ------------ | -------------------------------------------------------- |
| Subtitle     | count on this invoice · ClientDateTime                   |
| Meta         | relatedOrder ORD # sky + CopyableText                    |
| linkMode     | admin / portal (incl. store owner)                       |
| Back         | no variant=ghost on footer                               |
| Hydrate      | SSR initialReviewContext; compact no Loader2 without SSR |
| Invalidation | unchanged                                                |
| Gates        | lint ✓ test **616** ✓ invalidate **213** ✓ build ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0163 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0162 Invoice Detail ↔ Order Detail parity evidence

| Check        | Result                                                              |
| ------------ | ------------------------------------------------------------------- |
| Layout       | status stack\|billing · items\|summary · info\|parties              |
| Info rows    | DetailInfoRow\*; hide empty dates; Related Order sky font-normal    |
| Cards        | InvoiceItemsCard + InvoicePartiesCard (href sky); FactsGrid removed |
| Paid line    | emerald paid; total emerald when settled else muted                 |
| Invalidation | unchanged                                                           |
| Gates        | lint ✓ test **616** ✓ invalidate **213** ✓ build ✓ tsc ✓            |

```
Scope: built/verified | Traceability: REQ-0162 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0161 Order/Invoice header HelpTooltips evidence

| Check           | Result                                                   |
| --------------- | -------------------------------------------------------- |
| Copy hub        | order-invoice-column-tooltips.ts                         |
| Order headers   | Order # Total Status Payment Invoice #                   |
| Invoice headers | Invoice # Order # Status Total                           |
| Pattern         | HelpTooltip sibling of SortableHeader                    |
| Invalidation    | unchanged                                                |
| Gates           | lint ✓ test **616** ✓ invalidate **213** ✓ build ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0161 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

---

## REQ-0160 User overview copy evidence

| Check        | Result                                                        |
| ------------ | ------------------------------------------------------------- |
| Helper       | getUserOverviewDescription + shouldShowMyActivityTip          |
| UI           | Overview blurb role-aware; My Activity tip isOwner admin/user |
| Invalidation | unchanged                                                     |
| Gates        | lint ✓ test **615** ✓ invalidate **213** ✓ build ✓ tsc ✓      |

```
Scope: built/verified | Traceability: REQ-0160 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

---

## REQ-0159 Buyer display + invoice list parity evidence

| Check         | Result                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| Buyer helpers | resolveBuyerDisplayFromUsers + formatStoreOwnerLabel                            |
| SSR/API       | placedBy / customerDisplay / orderedBy = buyer                                  |
| /invoices     | Self-only (getInvoicesForUser); KPIs store-wide                                 |
| Client UI     | Store · owner prefix                                                            |
| Seed          | shipping name/email = buyer; reset-demo-db --with-catalog ✓                     |
| Cache         | orders:list:v5 · invoices:list:v3                                               |
| Cleanup       | removed dead `getStoreInvoicesForAdmin` + API/`InvoiceFilters.scope` store list |
| Invalidation  | unchanged (`getStoreOrderIds` kept for dashboard KPIs)                          |
| Gates         | lint ✓ test **612** ✓ invalidate **213** ✓ build ✓ tsc ✓                        |

```
Scope: built/verified | Traceability: REQ-0159 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0158 Order party semantics evidence

| Check         | Result                                                   |
| ------------- | -------------------------------------------------------- |
| Model         | userId=owner; clientId=buyer/null self                   |
| Client portal | clientId filter + overview:v2                            |
| Seed          | ORD/INV-DEMO-001…004 (reset-demo-db --with-catalog ✓)    |
| Invalidation  | unchanged (order-graph)                                  |
| Gates         | lint ✓ test **610** ✓ invalidate **213** ✓ build ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0158 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0157 Badge DRY + portal helper + tsc hygiene evidence

| Check         | Result                                                   |
| ------------- | -------------------------------------------------------- |
| Invoice DRY   | client InvoiceList + supplier OrderList                  |
| Portal orders | `buildPortalOrderStatusBadges`                           |
| tsc           | `npx tsc --noEmit` clean                                 |
| Invalidation  | unchanged                                                |
| Gates         | lint ✓ test **606** ✓ invalidate **213** ✓ build ✓ tsc ✓ |

```
Scope: built/verified | Traceability: REQ-0157 | Findings: PASS
Commands: lint, test, invalidate, build, tsc
```

---

## REQ-0156 My Activity + invoice badge set parity evidence

| Check        | Result                                             |
| ------------ | -------------------------------------------------- |
| Helper       | `buildStoreInvoiceStatusBadges`                    |
| My Activity  | Total Orders + Invoices store badge sets           |
| DRY          | home/admin/orders/invoices invoice KPIs            |
| Client Due   | Refunded badge                                     |
| Invalidation | unchanged                                          |
| Gates        | lint ✓ test **604** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0156 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0155 Delivered + Due badge parity evidence

| Check              | Result                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Helper             | `buildStoreOrderStatusBadges` — Shipping=processing+shipped; Delivered separate |
| Store Total Orders | home / admin / orders / invoices KPI rows                                       |
| Due label          | AOV + invoice Due card + My Activity AOV uses outstandingAmount                 |
| Portals            | Shipped→Shipping; Client Outstanding→Due                                        |
| Invalidation       | unchanged                                                                       |
| Gates              | lint ✓ test **602** ✓ invalidate **213** ✓ build ✓                              |

```
Scope: built/verified | Traceability: REQ-0155 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0154 partial pay stats + Total typography evidence

| Check        | Result                                                                               |
| ------------ | ------------------------------------------------------------------------------------ |
| Helper       | `buildPaymentMoneyStats` — demo Paid $534.93 + Partial $100 + Due $3880              |
| Dashboards   | admin/client/supplier invoice-money partition; `partialOrderAmount` / `partialCount` |
| UI           | Partial badge on home/admin/lists/portals                                            |
| Typography   | PaymentMoneyBreakdown table `text-xs font-normal` gray                               |
| Cache        | `dashboard:overview:v3:`                                                             |
| Invalidation | unchanged                                                                            |
| Gates        | lint ✓ test **600** ✓ invalidate **213** ✓ build ✓                                   |

```
Scope: built/verified | Traceability: REQ-0154 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0153 instant linked-order patch evidence

| Check          | Result                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Helper         | `patchLinkedOrderFromInvoiceMoney` — order lists/detail + invoice badge |
| Hooks          | useUpdateInvoice mutate/success/error; create + send                    |
| Optimistic due | mergeOptimisticInvoiceUpdate recomputes amountDue                       |
| Invalidation   | unchanged — patch then `invalidateAfterOrderGraphChange`                |
| Gates          | lint ✓ test **595** ✓ invalidate **213** ✓ build ✓                      |

```
Scope: built/verified | Traceability: REQ-0153 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0152 partial pay sync + Invoice Total + Pay toggle evidence

| Check         | Result                                                                            |
| ------------- | --------------------------------------------------------------------------------- |
| Order sync    | unpaid/partial/paid from invoice amountPaid vs total on PUT + Stripe              |
| Checkout      | optional amount; admin canCheckout; no unpaid clobber                             |
| Webhook       | incremental amountPaid; fulfill only on full pay                                  |
| PaymentDialog | full/partial toggle + Zod live errors                                             |
| UI            | PaymentMoneyBreakdown Invoice Total; Order Total when paid>0; admin detail parity |
| Cache         | `orders:list:v4:` (amountPaid on invoiceForOrder)                                 |
| Invalidation  | unchanged (`invalidateAfterOrderGraphChange` / invoice Redis)                     |
| Gates         | lint ✓ test **593** ✓ invalidate **213** ✓ build ✓                                |

```
Scope: built/verified | Traceability: REQ-0152 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0151 edit submit + Order # badges + due Clock evidence

| Check          | Result                                             |
| -------------- | -------------------------------------------------- |
| Zod dates      | sentAt/paidAt/cancelledAt accept YYYY-MM-DD        |
| Invalid toast  | InvoiceDialog onInvalid                            |
| Order # badges | linkedOrder status/payment + SemanticEventDate     |
| Due icon       | Clock for due/overdue                              |
| Invalidation   | unchanged                                          |
| Gates          | lint ✓ test **580** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0151 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0150 invoice table density + Edit Invoice evidence

| Check         | Result                                             |
| ------------- | -------------------------------------------------- |
| Edit submit   | Cancel `type="button"`                             |
| Status Select | solid trigger / opaque items                       |
| List enrich   | linkedOrder\* + statusAt; `invoices:list:v2:`      |
| Columns       | Invoice # · Order # · Status · Total · Actions     |
| Invalidation  | unchanged                                          |
| Gates         | lint ✓ test **578** ✓ invalidate **213** ✓ build ✓ |

```
Scope: built/verified | Traceability: REQ-0150 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0149 line price + Owner/Buyer size evidence

| Check        | Result                                                            |
| ------------ | ----------------------------------------------------------------- |
| Final price  | `text-sm sm:text-base` via ProportionalPriceDisplay               |
| Strike price | `text-xs sm:text-sm`                                              |
| Owner/Buyer  | `linkClassName="text-xs"` on catalog recent orders + product grid |
| Invalidation | unchanged                                                         |
| Gates        | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓                |

```
Scope: built/verified | Traceability: REQ-0149 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0148 summary total + line meta + light Back evidence

| Check        | Result                                                                             |
| ------------ | ---------------------------------------------------------------------------------- |
| Total typo   | Order + Invoice Summary `text-sm sm:text-base`                                     |
| Line meta    | · separators; Invoice FileText + CopyableText + sky Link                           |
| Header Back  | light gray glass token + Order `variant="ghost"` (Product parity; was red default) |
| Invalidation | unchanged                                                                          |
| Gates        | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓                                 |

```
Scope: built/verified | Traceability: REQ-0148 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0147 order detail gap closure evidence

| Check        | Result                                                           |
| ------------ | ---------------------------------------------------------------- |
| Carrier      | `CarrierGlassBadge` span — no shadcn Badge                       |
| Layout       | Items\|Summary; Info\|(Parties+addresses); related cards removed |
| Invoice      | DetailInfoRow in Order Information                               |
| Parties      | admin sky hrefs                                                  |
| Header Back  | slate glass, no ghost                                            |
| Invalidation | unchanged                                                        |
| Gates        | lint ✓ test **573** ✓ invalidate **213** ✓ build ✓               |

```
Scope: built/verified | Traceability: REQ-0147 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0146 order detail density evidence

| Check             | Result                                                |
| ----------------- | ----------------------------------------------------- |
| Status + tracking | equal-height `layout="stack"` + glass carrier badge   |
| Body grids        | Created/Updated row; Shipping\|Billing; related cards |
| Strike            | dual-price only when list > adjusted                  |
| trackingCarrier   | updateOrderSchema + prisma + admin mutate             |
| Invalidation      | unchanged                                             |
| Gates             | lint ✓ test **572** ✓ invalidate **213** ✓ build ✓    |

```
Scope: built/verified | Traceability: REQ-0146 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## EOD park 2026-07-16

| Area                  | Status                             |
| --------------------- | ---------------------------------- |
| REQ-0137–0145         | done + pushed `origin/main`        |
| UI explore (REQ-0136) | in progress — continue tomorrow    |
| §10 cache A1/A2/B1    | **not started** — after UI/calc OK |
| Gate 2 Sentry 24h     | blocked on smoke                   |

```
Scope: parked | Traceability: REQ-0136, REQ-0144–0145 | Findings: PASS (shipped); PENDING (human QA)
Commands: lint, test, invalidate, build (571 / 213)
```

---

## REQ-0145 orders table Invoice # evidence

| Check          | Result                                                 |
| -------------- | ------------------------------------------------------ |
| Status/Payment | `SemanticEventDate` icons + semantic hues              |
| Order #        | clickable product links + meta icons                   |
| Invoice #      | 2-line nowrap; paid/cancelled/refunded/due event       |
| SSR            | InvoiceLinkFields + sentAt/cancelledAt; orders:list:v3 |
| Invalidation   | unchanged                                              |
| Gates          | lint ✓ test 571 ✓ invalidate 213 ✓ build ✓             |

```
Scope: built/verified | Traceability: REQ-0145 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0144 products hydration + theme evidence

| Check             | Result                                                |
| ----------------- | ----------------------------------------------------- |
| Stock header      | `label="QR & Stock"` (plain `&`; no `&amp;` props)    |
| Product header    | `label="Product & SKU"`                               |
| ThemeProvider     | Dev-only filter for next-themes script false positive |
| Forecasting model | `openai/gpt-4o-mini`                                  |
| Invalidation      | unchanged                                             |
| Gates             | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓            |

```
Scope: built/verified | Traceability: REQ-0144 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0143 detail meta polish evidence

| Check         | Result                                               |
| ------------- | ---------------------------------------------------- |
| Product grid  | Owner · Supplier                                     |
| Recent orders | SKU · Category · Qty; Owner · Buyer; INV when linked |
| SSR           | category + invoiceForOrder via getInvoiceLinkMap     |
| Invalidation  | unchanged                                            |
| Gates         | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓           |

```
Scope: built/verified | Traceability: REQ-0143 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0142 cat/sup polish evidence

| Check            | Result                                          |
| ---------------- | ----------------------------------------------- |
| Nest button      | Name control + email CopyableText siblings      |
| Supplier & Email | product-like avatar \| name \| email stack      |
| Products tooltip | `HelpTooltip` + `CATALOG_PRODUCT_SHARE_TOOLTIP` |
| Count scope      | groupBy `userId` = viewer                       |
| Detail headers   | iconTile + subtitle Products/Recent Orders      |
| Gates            | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓      |

```
Scope: built/verified | Traceability: REQ-0142 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0141 category/supplier UI evidence

| Check           | Result                                                       |
| --------------- | ------------------------------------------------------------ |
| List enrich     | `productCount` + supplier `email`; home + GET lists          |
| Tables/export   | Notes removed; Products count · %; CSV Products              |
| Detail Status   | Badge by Created; no top STATUS strip                        |
| Product grid    | Name · SKU; category link; SSR category on supplier products |
| Stock companion | `CatalogSnapshotCompanion` → no pie `lg:col-span-2`          |
| Invalidation    | unchanged                                                    |
| Gates           | lint ✓ test 559 ✓ invalidate 213 ✓ build ✓                   |

```
Scope: built/verified | Traceability: REQ-0141 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0140 seed stock coherence evidence

| Check              | Result                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Beats seed         | `product.reservedQuantity=0`; Main alloc reserved 20                |
| Sony seed          | catalog 99; Main alloc 49 (post ORD-DEMO-001 fulfill)               |
| Sold filter        | `isOrderCountedAsSold` — delivered or paid                          |
| Insights stock     | `qty − committed` in product/catalog insights                       |
| Manual fixtures    | §9 REQ-0140 floor documented                                        |
| Re-seed spot-check | Beats committed **20**, avail **30**; Sony qty **99** / Main **49** |
| Gates              | lint ✓ test 556 ✓ invalidate 213 ✓ build ✓                          |

```
Scope: built/verified | Traceability: REQ-0140 | Findings: PASS
Commands: lint, test, invalidate, build, reset-demo-db --with-catalog
```

---

## REQ-0125 loading parity evidence

| Check                 | Result                                              |
| --------------------- | --------------------------------------------------- |
| patchDetailCacheMerge | helper + test + export                              |
| useUpdateInvoice      | optimistic detail + list; patchDetailCache rollback |
| Admin support/users   | prefetchListPageStats + split loading predicates    |
| Client tickets        | unsettled stat cards + loading table                |

```
Scope: built/verified | Traceability: REQ-0125 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0124 secondary entities evidence

| Check                          | Result                                                  |
| ------------------------------ | ------------------------------------------------------- |
| Support/reviews/users          | list+detail patch before invalidate                     |
| Soft-delete portal             | `removeProductFromPortalCaches` on soft + hard delete   |
| Docs                           | PROJECT_WALKTHROUGH §7 Instant UI; CLAUDE compact block |
| Stock transfer / dashboard KPI | invalidate-only / pulse-only (documented)               |

```
Scope: built/verified | Traceability: REQ-0124 | Findings: PASS
Commands: lint, test, invalidate, build
```

---

## REQ-0123 instant UI gap closure evidence

| Check             | Result                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Order graph lists | `patchOrderGraphListCaches` on orders/invoices create/update/cancel/send       |
| Portal browse     | `patchProductInPortalCaches` + `removeProductFromPortalCaches` on product CRUD |
| Stock delete      | `removeStockAllocationFromCaches` wired with scoped delete input               |
| Admin activity    | `isAnyDataSlotUnsettled` on stat cards                                         |
| Dashboard KPIs    | pulse-only (intentional — no client-side aggregate patch)                      |

```
Scope: built/verified | Traceability: REQ-0123 | Findings: PASS
Commands: lint, test 518, test:invalidate 208, build
```

---

## REQ-0122 instant UI evidence

| Check                 | Result                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| Cache patch           | `patchDetailCache` + `patchListCaches` on catalog CRUD hooks before invalidate |
| SSR sync              | `resolveSsrSyncAction` skips when cached `updatedAt >= server`                 |
| Pulse                 | `isDataSlotUnsettled` on dashboard/portal/forecast/stock aggregates            |
| Dialog                | `mutateAsync` + patch in `onSuccess` before close                              |
| Invalidation registry | audit accepts `patchDetailCache`; 208 checks pass                              |

```
Scope: built/verified | Traceability: REQ-0122 | Findings: PASS
Commands: lint, test 516, test:invalidate 208, build
```

---

## REQ-0120 nav invalidation + SSR sync evidence

| Check                      | Result                                                                     |
| -------------------------- | -------------------------------------------------------------------------- |
| Business Insights SSR sync | `useSyncSsrQueryDataMany` — products, orders, warehouse summary keys       |
| Admin My Activity table    | `AdminEmbedDataTable` + column defs (REQ-0117 AC4 closure)                 |
| Back nav                   | `useBackWithRefresh("history")`, `("support-ticket")`                      |
| Post-delete nav            | `navigateTo` on product/category/supplier/warehouse detail delete success  |
| Dead code                  | Removed unused warehouse select props; OrderDialog/LoginRoleSelect imports |
| Docs                       | Duplicate REQ-0051 backlog entry removed                                   |
| Invalidation registry      | unchanged — no new mutation paths                                          |

```
Scope: built/verified | Traceability: REQ-0120 | Findings: PASS
Commands: lint, test 504, test:invalidate 208, build
```

---

## REQ-0106 order auto-assign evidence

| Check                    | Result                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| Shared validator         | `validateOrderLineStock` — auto catalog cap + manual warehouse cap |
| Server createOrder       | `needsPick && !warehouseId` allowed — product-path reserve         |
| OrderDialog              | Submit disabled uses committed available; auto-assign default      |
| OrderLineWarehouseSelect | Optional picker; "Auto-assign warehouses" sentinel                 |
| Manual fixture           | `MANUAL_TEST_FIXTURES.md` §9 Beats path                            |

---

## REQ-0107 product detail summary evidence

| Check          | Result                                                         |
| -------------- | -------------------------------------------------------------- |
| Detail summary | `formatCatalogAllocationDetailSummary` on Warehouse Stock card |
| Badges         | catalog avail + in-warehouses counts                           |
| Invalidation   | unchanged — derives from existing hooks                        |

---

## REQ-0108 live validation evidence

| Check         | Result                                                             |
| ------------- | ------------------------------------------------------------------ |
| Product edit  | `useCatalogQuantityReconcilePreview` — live block + shrink preview |
| Allocate edit | `minReserved` floor in `StockQuantityField`                        |
| Submit gate   | disabled when reconcile `!ok` or below reserved                    |

---

## REQ-0113 warehouse select fetch removal evidence

| Check             | Result                                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| Props-only select | No `useStockByProduct` in `OrderLineWarehouseSelect`                    |
| Required rows     | `allocationRows` + `allocationsLoading` from parent hook                |
| Types merge       | `OrderFormData` in `OrderDialogCreateLineItem.tsx`; `.types.ts` deleted |
| Invalidation      | unchanged                                                               |

```
Scope: built/verified | Traceability: REQ-0113 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0112 order line fetch DRY evidence

| Check        | Result                                                                             |
| ------------ | ---------------------------------------------------------------------------------- |
| Single fetch | Hook returns `allocationRows`; warehouse select skips internal query when injected |
| Options DRY  | `buildOrderLineWarehousePickOptions` shared lib                                    |
| Stock errors | `lineStockErrors` keyed by `field.id`; prune on remove; reset on dialog close      |
| Invalidation | unchanged — no registry changes                                                    |

```
Scope: built/verified | Traceability: REQ-0112 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0111 order stock workflow evidence

| Check               | Result                                                 |
| ------------------- | ------------------------------------------------------ |
| Reactive validation | `useOrderLineStockValidation` + `useStockByProduct`    |
| Submit ensure       | `ensureStockAllocationsAndValidate` before create      |
| Manual error DRY    | `OrderLineWarehouseSelect.manualPickError` from parent |
| Server parity       | `validateWarehousePick` → `Max {n} at {name}`          |
| Catalog DRY         | `prisma/order.ts` uses `getOrderLineCatalogAvailable`  |
| Invalidation        | unchanged — no registry changes                        |

```
Scope: built/verified | Traceability: REQ-0111 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0110 stock UX gap closure evidence

| Check              | Result                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| Order cap fallback | `getOrderLineCatalogAvailableFromProduct` + `resolveOrderLineHasAllocations` |
| Prefetch           | `prefetchStockByProduct` on OrderDialog product select                       |
| Warehouse errors   | Manual pick `Max {n} at {warehouseName}`                                     |
| Bounds DRY         | `getAllocationQtyBounds` in validate + AllocateStockDialog                   |
| Reserve test       | Auto-assign qty 40 → product `reservedQuantity` only                         |
| Dialog shells      | ProductForm `DIALOG_EDGE_SCROLL_*`; Allocate `DIALOG_FORM_FEEDBACK_ROW`      |
| Invalidation       | unchanged — no registry changes                                              |

```
Scope: built/verified | Traceability: REQ-0110 | Findings: PASS
Commands: lint, test, test:invalidate, build
```

---

## REQ-0109 dialog feedback tokens evidence

| Check   | Result                                                           |
| ------- | ---------------------------------------------------------------- |
| Tokens  | `DIALOG_FORM_FEEDBACK_*` in `dialog-edge-scroll.ts`              |
| Applied | ProductForm, Order, OrderLineWarehouseSelect, StockQuantityField |

---

## REQ-0105 product detail committedQuantity SSR evidence

| Check          | Result                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Single enrich  | `enrichProductDetailWithCommittedQuantity` — one allocation sum query    |
| Detail SSR/API | `getProductDetailForPage` enriches after transform                       |
| Cache guard    | Stale Redis entries without `committedQuantity` refetch                  |
| Display UI     | `ProductDetailPage` — `getDisplayCommittedQuantity` + warehouse fallback |
| CLAUDE.md      | Removed from `.gitignore`; REQ-0103/0104/0105 sections tracked           |
| Invalidation   | unchanged — `PRODUCT_PATTERNS` clears `products:*` on order/stock CRUD   |

---

## REQ-0104 committedQuantity parity evidence

| Check                                | Result                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| Category/supplier detail SSR         | `enrichProductsWithCommittedQuantity` + cache guard             |
| ForecastingCard                      | `getDisplayCommittedQuantity` for avail                         |
| demand-forecast + supplier-dashboard | `computeCommittedQuantity` with batch allocation sum            |
| Invalidation                         | unchanged — ORDER_GRAPH clears categories/suppliers/forecasting |

---

## REQ-0103 disjoint reservation evidence

| Check            | Result                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Reserve create   | Warehouse pick → allocation only; no pick → product only                             |
| Cancel / fulfill | `releasePendingOrderLines` / `fulfillPendingOrderLines` in order + webhook + invoice |
| Catalog floor    | Beats scenario: 20 reserved blocks at 10, not 40                                     |
| List display     | `committedQuantity` on products/browse/home APIs                                     |
| UI badges        | `getDisplayCommittedQuantity` on table + detail summary                              |

---

## REQ-0102 enrichment consistency evidence

| Check              | Result                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| Single enrich impl | `enrichStockAllocationRows` only; `enrichWarehouseAllocationRows` alias             |
| All SSR paths      | `product-stock-data.ts` + `warehouse-stock-data.ts` use `enrichStockAllocationRows` |
| Dead code removed  | `enrichProductAllocationTotals` deleted                                             |
| Fetch gates        | ProductFormDialog, AllocateStockDialog, OrderLineWarehouseSelect                    |
| DRY catalog copy   | `formatCatalogAllocationSummary` shared helper                                      |

---

## REQ-0102 enrichment parity evidence

| Check                | Result                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Unified enrich       | `enrichStockAllocationRows` on API GET all scopes + product SSR         |
| Product SSR          | `product-stock-data.ts` shared transform + cross-warehouse totals       |
| Warehouse row UI     | Catalog / allocated / unallocated meta on `WarehouseStockAllocationRow` |
| Allocate dialog gate | `useStockByProduct({ enabled: open && activeProductId })`               |
| Dead script          | `fix-product2-stock.ts` absent                                          |

---

## REQ-0102 gap closure evidence

| Check                  | Result                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| Warehouse cross-totals | `enrichStockAllocationRows` on SSR + API all list scopes          |
| Edit allocation        | `useUpdateStockAllocation` + AllocateStockDialog PUT in edit mode |
| Product form gate      | `useStockByProduct({ enabled: open && selected })`                |
| Reconcile apply test   | `apply-catalog-quantity-reconcile.test.ts`                        |
| Dead script            | `fix-product2-stock.ts` absent                                    |

---

## REQ-0102 evidence

| Check              | Command                                                  | Result     | REQ-IDs        |
| ------------------ | -------------------------------------------------------- | ---------- | -------------- |
| Lint               | `npm run lint`                                           | PASS       | REQ-0102       |
| Unit tests         | `npm run test`                                           | PASS (449) | REQ-0102       |
| Invalidation audit | `npm run test:invalidate`                                | PASS (208) | REQ-0102       |
| Build              | `npm run build`                                          | PASS       | REQ-0102       |
| Catalog reconcile  | `planCatalogQuantityReconcile` + product PUT transaction | PASS       | REQ-0102 AC1–2 |
| Allocation guards  | POST/PUT `validateAllocationUpsert`                      | PASS       | REQ-0102 AC3   |
| Warehouse delete   | `getWarehouseDeleteBlockers` 409                         | PASS       | REQ-0102 AC4   |
| Archived rows      | `isArchived` enrich + read-only warehouse row            | PASS       | REQ-0102 AC5   |

---

## REQ-0100 evidence

| Check                | Command                                      | Result     | REQ-IDs      |
| -------------------- | -------------------------------------------- | ---------- | ------------ |
| Lint                 | `npm run lint`                               | PASS       | REQ-0100     |
| Unit tests           | `npm run test`                               | PASS (418) | REQ-0100     |
| Invalidation audit   | `npm run test:invalidate`                    | PASS (205) | REQ-0100     |
| Build                | `npm run build`                              | PASS       | REQ-0100     |
| Avatar seed fallback | `seed={s.userId ?? s.id}` on supplier portal | PASS       | REQ-0100 AC1 |
| No cache bump        | supplierPortal Redis key unchanged           | PASS       | REQ-0100 AC2 |

---

## REQ-0099 evidence

| Check                | Command                            | Result     | REQ-IDs      |
| -------------------- | ---------------------------------- | ---------- | ------------ |
| Lint                 | `npm run lint`                     | PASS       | REQ-0099     |
| Unit tests           | `npm run test`                     | PASS (418) | REQ-0099     |
| Invalidation audit   | `npm run test:invalidate`          | PASS (205) | REQ-0099     |
| Build                | `npm run build`                    | PASS       | REQ-0099     |
| Analytics gap-6      | Order/Invoice/Warehouse sections   | PASS       | REQ-0099 AC1 |
| Supplier avatar seed | `userId` on SSR + AvatarInlineLink | PASS       | REQ-0099 AC2 |
| Dead scripts         | 3 npm entries + files removed      | PASS       | REQ-0099 AC3 |

---

## REQ-0098 evidence

| Check                    | Command                                                     | Result     | REQ-IDs         |
| ------------------------ | ----------------------------------------------------------- | ---------- | --------------- |
| Lint                     | `npm run lint`                                              | PASS       | REQ-0098        |
| Unit tests               | `npm run test`                                              | PASS (418) | REQ-0098        |
| Invalidation audit       | `npm run test:invalidate`                                   | PASS (205) | REQ-0098        |
| Build                    | `npm run build`                                             | PASS       | REQ-0098        |
| Api GlassCardBody        | ApiStatus + ApiDocs inner padding                           | PASS       | REQ-0098 AC1    |
| QR truncate              | QRCodeHover max-width + product name title                  | PASS       | REQ-0098 AC2    |
| Glow badges              | AdminOrderSource, forecast urgency, stock left, health, New | PASS       | REQ-0098 AC3–4  |
| Dashboard CTAs           | AdminAnalytics recent cards + AI glass button               | PASS       | REQ-0098 AC5–6  |
| Portal parity            | gap-6, SectionCountBadge, AvatarInlineLink + SSR image      | PASS       | REQ-0098 AC7–8  |
| Activity + notifications | Activity Logs icon; dropdown counter/inline New/Close       | PASS       | REQ-0098 AC9–10 |

---

## REQ-0097 evidence

| Check                           | Command                                      | Result     | REQ-IDs      |
| ------------------------------- | -------------------------------------------- | ---------- | ------------ |
| Lint                            | `npm run lint`                               | PASS       | REQ-0097     |
| Unit tests                      | `npm run test`                               | PASS (418) | REQ-0097     |
| Invalidation audit              | `npm run test:invalidate`                    | PASS (205) | REQ-0097     |
| Build                           | `npm run build`                              | PASS       | REQ-0097     |
| SectionCardHeader titleTrailing | Email prefs inline HelpTooltip               | PASS       | REQ-0097 AC1 |
| Email prefs spacing             | PageSectionHeader pb-0 + gap-6 parent        | PASS       | REQ-0097 AC1 |
| Admin order audit               | AdminOrderDetailContent creator/updater rows | PASS       | REQ-0097 AC2 |
| GlassCardBody DRY               | 4 catalog detail pages + EmailPreferences    | PASS       | REQ-0097 AC3 |
| Insights GlassCard              | shared import + padding=body                 | PASS       | REQ-0097 AC4 |

---

## REQ-0096 evidence

| Check                 | Command                                         | Result     | REQ-IDs      |
| --------------------- | ----------------------------------------------- | ---------- | ------------ |
| Lint                  | `npm run lint`                                  | PASS       | REQ-0096     |
| Unit tests            | `npm run test`                                  | PASS (418) | REQ-0096     |
| Invalidation audit    | `npm run test:invalidate`                       | PASS (205) | REQ-0096     |
| Build                 | `npm run build`                                 | PASS       | REQ-0096     |
| GlassCard hub         | `lib/ui/glass-card.tsx` + 11-file migration     | PASS       | REQ-0096 AC1 |
| Audit SSR + UI        | order/invoice/warehouse creator/updater         | PASS       | REQ-0096 AC2 |
| Product section icons | Recent Orders + Warehouse Stock SectionTitleRow | PASS       | REQ-0096 AC3 |
| Tests                 | warehouse-detail-data + transform-order-detail  | PASS       | REQ-0096 AC4 |

---

## REQ-0095 evidence

| Check                  | Command                                                            | Result                       | REQ-IDs      |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------- | ------------ |
| Lint                   | `npm run lint`                                                     | PASS                         | REQ-0095     |
| Unit tests             | `npm run test`                                                     | PASS (415)                   | REQ-0095     |
| Invalidation audit     | `npm run test:invalidate`                                          | PASS (205)                   | REQ-0095     |
| Build                  | `npm run build`                                                    | PASS                         | REQ-0095     |
| Portal header pb-6     | ClientPortalPage + SupplierPortalPage                              | PASS — removed pb-0 override | REQ-0095 AC1 |
| Support tickets header | SupportTicketsPageContent PageSectionHeader                        | PASS                         | REQ-0095 AC2 |
| Email prefs glass      | EmailPreferencesPage GlassCard + SectionCardHeader                 | PASS                         | REQ-0095 AC3 |
| Audit user row         | AuditUserDetailRow on catalog detail pages                         | PASS                         | REQ-0095 AC4 |
| Section icons          | Category/Supplier SectionTitleRow icons                            | PASS                         | REQ-0095 AC5 |
| Card padding           | CategoryDetailPage shell; insights inner trim; WarehouseDetailPage | PASS                         | REQ-0095 AC6 |

---

## REQ-0094 evidence

| Check                    | Command                                    | Result                               | REQ-IDs      |
| ------------------------ | ------------------------------------------ | ------------------------------------ | ------------ |
| Lint                     | `npm run lint`                             | PASS                                 | REQ-0094     |
| Unit tests               | `npm run test`                             | PASS (415)                           | REQ-0094     |
| Invalidation audit       | `npm run test:invalidate`                  | PASS (205)                           | REQ-0094     |
| Build                    | `npm run build`                            | PASS                                 | REQ-0094     |
| Navbar Link prefetch     | code review                                | PASS — brand, nav, profile, mobile   | REQ-0094 AC2 |
| Extended RSC warm        | `getWarmPathsForRole`                      | PASS — nav + profile + admin sidebar | REQ-0094     |
| Client filter leak       | `CategoryFilter` enabled gate              | PASS — no fetch when override        | REQ-0094 AC3 |
| REQ-0075 smoke           | code review                                | PASS — no regressions                | REQ-0094 AC4 |
| /admin warm redirect fix | `resolveWarmNavPath`                       | PASS — warms dashboard not redirect  | REQ-0094 gap |
| Portal detail prefetch   | 5 portal/recent-order files                | PASS                                 | REQ-0094 gap |
| Invalidate count note    | AdminSidebar logout fetch removed REQ-0094 | INFO — 205 correct (not regression)  | REQ-0094 gap |

---

### Manual / production (REQ-0094)

| Check                               | Result                    | REQ-ID           |
| ----------------------------------- | ------------------------- | ---------------- |
| Prod `npm start` nav click baseline | PENDING user QA on Vercel | REQ-0094 AC1/AC2 |
| Sentry 24h after deploy             | PENDING                   | REQ-0009 AC5     |

---

## Automated evidence

| Check                       | Command                   | Result     | REQ-IDs  |
| --------------------------- | ------------------------- | ---------- | -------- |
| Lint                        | `npm run lint`            | PASS       | ALL      |
| Unit tests                  | `npm run test`            | PASS (413) | REQ-0092 |
| Invalidation audit          | `npm run test:invalidate` | PASS (205) | ALL      |
| Build                       | `npm run build`           | PASS       | ALL      |
| Typecheck (touched scripts) | `tsc --noEmit`            | PASS       | REQ-0056 |

---

## Manual / production

| Check                                                                 | Result                                                      | REQ-ID                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| AI insights 200 + `provider: groq`                                    | PASS (user verified)                                        | REQ-0005                     |
| Notification bell dropdown visible                                    | PASS (code + prod reachable)                                | REQ-0007                     |
| Supplier category/supplier detail from product                        | PENDING user QA                                             | REQ-0029                     |
| removeChild nav smoke                                                 | PENDING                                                     | REQ-0001, REQ-0006, REQ-0017 |
| Sentry 24h regression                                                 | PENDING (checklist in REVALIDATION_LOG)                     | REQ-0009                     |
| Gmail OAuth login + navbar avatar before/after profile dropdown click | PASS (user screenshot 2026-07-10)                           | REQ-0039, REQ-0040           |
| Vercel prod SHA = `73060a1`                                           | PENDING confirm                                             | ALL                          |
| CRUD delete fast (no 504)                                             | PASS (local dev: category/supplier/warehouse DELETE ~150ms) | REQ-0052                     |

---

## Findings

| ID     | Severity | Finding                                                                     | Status                            |
| ------ | -------- | --------------------------------------------------------------------------- | --------------------------------- |
| VS-007 | INFO     | ChunkLoadError auto-reload in ErrorBoundary                                 | PASS                              |
| VS-008 | INFO     | OrderDialog RHF validation logger level                                     | PASS                              |
| VS-009 | INFO     | Hydration /admin/dashboard-overall-insights                                 | PASS (REQ-0019 stable formatters) |
| VS-010 | INFO     | OAuth state mismatch logger.warn                                            | PASS                              |
| VS-011 | INFO     | Radix portal removeChild scrub + ErrorBoundary                              | PASS                              |
| VS-012 | INFO     | Groq model chain migration (REQ-0018)                                       | PASS                              |
| VS-013 | INFO     | Forecasting AI max_tokens + cache v2 (REQ-0019)                             | PASS                              |
| VS-014 | INFO     | Locale-aware admin formatting (REQ-0020)                                    | PASS                              |
| VS-015 | INFO     | Shell-first nav + data-slot pulse (REQ-0021)                                | PASS                              |
| VS-016 | INFO     | Tier-3 user detail shell-first gap (REQ-0022)                               | PASS                              |
| VS-017 | INFO     | Admin detail shell-first gap (REQ-0023)                                     | PASS                              |
| VS-018 | INFO     | Shell-first consistency + detail SSR + order DRY (REQ-0024)                 | PASS                              |
| VS-019 | INFO     | P3 SSR gaps: ghost fetches, detail secondary, client browse (REQ-0026)      | PASS                              |
| VS-020 | INFO     | Client owner dropdown hang fix (ProductOwnerSelect)                         | PASS                              |
| VS-021 | INFO     | REQ-0027 shallow ownerId URL + deferred admin warm                          | PASS                              |
| VS-022 | INFO     | Glass badges + invoice list scope (REQ-0028)                                | PASS (automated)                  |
| VS-024 | INFO     | Auth login/register UX polish (REQ-0030)                                    | PASS (automated)                  |
| VS-025 | INFO     | Auth left panel list + brand redesign (REQ-0031)                            | PASS (automated)                  |
| VS-026 | INFO     | Auth glass parity, flat list, BG animation (REQ-0032)                       | PASS (automated)                  |
| VS-027 | INFO     | Auth copy, scroll shift, icon glow, spacing (REQ-0033)                      | PASS (automated)                  |
| VS-028 | INFO     | Auth welcome/goodbye session toasts (REQ-0034)                              | PASS (automated + user QA)        |
| VS-029 | INFO     | Google OAuth welcome toast (REQ-0035)                                       | PASS (automated)                  |
| VS-030 | INFO     | Glass button tokens + Batch A/B migration (REQ-0047)                        | PASS (automated)                  |
| VS-031 | INFO     | Auth light mode + dialog tables + order thumbs (REQ-0048)                   | PASS (automated)                  |
| VS-032 | INFO     | Portal & detail UX polish (REQ-0071)                                        | PASS (automated)                  |
| VS-033 | INFO     | REQ-0075 gap closure (REQ-0076)                                             | PASS (automated)                  |
| VS-034 | INFO     | Chart labels, portal headers, product detail UX (REQ-0077)                  | PASS (automated)                  |
| VS-035 | INFO     | Badge nesting hydration fix on /client (REQ-0078)                           | PASS (automated)                  |
| VS-036 | INFO     | Client UI polish — badges, spacing, avatars (REQ-0079)                      | PASS (automated)                  |
| VS-037 | INFO     | Stat badge revert + slate section counters (REQ-0080)                       | PASS (automated)                  |
| VS-038 | INFO     | Client owner picker + category detail parity (REQ-0081)                     | PASS (automated)                  |
| VS-039 | INFO     | Category gap closure + non-blocking forecast (REQ-0082)                     | PASS (automated)                  |
| VS-040 | INFO     | Category forecast loading shell parity (REQ-0083)                           | PASS (automated)                  |
| VS-041 | INFO     | Detail insights parity + forecast SSR sync (REQ-0084)                       | PASS (automated)                  |
| VS-042 | INFO     | Stock UX clarity + dialog/detail UI parity (REQ-0114)                       | PASS (automated)                  |
| VS-043 | INFO     | REQ-0114 dialog gap closure + warehouse summary test (REQ-0115)             | PASS (automated)                  |
| VS-044 | INFO     | Dialog parity + proportional price DRY + detail typography (REQ-0116)       | PASS (automated)                  |
| VS-045 | INFO     | Dialog UX parity + admin embed tables + admin network audit (REQ-0117)      | PASS (automated + audit doc)      |
| VS-046 | INFO     | Readable popover full sweep + prod network confirm (REQ-0118)               | PASS (automated)                  |
| VS-047 | INFO     | Catalog popover parity + order address labels + warehouse rollup (REQ-0119) | PASS (automated)                  |

**Evidence summary (REQ-0114):** Scope: built/verified | Traceability: REQ-0114 | Findings: PASS | Commands: lint, test 492, test:invalidate 208, build

**Evidence summary (REQ-0115):** Scope: built/verified | Traceability: REQ-0115 | Findings: PASS | Commands: lint, test 494, test:invalidate 208, build

**Evidence summary (REQ-0116):** Scope: built/verified | Traceability: REQ-0116 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0117):** Scope: built/verified | Traceability: REQ-0117 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0118):** Scope: built/verified | Traceability: REQ-0118 | Findings: PASS | Commands: lint, test 498, test:invalidate 208, build

**Evidence summary (REQ-0119):** Scope: built/verified | Traceability: REQ-0119 | Findings: PASS | Commands: lint, test 504, test:invalidate 208, build

### VS-045 — Admin network audit (REQ-0117, read-only)

| Pattern                              | Sample                                                                   | Verdict                                                            |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| RSC prefetch `*_rsc=`                | 200–650 ms repeat nav                                                    | Expected — `RouteWarmPrefetch` idle + staggered `router.prefetch`  |
| Cold list API (`orders`, `products`) | 1.0–2.0 s                                                                | Expected — MongoDB + Redis miss on Vercel                          |
| `session` / `jwe`                    | 20–290 ms                                                                | Expected                                                           |
| High total requests (~292–453)       | Warm prefetch + TanStack warm + RSC                                      | Expected aggregate — **no duplicate API call proven**              |
| Admin My Activity hooks              | `useOrders`/`useProducts`/… + SSR `initial*` + `useSyncSsrQueryDataMany` | OK — `withInitialData` / `refetchOnMount:false` pattern (REQ-0021) |

**Recommendation:** Defer prefetch reduction unless HAR shows same endpoint twice on single page mount (confirmed VS-046).

### VS-046 — Production network confirm (REQ-0118)

**Verdict: OK for production** — timings are acceptable for this architecture; not a bug.

| Signal             | Range                                                                    | Status                                          |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Repeat RSC nav     | 96–650 ms                                                                | Good — warm prefetch working                    |
| Cold list API      | 1.0–2.0 s                                                                | Expected — Mongo + Redis miss on serverless     |
| session/jwe        | 20–290 ms                                                                | Normal                                          |
| High request count | ~292–453                                                                 | Intentional warm tradeoff — no duplicate proven |
| CRUD instant UI    | `invalidateAllRelatedQueries` + `useBackWithRefresh` + SSR `initialData` | Unchanged — no regression                       |

---

## Dev manual QA (2026-07-08, cold `.next`)

| Role     | First compile     | Repeat nav    | Detail first | Detail repeat | Notes                               |
| -------- | ----------------- | ------------- | ------------ | ------------- | ----------------------------------- |
| Admin    | RSC 700ms–1.05s   | 96–211ms      | 1.1–2.7s     | 175–477ms     | Login warm-prefetch expected        |
| Supplier | RSC 400–735ms     | 388–401ms     | 385–521ms    | —             | Re-test category link post-REQ-0029 |
| Client   | browse-meta 277ms | RSC 249–323ms | 322–601ms    | —             | Owner dropdown 7 items              |

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

| Order | Task                                   | Done when                                    |
| ----- | -------------------------------------- | -------------------------------------------- |
| 0     | Redeploy Vercel + re-login             | Cookie/JWT 1d                                |
| 1     | UI blockers only                       | Can open lists/dialogs without broken chrome |
| 2     | §10 A1 product edit + 5 min            | No revert                                    |
| 3     | §10 A2 back from detail                | List shows update                            |
| 4     | §10 B1 invoice paid → stock            | No revert                                    |
| 5     | Stop / optionally one-CRUD each domain | Record PASS/FAIL here                        |

**Defer:** Infinity staleTime, full B2–D, every role×route. Record results under this section after QA.

---

## REQ-0136 — Session 2026-07-16 (UI → cache smoke)

**Status:** in_progress — product UI blockers closed (REQ-0138); cache smoke next

| Order | Task                                | Result                 |
| ----- | ----------------------------------- | ---------------------- |
| 0     | Explore seed (REQ-0137)             | PASS — local DB seeded |
| 1     | UI mismatches (product list/detail) | PASS — REQ-0138        |
| 2     | §10 A1                              | _pending_              |
| 3     | §10 A2                              | _pending_              |
| 4     | §10 B1                              | _pending_              |

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

| Entity                             | Count        |
| ---------------------------------- | ------------ |
| Users / Test Supplier              | 3 / 1        |
| Local Parts Co supplier            | 1            |
| Categories / Warehouses / Products | 2 / 2 / 2    |
| Allocations / Transfers            | 3 / 1        |
| Orders / Invoices                  | 2 / 2        |
| Tickets / Reviews / Notifications  | 2 / 2 / 3    |
| Imports / SystemConfig / Audits    | 2 / 2 / 2    |
| Stubs                              | 6 models × 1 |

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

## VS-REQ-0210 (2026-07-25)

Scope: built/pending-verify | Traceability: REQ-0210 | Findings: PENDING user verify
Commands: vitest patch+billing PASS; eslint changed files PASS

## VS-REQ-0209-0211 (2026-07-25)

Scope: built/verified | Traceability: REQ-0209,0210,0211 | Findings: PASS
Commands: lint ✓ · test 724 ✓ · invalidate 221 ✓ · build ✓
Notes: debug ingest stripped; PersonInlineRow title TS; cancel ISO patch typing

## REQ-0214 — Client catalog-history invoice/order read parity (2026-07-29)

| Check | Result |
| ----- | ------ |
| Client INV gate | `getInvoiceByIdForClient` (buyer or order with items) |
| Client ORD gate | `getOrderByIdForClient` own + catalog history |
| Pay | buyer/admin/owner only (UI + checkout order.clientId fallback) |
| Process Refund | `refundDisabled` = same as Cancel (`disableOrderActions`) |
| Supplier/admin | unchanged |
| Invalidation | unchanged (read-path / UI gate only) |
| Gates | lint ✓ tsc ✓ invoice access 9 ✓ invalidate 221 ✓ |

```
Scope: built/verified | Traceability: REQ-0214, REQ-0204 | Findings: PASS
Commands: lint, tsc --noEmit, vitest invoice access, test:invalidate
```


## REQ-0215 — Partial→paid status settle (2026-07-30)

| Check | Result |
| ----- | ------ |
| Cent-safe money | applyIncremental / deriveOrderPaymentStatus cents |
| Heal | sent/overdue→paid; sync order; invalidate on change |
| Confirm | always heal+sync after apply / alreadyApplied |
| SSR | invoice + order detail heal stuck rows |
| Client | stripe return patches paid then invalidate |
| Invalidation | unchanged (order-graph) |
| Gates | lint ✓ payment+heal tests ✓ invalidate ✓ |

```
Scope: built/verified | Traceability: REQ-0215, REQ-0152 | Findings: PASS
Commands: lint, tsc, vitest payment/heal, test:invalidate
```

## REQ-0216 — Global scroll-lock layout shift fix (2026-07-30)

| Check | Result |
| ----- | ------ |
| Auth gutter | `:has(.auth-page-root)` only (global html reverted — FAB inset) |
| RemoveScroll | unlayered `html body[data-scroll-locked]` pad/margin 0 beats injected gap |
| Logs | post-fix `bodyMargR:0` `rootW` stable; `--removed-body-scroll-bar-size:0` |
| #main-content | gutter unchanged |
| Invalidation | N/A (CSS-only) |
| Gates | lint ✓; Firefox Role Select verified |

```
Scope: built/verified | Traceability: REQ-0216, REQ-0033 | Findings: PASS
Commands: lint; Firefox post-fix logs
```

## REQ-0217 — Dynamic empty Select copy (2026-07-30)

| Check | Result |
| ----- | ------ |
| Helpers | selectEmptyPlaceholder / Message / resolveSelectPlaceholder |
| UI | SelectEmptyContent + ProductForm Category/Supplier + Transfer dest |
| Invalidation | N/A (presentational) |
| Gates | lint ✓ select-empty-copy.test ✓ |

```
Scope: built/verified | Traceability: REQ-0217 | Findings: PASS
Commands: lint, vitest select-empty-copy
```

## REQ-0218 — Catalog densify parity (2026-07-30)

| Check | Result |
| ----- | ------ |
| Detail merge | product/category/supplier/warehouse patchDetailCacheMerge |
| Transfer | patchStockCachesAfterTransfer both sides |
| Summary % | patchWarehouseStockSummaryCaches on allocate/update/delete/transfer |
| List # · % | patchCatalogListProductCounts on product CRUD |
| Densify keys | insights/committed/productCount in DENSIFY_KEY_RE |
| Forecast | pulse-on-invalidate (unchanged) |
| Invalidation | still after patches |
| Gates | lint ✓ patch+ssr-sync tests ✓ invalidate ✓ |
| Deferred | KPI/forecast pulse; cross-entity cat/sup insights; committed after order; review/ticket/user thin replace |

```
Scope: built/verified | Traceability: REQ-0218, REQ-0122 | Findings: PASS
Deferred: intentional pulse / lower-impact invalidate lag (not full-app densify)
Commands: lint, vitest patch-mutation-cache ssr-sync-policy, test:invalidate
```

## REQ-0219 — findCachedAllocation QueryKey (2026-07-30)

| Check | Result |
| ----- | ------ |
| Root cause | keys typed as byProduct-only; byWarehouse push failed tsc |
| Fix | `QueryKey[]` + shared QueryClient/QueryKey import |
| Behavior | unchanged — product then warehouse cache lookup |
| Gates | tsc --noEmit ✓ lint ✓ |
| Invalidation | unchanged |

```
Scope: built/verified | Traceability: REQ-0219, REQ-0218 | Findings: PASS
Commands: tsc --noEmit, lint
```

