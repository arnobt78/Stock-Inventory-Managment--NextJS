# Requirements — stock-inventory (Cycle C1)

Canonical REQ source. All artifacts link via `REQ-XXXX`. Status: `done` | `verify` | `planned`.

---

## REQ-0213 — Educational README + Diploi launch docs

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0207 |

**Intent:** Learner-facing README: stack badges, env (3 required + optional), structure, routes, APIs, reuse, SECURITY link, optional Diploi launch (Vercel = prod demo).

**Acceptance criteria**

- AC1: Badges match stack (Next 16 / React 19 / …) + Diploi badge
- AC2: Required vs optional env + how to obtain keys; demo seed accounts
- AC3: SECURITY.md linked; Diploi section under Deploying
- AC4: Docs-only — no app/invalidation changes

**Artifacts:** `README.md`, `SECURITY.md` (existing)

---

## REQ-0212 — Vercel cold-install + Order patch TS (deploy unblock)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0211 |

**Intent:** Unblock Vercel Errors after REQ-0211: cold `npm install` 404 on bad lockfile tarball; `next build` TS fail on order patch merge.

**Acceptance criteria**

- AC1: Direct `eslint-import-resolver-typescript@^3.10.1`; lock `resolved` → `…-3.10.1.tgz` (not `2.10.1.tgz`)
- AC2: `mergeOrderItemsPreservingDensify` always returns `OrderItem[]`
- AC3: `Order` / tracking date fields accept `string | Date` (TanStack ISO)
- AC4: `tsc` + `lint` + `test:invalidate` + `build` PASS; invalidation registry unchanged

**Artifacts:** `package.json`/`package-lock.json`, `merge-order-items-densify.ts`, `use-orders.ts`, `types/order.ts`, `OrderTrackingInfo.tsx`

---

## REQ-0211 — Shippo test-key Auto Generate (silent US to + USPS)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0210 |

**Intent:** With only `shippo_test_*` keys, Auto Generate must succeed: use `SHIPPO_FROM_*` + silent US to-address; prefer USPS rates. Order UI/email still show customer shipping. Gate labels until confirmed or partial/paid. Live keys would use real to-address.

**Acceptance criteria**

- AC1: `isShippoTestMode()` → `resolveShippoLabelAddresses` uses `DEFAULT_TEST_TO_ADDRESS`
- AC2: `selectShippoRateForLabel` prefers USPS in test mode
- AC3: Labels API rejects cancelled + pending unpaid
- AC4: `canShip` on detail matches AC3; customer address unchanged on order record
- AC5: Order update/ship/cancel patches invoice `linkedOrder*` instantly; SSR applies fresher list badges
- AC6: PUT merge keeps line densify (category/supplier); draft→sent heal on money

**Artifacts:** `lib/shippo/server.ts`, labels/tracking routes, `patchOrdersOnShipping`, `patchLinkedInvoicesFromOrder`, `ssr-sync-policy`, `merge-order-items-densify`, `OrderDetailActionBar`

---

## REQ-0210 — Cancel→invoice instant patch + address/shipping UX

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0209, REQ-0153 |

**Intent:** After order cancel/refund, order + invoice list/detail badges update immediately (no stale Cancelled/Refunded). Invoice detail shows billing/shipping from order when needed; cancelled money copy clarifies collected vs due. Shipping Management + order address fields stack so Manual Entry stays visible.

**Acceptance criteria**

- AC1: `patchInvoicesOnOrderCancel` patches invoice list/detail by `orderId` on cancel
- AC2: DELETE order returns `invoiceForOrder` + `statusAt`
- AC3: Invoice detail billing fallback + shipping from linked order; cancelled Balance Closed copy
- AC4: OrderAddressFields + ShippingManagement parties/address stacked; User ID truncate
- AC5: New invoices copy billing else shipping from order

**Artifacts:** `patch-mutation-cache.ts`, `use-orders.ts`, `invoice-detail-data.ts`, `InvoiceDetailPage`, `ShippingManagement`, `OrderAddressFields`, `resolve-invoice-billing-address.ts`

---

## REQ-0209 — Stripe return, confirm-on-pay, Cancel vs Refund

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0208, REQ-0152 |

**Intent:** Stripe checkout returns to the path that started pay (`/admin/...` vs store). First money (partial or paid) sets fulfillment to Confirmed and fulfills reserved stock once. Unpaid/partial → Cancel Order (cancel + refund if money); fully paid → Process Refund (same API). Cancel restores product + warehouse allocations.

**Acceptance criteria**

- AC1: `PaymentDialog` passes `successUrl`/`cancelUrl` via `buildStripeCheckoutReturnUrls` (admin vs store)
- AC2: `syncOrderPaymentStatusFromInvoice` confirms + fulfills on pending + (partial|paid); no double-fulfill on partial→paid
- AC3: `OrderDetailActionBar` Cancel for unpaid|partial; Process Refund for paid (store + admin)
- AC4: Shared `order-destructive-copy` confirm strings; store refund dialog wired
- AC5: `cancelOrder` restores fulfilled stock (confirmed after first money); Stripe refund for partial/paid
- AC6: Debug agent logs removed; gates lint/test/invalidate/build pass

**Artifacts:** `stripe-checkout-return-urls.ts`, `order-payment-from-amounts.ts`, `order-destructive-copy.ts`, `OrderDetailActionBar`, `PaymentDialog`, detail pages, `cancelOrder`

---

## REQ-0208 — Admin order detail parity + Parties User ID

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 (UI explore), REQ-0065/0147 admin detail |

**Intent:** Align `/admin/orders/[id]` with `/orders/[id]`: read-only status badges, dialog-driven CRUD via shared bottom action bar (incl. Process Refund when paid), remove redundant Customer/Invoice cards, relocate Shipping & Tracking to right column, show copyable User ID on every Parties & Roles row.

**Acceptance criteria**

- AC1: Admin Order Status is badge-only (no inline Select); status/fields edit via `OrderDialog`
- AC2: Shared `OrderDetailActionBar` on store + admin — Back, Update, View/Create Invoice, Pay, Ship, Cancel (unpaid) / Process Refund (admin+paid) with glass + spinner pending labels
- AC3: Remove admin Customer Information + Invoice side cards; invoice remains in Order Information + footer
- AC4: Shipping & Tracking card moves to right column (former invoice slot); footer Ship Order retained
- AC5: Parties & Roles shows User ID + `CopyableText` under each party with `userId` (order + invoice detail)
- AC6: Invalidation unchanged (`invalidateAfterOrderGraphChange` / patch); gates lint/test/invalidate/build pass

**Artifacts:** `OrderDetailActionBar`, `PersonInlineRow`/`PartiesRolesCard`, `AdminOrderDetailContent`, `OrderDetailPage`

---

## REQ-0202 — Detail no-flicker (Select labels + densify SSR sync)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0020 / REQ-0133 / REQ-0198 |

**Intent:** Stop Role/status Select blank flash on detail; prefer richer densify when SSR sync timestamps match; fill product supplier image + product-page reviewerEmail.

**Acceptance criteria**

- AC1: User role + order status/carrier `SelectValue` children from SSR (no empty mount)
- AC2: `resolveSsrSyncAction` applies when equal `updatedAt` but SSR densify richer; fresher cache still wins
- AC3: Product supplier user `image`; product reviews by-product + SSR include `reviewerEmail`
- AC4: Invalidation unchanged; gates pass

**Artifacts:** AdminUserManagementDetailContent, AdminOrderDetailContent, ssr-sync-policy, product-detail-data, product-reviews-detail-data, by-product route

---

## REQ-0201 — Related product densify (create / edit / detail)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0197 / REQ-0200 / REQ-0179 |

**Intent:** Related product matches Add Product Review densify (thumb · name · SKU · price · stock · category · owner · supplier) on create picker, edit RO, and detail Related Product card.

**Acceptance criteria**

- AC1: `DialogProductOptionRow` optional price/quantity; owner-products API passes party densify
- AC2: Create + edit RO use densify; detail SSR `loadTicketRelatedSnap` densify fields
- AC3: `TicketRelatedProductDense` (Link + CopyableText); card title Related Product; no Product: label
- AC4: Invalidation unchanged; gates pass

**Artifacts:** ProductOptionRow, SupportTicketDialog, ticket-related-enrich, TicketRelatedProductDense, admin/user detail

---

## REQ-0200 — Owner-scoped Related products + Send-to Select control

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0197 |

**Intent:** Related product picker lists the selected Send-to owner's full catalog for every role (not viewer-scoped `GET /api/products`). Send-to Select stays controlled for client/supplier.

**Acceptance criteria**

- AC1: `GET /api/support-tickets/owner-products?ownerId=` + `getOwnerProductsForSupport` (mergeProductListWhere by owner userId)
- AC2: Create dialog uses `useSupportTicketOwnerProducts(assignedToId)`; admin/client/supplier see same owner catalog
- AC3: Send-to Select `value` never `undefined` (`""` / `"none"`)
- AC4: Query key under `supportTickets.all`; invalidation via existing `invalidateAllRelatedQueries`; unit test; gates pass

**Artifacts:** support-tickets-data, owner-products route, use-support-tickets, SupportTicketDialog, endpoints/client/config

---

## REQ-0199 — Dialog Combobox hover consistency + outside-click reopen fix

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0060 / REQ-0197 / REQ-0198 |

**Intent:** Dialog Combobox triggers match dark glass Selects (no white outline hover); Popover-in-Dialog outside click closes once without reopen.

**Acceptance criteria**

- AC1: `DIALOG_COMBOBOX_TRIGGER_CLASS` + ghost Button on invoice Order picker, ticket Related product, allocate/transfer
- AC2: `Popover modal` + `onCloseAutoFocus` preventDefault on those pickers
- AC3: Invalidation unchanged; gates pass

**Artifacts:** dialog-form-field, OrderPickerCommand, SupportTicketDialog, AllocateStockDialog, TransferStockDialog

---

## REQ-0198 — Smooth dialog open (no bounce/flicker)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0005 / REQ-0006 / REQ-0193 |

**Intent:** Dialogs with DeferredSelectGate open without placeholder→Select bounce; form sync during render; route-nav Select safety preserved.

**Acceptance criteria**

- AC1: `useDeferredRadixSelect` mounts Select immediately on same-route enable; one-frame defer only after pathname change
- AC2: `useSyncDialogOpenState` replaces queueMicrotask/open useEffect resets in gated dialogs
- AC3: Placeholders match SelectTrigger height/content (review, ticket, product, warehouse, order, invoice, shipping, create-user)
- AC4: Invalidation unchanged; gates pass

**Artifacts:** use-deferred-radix-select, DeferredSelectGate, use-sync-dialog-open-state, dialog sweep

---

## REQ-0197 — Optional product link + role-aware Reply-to + safe Reassign

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0190 / REQ-0191 / REQ-0195 |

**Intent:** Optional owner-scoped Related product on create; keep admin Reassign and clear mismatched `productId` server-side; role-aware chat “Reply to” for creator vs assignee/admin.

**Acceptance criteria**

- AC1: Create dialog optional Related product Command after Send-to; options = products owned by selected assignee; reset on owner change; “— None —”; create payload includes `productId` when set
- AC2: Reassign kept; on assignee change server clears `productId` when product owner ≠ next assignee; confirm copy warns; update schema allows `productId: null`
- AC3: `resolveTicketReplyTarget` — creator→assignee/Support; assignee/admin→creator; wired in ReplyThread title + placeholder
- AC4: Invalidation unchanged (`useUpdateSupportTicket` patch + invalidate); unit tests; gates pass

**Artifacts:** SupportTicketDialog, TicketReassignDialog, SupportTicketReplyThread, ticket-reply-target, ticket-reassign-product, PUT/POST support-tickets, updateSupportTicketSchema

---

## REQ-0196 — Detail GlassCard single padding (ticket + review)

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0191 / REQ-0183 |

**Intent:** Remove double `p-2 sm:p-4` on ticket/review detail cards; order-detail GlassCard body pad is the single source.

**Acceptance criteria**

- AC1: Admin + client ticket detail GlassCards — no inner card pad
- AC2: ReplyThread + AdminProductReviewDetail — same
- AC3: Keep layout `space-y-*` / flex; leave content-panel `p-4` alone
- AC4: Invalidation unchanged; gates pass

**Artifacts:** AdminSupportTicketDetailContent, SupportTicketDetailContent, SupportTicketReplyThread, AdminProductReviewDetailContent

---

## REQ-0195 — Non-admin support ticket list/detail/edit parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0190–0193 |

**Intent:** Client/supplier ticket list Customer sky text-xs links; detail card parity with admin (minus Notes/Reassign); Edit Status read-only for non-admin with API harden.

**Acceptance criteria**

- AC1: Non-admin list Customer/Sent to use `resolveDetailAuditUserHref` → sky text-xs
- AC2: Non-admin detail: Status/Priority/Messages, Ticket info, Description, Related, chat, footer
- AC3: Edit dialog Status RO badge for non-admin; admin Select; omit status from PUT
- AC4: `resolveStatusUpdate` — admin only; unit tests; invalidation unchanged; gates pass

**Artifacts:** SupportTicketTableColumns, SupportTicketDetailContent, SupportTicketDialog, ticket-assignee-policy, PUT `[id]`

---

## REQ-0194 — Ticket chat bubble dynamic width + glow

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0193 |

**Intent:** Chat bubbles hug content (max 90%) with opposing left/right glass glow gradients instead of flat full-width fills.

**Acceptance criteria**

- AC1: Bubbles `w-fit max-w-[90%]`; short replies shrink; long wrap with `break-words`
- AC2: Left (creator) glow on left → white/clear on right
- AC3: Right (staff) glow on right → white/clear on left
- AC4: Tokens in `ticket-chat-bubble-styles.ts`; invalidation unchanged; gates pass

**Artifacts:** `lib/ui/ticket-chat-bubble-styles.ts`, `SupportTicketReplyThread`

---

## REQ-0193 — Support ticket detail/dialog gap closure

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0190–0192 |

**Intent:** Close ticket detail/dialog UX gaps: smooth Reassign open, Reply header typography, opening description in chat, 90% bubbles + clickable authors, notes delete confirm, Status Select solid/opaque badges.

**Acceptance criteria**

- AC1: Reassign dialog placeholder height matches SelectTrigger; sync open reset (no microtask bounce)
- AC2: “Reply to” + creator name same title size; name sky + Link when href
- AC3: Opening description prepended as first left chat bubble (Description card kept)
- AC4: Bubbles `w-[90%]`; author names Link via `authorHrefForUserId`
- AC5: Notes trash → AlertDialogWrapper with subject + notes preview
- AC6: `TicketStatusBadge` contrast solid/opaque; Edit Status Select uses them
- AC7: Invalidation unchanged; gates pass

**Artifacts:** TicketReassignDialog, SupportTicketReplyThread, AdminSupportTicketDetailContent, SupportTicketDetailContent, SupportTicketDialog, semantic-badges TicketStatusBadge

---

## REQ-0192 — Ticket message count parity (description + replies)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0191 |

**Intent:** Detail Messages stats match table: opening description counts as 1 creator message plus replies (`1 + replyCount`).

**Acceptance criteria**

- AC1: `computeTicketMessageStats` / `ticketMessageTotal` shared helper + unit tests
- AC2: Detail Messages card uses helper; subtitle “Opening description + thread replies”
- AC3: Table Messages column + list KPIs use `ticketMessageTotal`
- AC4: Invalidation unchanged; gates pass

**Artifacts:** `ticket-message-stats.ts`, AdminSupportTicketDetailContent, SupportTicketTableColumns, SupportTicketList, SupportTicketsPageContent

---

## REQ-0191 — Support ticket detail redesign (review parity)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0185 / REQ-0190 |

**Intent:** Ticket detail matches review detail: read-only Status/Priority badges, message stats column, densified info + Sent to, chat replies, notes header edit, footer Edit/Reassign/Delete dialogs. Admin API parity for GET/replies/DELETE.

**Acceptance criteria**

- AC1: No inline Status/Priority Selects; edit via SupportTicketDialog (Status on edit)
- AC2: Messages card — total / from creator / from staff from replies
- AC3: Ticket info — subject accent, Creator + Sent to densify, Created|Updated same row
- AC4: Chat bubbles left=creator / right=staff; Reply to {name} sky; Send icon on compose
- AC5: Internal Notes read-only + header Edit/Delete icons; inline Cancel/Save
- AC6: Footer Back · Edit · Reassign (admin) · Delete with icon + dynamic alert
- AC7: Related product/order/supplier when IDs present; review Created|Updated same row
- AC8: Admin can GET detail, replies, DELETE; invalidation unchanged; gates pass

**Artifacts:** AdminSupportTicketDetailContent, SupportTicketDetailContent, SupportTicketReplyThread, TicketReassignDialog, ticket-related-enrich, ticket-assignee-policy reuse

---

## REQ-0190 — Edit Send-to read-only + admin Reassign

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0185 |

**Intent:** On edit, Send-to is read-only for all roles so mid-conversation rewiring cannot happen silently. Create keeps the owner Select. Admin reassigns via a separate Actions flow with confirmation. API enforces admin-only assignee changes.

**Acceptance criteria**

- AC1: Edit dialog shows Send-to read-only (densified row); omit `assignedToId` on PUT
- AC2: Create dialog Select unchanged (optional admin; required client/supplier when owners exist)
- AC3: Admin Actions **Reassign…** → Select + confirm AlertDialog → `useUpdateSupportTicket({ assignedToId })`
- AC4: API: `canMutateSupportTicket` includes admin; `resolveAssignedToUpdate` admin-only
- AC5: Invalidation unchanged (existing patch + `invalidateAllRelatedQueries`); gates pass

**Artifacts:** `SupportTicketDialog`, `SupportTicketActions`, `ticket-assignee-policy`, PUT `[id]` route

---

## REQ-0189 — Ticket/review table Subject·Comment·Date polish

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0185 |

**Intent:** Ticket Subject & Description header + sky subject link + dual-line truncate; review Comment sky link to detail; Created/Updated muted labels on both tables (product table parity). Actions menus unchanged.

**Acceptance criteria**

- AC1: Ticket header → **Subject & Description**; subject + description single-line `truncate` + `title=`
- AC2: Subject sky `Link` to detail (`TABLE_CATALOG_LINK_CLASS`); Actions View stays
- AC3: Review Comment sky `Link` to detail; Actions View stays
- AC4: Both tables muted `Created:` / `Updated:` labels; dates keep `ClientDateTime` semantic
- AC5: Invalidation unchanged; gates pass

**Artifacts:** `SupportTicketTableColumns.tsx`, `ProductReviewTableColumns.tsx`

---

## REQ-0188 — Send-to Select avatar clip + readable text

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0185 |

**Intent:** Fix Send-to SelectTrigger clipping avatar (Radix line-clamp) without padding; dual-surface owner name/email/product text for dark trigger + light popover.

**Acceptance criteria**

- AC1: Send-to SelectTrigger overrides `line-clamp` / overflow so avatar is not clipped
- AC2: Avatar uses `overflow-hidden rounded-full` on circle only (no padding workaround)
- AC3: OwnerSelectRow `surface=trigger|item` readable on dark field + light popover
- AC4: Invalidation unchanged; gates pass

**Artifacts:** `SupportTicketDialog.tsx` (`OwnerSelectRow`)

---

## REQ-0185 — Support ticket table + detail UI (admin / client / supplier)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 (UI explore findings) |

**Intent:** Densify ticket tables like reviews; Actions MoreVertical CRUD; create/edit dialog with required Send-to (client/supplier); Priority badge contrast; Reviewer cell supplier-style.

**Acceptance criteria**

- AC1: Customer/Sent to avatar + sky name + email copy; Redis `supportTickets:list:v2`
- AC2: `SupportTicketActions` View/Edit/Delete; edit via `SupportTicketDialog`
- AC3: Client/supplier assignedTo required (API + UI); owner densify image+productCount
- AC4: `TicketPriorityBadge` contrast solid/opaque; Reviewer column supplier-style
- AC5: Invalidation unchanged; gates pass

**Artifacts:** `PersonNameEmailCell`, `SupportTicketActions`, `SupportTicketDialog`, `ticket-list-enrich`, semantic-badges, columns/detail

---

## REQ-0186 — Warehouse dialog + detail UI polish

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Fix warehouse create/edit dialog and warehouse detail page UI bugs found in explore.

**Acceptance criteria**

- AC1: Warehouse dialog layout/fields readable (light + dark) — Type Select solid/opaque badges
- AC2: Warehouse detail page spacing/typography/actions polish — table Type badge + CopyableText + View Details
- AC3: Invalidation unchanged unless required; gates pass

**Artifacts:** `WarehouseTypeBadge` contrast, `WAREHOUSE_TYPE_OPTIONS`, `WarehouseTableColumns`, `WarehouseActions`, `WarehouseDialog`

---

## REQ-0203 — Warehouse detail + Allocate/Transfer UI polish

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Compact detail header status, reorder Info/Stock under stats, TYPO tokens, densify stock rows, ticket-parity product pickers on Allocate/Transfer.

**Acceptance criteria**

- AC1: Status compact in `PageSectionHeader.trailing`; no tall status card
- AC2: Info|Stock directly under 4 stats; Insights after
- AC3: Insights + Info/Stock titles use `TYPO_CARD_TITLE` / `TYPO_SUBTITLE`
- AC4: Stock rows name·SKU (muted) / category·supplier; catalog meta left; edit/delete inline
- AC5: Allocate/Transfer use `DialogProductOptionRow` (Transfer joins `useProducts` for owner densify); destination `WarehouseTypeBadge` + check
- AC6: Footer CRUD gated by `canManageStock`; invalidation unchanged; gates pass

**Gap (2026-07-22):** muted SKU; catalog meta + inline actions; Transfer owner densify via catalog join — no API/invalidation.  
**DRY (2026-07-22):** `productSupplierImage` / `productSupplierId` live in `ProductOptionRow`; Allocate/Transfer import.

**Artifacts:** `WarehouseDetailPage`, `WarehouseStockAllocationRow`, `WarehouseInsightsSection`, `AllocateStockDialog`, `TransferStockDialog`, `ProductOptionRow`

---

## REQ-0204 — Supplier view-only invoice detail

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Close supplier invoice 404s — allow read-only `/invoices/[id]` when the invoice order contains the supplier’s products (parity with client view; no CRUD/pay).

**Acceptance criteria**

- AC1: `getInvoiceByIdForSupplier` + `getInvoiceDetailForPage` supplier branch
- AC2: Supplier INV links / View Invoice open full detail (no 404); unrelated invoices denied
- AC3: Mutations off + Pay hidden (existing); PDF uses same detail gate (client + supplier)
- AC4: Supplier nav **Related Invoices** → `/invoices`; list header copy parity
- AC5: Client detail + Pay unchanged; invalidation unchanged; gates pass

**Artifacts:** `prisma/invoice.ts`, `lib/server/invoice-detail-data.ts`, `app/api/invoices/[id]/pdf/route.ts`, `role-nav-config.ts`, `InvoiceList.tsx`

---

## REQ-0205 — Supplier Related Invoices state cards

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Show the same four supplier-portal KPI cards on Related Invoices (`/invoices` as supplier) that already exist on View Orders (`/orders`).

**Acceptance criteria**

- AC1: SSR `initialSupplierPortal` on `/invoices` supplier branch (parity with `/orders`)
- AC2: `InvoiceList` wires `useSupplierPortalDashboard` + 4 `StatisticsCard`s (Products / Orders / Revenue / Invoices)
- AC3: Client/admin invoice cards unchanged
- AC4: Invalidation unchanged (`supplierPortal` already cleared on order-graph); gates pass

**Artifacts:** `app/invoices/page.tsx`, `InvoicesPage.tsx`, `InvoiceList.tsx`

---

## REQ-0206 — Portal SSR sync key alignment

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Role-scoped supplier/client portal SSR sync must write the same TanStack key the live hooks use (`portal.* + userId`), not admin `supplierPortal` / `clientPortal` keys.

**Acceptance criteria**

- AC1: `queryKeys.portal.supplierDashboard|clientDashboard|clientCatalogDashboard(userId)` helpers
- AC2: Hooks + warm prefetch use helpers
- AC3: OrderList / InvoiceList / ProductList / portal pages sync to role keys
- AC4: Admin `useSupplierPortal` / `useClientPortal` keys unchanged; invalidation unchanged; gates pass

**Artifacts:** `lib/react-query/config.ts`, `use-portal.ts`, `warm-route-prefetch.ts`, Order/Invoice/Product lists, portal pages, `portal-query-keys.test.ts`

---

## REQ-0207 — SECURITY.md (OSS hygiene)

| Field | Value |
|-------|-------|
| **Priority** | P3 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Add GitHub-standard private vulnerability reporting for the public showcase repo (no third-party audit program).

**Acceptance criteria**

- AC1: Root `SECURITY.md` — contact, scope, out-of-scope, best-effort response
- AC2: README links to `SECURITY.md`
- AC3: No app/invalidation changes; docs write-through

**Artifacts:** `SECURITY.md`, `README.md`

---

## REQ-0187 — Invoice/Order dialog densify + catalog STATUS

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Densify Invoice create order picker + selected panel (glass-readable), unify Order create line feedback, match Category/Supplier detail STATUS captions to Warehouse.

**Acceptance criteria**

- AC1: Invoice picker — no `(sku)` / `(status)`; icons + `·` densify; trigger shows order # · total + badges
- AC2: Selected-order panel readable on dark glass (solid badges + white/muted lines; `name · sku`)
- AC3: Order create line — Subtotal under Product; Required under Qty; Max / stockError / Auto-assign under Warehouse (column-scoped; no full-width band)
- AC3b: Product picker — searchable Combobox; `DialogProductOptionRow` in trigger + list (gray name, muted SKU/price/stock/reserved, supplier avatar)
- AC3c: Warehouse picker — name line 1 truncate; line 2 type badge · muted avail (trigger + items)
- AC4: Category/Supplier header STATUS matches Warehouse (`CheckCircle2` + compact badge)
- AC5: Invalidation unchanged; gates pass

**Artifacts:** `OrderPickerCommand`, `InvoiceDialog`, `OrderDialogCreateLineItem`, `OrderLineWarehouseSelect`, `DialogWarehouseOptionRow`, `DialogProductOptionRow`, `OrderStatusBadge`/`PaymentStatusBadge` contrast, `CategoryDetailPage`, `SupplierDetailPage`

---

## REQ-0184 — Restore Edit Review dialog stacked layout

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0183 |

**Intent:** Revert Edit Review dialog from 2-col Status|Comment back to stacked w-full (Status → Rating → Comment). Keep solid/opaque Status badges. Detail page 2-col unchanged.

**Acceptance criteria**

- AC1: Edit dialog form stacks Status → Rating → Comment (same as create)
- AC2: No `sm:max-w-2xl` / `md:grid-cols-2` on edit
- AC3: ReviewStatusBadge solid/opaque contrast retained
- AC4: Invalidation unchanged; gates pass

**Artifacts:** `WriteEditReviewDialog.tsx`

---

## REQ-0183 — Review detail + Edit dialog UX polish

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0181, REQ-0182 |

**Intent:** Readable ReviewStatusBadge contrast; Status+Rating | Comment layout; purchase densify + sky number links; reviewer email dedupe; product values text-sm; Trash icon + dynamic delete copy.

**Acceptance criteria**

- AC1: `ReviewStatusBadge` contrast solid/opaque; dialog Select uses solid/opaque; detail uses opaque
- AC2: Detail + Edit dialog: Status+Rating left, Comment right
- AC3: Purchase enrich order/invoice status/payment/total/date; sky Link on numbers
- AC4: Reviewer PersonInlineRow no email; product DetailInfoRow text-sm; Delete Trash2 + dynamic copy
- AC5: Invalidation unchanged; gates pass

**Artifacts:** `semantic-badges`, `WriteEditReviewDialog`, `AdminProductReviewDetailContent`, `enrich-review-catalog`, `types/product-review`

---

## REQ-0182 — Product reviews table Actions `...` menu

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0181, REQ-0180 |

**Intent:** Replace product-reviews table View button with MoreVertical dropdown: View Details · Edit Review (dialog + allowStatusEdit) · Delete Review (confirm). CategoryActions parity.

**Acceptance criteria**

- AC1: Actions cell uses `ProductReviewActions` MoreVertical menu
- AC2: Edit opens `WriteEditReviewDialog` with `allowStatusEdit`; Delete uses `useDeleteProductReview` + AlertDialog
- AC3: Invalidation unchanged; gates pass

**Artifacts:** `ProductReviewActions`, `ProductReviewTableColumns`

---

## REQ-0181 — Review detail display-only; edit via dialog (+ status)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0180, REQ-0165 |

**Intent:** Admin review detail is display-only (status badge + stars/comment). Status/rating/comment edits only via `WriteEditReviewDialog` with admin Status Select (`allowStatusEdit`). Client/author edit paths omit status.

**Acceptance criteria**

- AC1: Detail removes instant Status/Rating Selects and Edit Comment; keep badge + stars + comment + catalog cards + footer Edit/Delete
- AC2: Dialog `allowStatusEdit` → Status Select (Pending/Approved/Rejected) full-width; submit includes status
- AC3: Client call sites omit `allowStatusEdit`; API status 403 for non-owner unchanged
- AC4: Invalidation unchanged (patch → invalidateAllRelatedQueries); gates pass

**Artifacts:** `AdminProductReviewDetailContent`, `WriteEditReviewDialog`

---

## REQ-0180 — Product reviews table densify + detail redesign

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0179, REQ-0165 |

**Intent:** Densify admin product-reviews table (product thumb+SKU copy, reviewer avatar+email copy) and redesign AdminProductReviewDetailContent to invoice/product-detail parity with catalog enrich, related order/invoice, glass Edit/Delete. Keep instant status/rating selects; add Edit Review dialog. Redis list v2.

**Acceptance criteria**

- AC1: List/detail SSR enrich product image/category/supplier + reviewerImage; detail orderNumber + invoice link when orderId set
- AC2: Redis `productReviews:list:v2` + shape guard; detail is Prisma+enrich only (no Redis detail); invalidation unchanged
- AC3: Table Product column = ProductThumb + sky name Link + CopyableText SKU; Reviewer = AvatarInlineLink + email copy
- AC4: Detail layout: Status/Rating selects; Product/Reviewer cards; Purchase card; Rating&Comment; Edit Comment; footer Back + Edit Review + Delete
- AC5: Add Review rating `(N stars)` uses dialogTextClass + font-medium; gates pass

**Artifacts:** `enrich-review-catalog`, `product-reviews-data`, `product-review-detail-data`, `ProductReviewTableColumns`, `AdminProductReviewDetailContent`, `cache-utils`, `types/product-review`

---

## REQ-0179 — Add Product Review dialog rating + product picker

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0167, REQ-0173 |

**Intent:** Add Product Review dialog: rating label uses `getRatingDisplay` hues; product Select densifies with thumb/SKU/category/owner/supplier avatars via list API enrich.

**Acceptance criteria**

- AC1: Rating Select stars + `(N stars)` use `getRatingDisplay` starClass + dialogTextClass
- AC2: `DialogProductOptionRow` (no Links) in product Select trigger + items
- AC3: GET products + home-data list include `productOwnerName/Image` + `supplierImage`; Redis `products:list:v3`
- AC4: Shared `product-list-party.ts`; invalidation unchanged; gates pass

**Artifacts:** `ProductReviewDialog`, `ProductOptionRow`, `product-list-party`, `app/api/products/route`, `home-data`, `cache-utils`, `types/product`

---

## REQ-0178 — Supplier portal recent orders buyer row

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0177, REQ-0176 |

**Intent:** Recent Supplier Orders date row shows Calendar · date · clickable buyer avatar+name (client-portal / analytics parity).

**Acceptance criteria**

- AC1: `SupplierPortalRecentOrder` has `placedById` / `placedByName` / `placedByImage`
- AC2: SSR selects `userId`/`clientId`, batch users, `resolveBuyerDisplayFromUsers`
- AC3: UI third meta row = Calendar · date · AvatarInlineLink → `/admin/user-management/{id}`
- AC4: Redis `supplierPortal:overview:v4` + shape guard `placedById`; invalidation unchanged
- AC5: Gates pass

**Artifacts:** `types/supplier-portal`, `supplier-portal-data`, `AdminSupplierPortalContent`, `cache-utils`

---

## REQ-0177 — Admin portal recent-card densify + typography

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0174, REQ-0176, REQ-0170 |

**Intent:** Admin supplier/client portal GlassCard headers use `SectionCardHeader` (TYPO_CARD_TITLE / TYPO_SUBTITLE). Densify Recent Products/Orders/Invoices to match dashboard Recent cards; SSR enrich + Redis key bumps.

**Acceptance criteria**

- AC1: Supplier + Client portal section cards → `SectionCardHeader` (Products/Orders/Suppliers; Orders/Invoices/Clients)
- AC2: Recent Supplier Products — name text-sm · SKU copy; stock·reserved·category·supplier; status above price
- AC3: Recent Supplier Orders — product·Tag·supplier + Calendar date; Redis `supplierPortal:overview:v3`
- AC4: Recent Client Orders/Invoices — product meta + date-first client; Redis `clientPortal:overview:v4`
- AC5: Shape guards reject stale Redis; invalidation registry unchanged; gates pass

**Artifacts:** `AdminSupplierPortalContent`, `AdminClientPortalContent`, `supplier-portal-data`, `client-portal-data`, `types/*-portal`, `cache-utils`

---

## REQ-0176 — Recent Orders/Reviews meta gap + date-first buyer

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0174 |

**Intent:** Add vertical gap between product and buyer meta lines; put Calendar+date before buyer/reviewer avatar so ring-offset avatars are not left-aligned under ProductThumb.

**Acceptance criteria**

- AC1: Recent Orders + Reviews card body `flex-col gap-1.5` (was `gap-0.5`)
- AC2: Buyer/reviewer meta row order = Calendar · date · AvatarInlineLink name
- AC3: CSS/UI only — no SSR/invalidation/cache changes; gates pass

**Artifacts:** `AdminAnalyticsContent`

---

## REQ-0175 — Portal recent-card meta row clip parity

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0174 |

**Intent:** Admin Client/Supplier portal avatar meta rows use `CARD_LIST_META_ROW_CLASS` (no truncate clip).

**Acceptance criteria**

- AC1: AdminClientPortalContent orders + invoices meta → `CARD_LIST_META_ROW_CLASS`
- AC2: AdminSupplierPortalContent products + orders meta → same
- AC3: Role Client/Supplier portal plain-text meta spans unchanged
- AC4: No invalidation/SSR/cache changes; gates pass

**Artifacts:** `AdminClientPortalContent`, `AdminSupplierPortalContent`, `card-list-styles`

---

## REQ-0174 — Recent cards clip fix + Orders/Reviews densify

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0170, REQ-0173 |

**Intent:** Stop avatar ring clipping on Recent cards; denser Recent Orders (3 lines) and category beside review stars; SSR supplierImage + review category; dashboard cache v7.

**Acceptance criteria**

- AC1: `CARD_LIST_META_ROW_CLASS` + AvatarInlineLink overflow fix; all 4 Recent cards use clip-safe rows
- AC2: Recent Orders — order # / product·Tag category·supplier avatar / buyer·Calendar date
- AC3: Recent Reviews — product · ★ · Tag category; reviewer·date clip-safe
- AC4: DTO enrich + Redis `dashboard:overview:v7` + shape guard; no invalidation registry changes
- AC5: Gates pass

**Artifacts:** `card-list-styles`, `AvatarInlineLink`, `dashboard-data`, `AdminAnalyticsContent`, `types/dashboard`, `cache-utils`

---

## REQ-0173 — Top Products denser cells + header weight

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0172, REQ-0170 |

**Intent:** Top Products by Orders matches forecast denser product cell; `font-medium` headers; shared `DenseCatalogProductCell`.

**Acceptance criteria**

- AC1: `DashboardTopProduct` + dashboard-data enrich image/category/supplier; cache `dashboard:overview:v6`
- AC2: Extract `DenseCatalogProductCell`; ForecastingSection + Top Products use it
- AC3: Top Products `<th>` `text-gray-700 dark:text-white font-medium`
- AC4: No invalidation registry changes; gates pass

**Artifacts:** `DenseCatalogProductCell`, `dashboard-data`, `AdminAnalyticsContent`, `ForecastingSection`, `cache-utils`

---

## REQ-0172 — Forecast product cell 2-line + table Y-scrollbar fix

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0171, REQ-0077 |

**Intent:** Tighten forecast Product column to 2 responsive lines; supplier AvatarInlineLink (products-table circle ring); stop nested Y scrollbars from Table `overflow-auto`.

**Acceptance criteria**

- AC1: Line 1 — product name · SKU CopyableText (flex-wrap)
- AC2: Line 2 — category · AvatarInlineLink supplier (circle ring + optional User.image)
- AC3: `ui/table` wrapper `overflow-x-auto` (not `overflow-auto`); remove redundant forecast `overflow-x-auto` wrappers
- AC4: No invalidation changes; gates pass

**Artifacts:** `ForecastingSection`, `components/ui/table.tsx`

---

## REQ-0171 — Forecast KPI compact + denser product cells

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0170, REQ-0059, REQ-0058 |

**Intent:** Compact Forecasting StatisticsCards (drop min-h); denser forecast Product column with CopyableText SKU, clickable category, square supplier image + sky name.

**Acceptance criteria**

- AC1: `StatisticsCard` optional `compact` — ForecastingSection KPIs only (no global min-h removal)
- AC2: `ProductDemandForecast` / `SalesAnomaly` include category + supplier (+ supplierImage); demand-forecast batch enrich
- AC3: Forecast cache `forecasting:summary:v4` (SSR + API in sync)
- AC4: `ForecastProductCell` — CopyableText SKU · Tag+category link; square SafeImage supplier (`rounded-md`, not circle) + sky supplier link; all three tables
- AC5: No invalidation registry changes; gates pass

**Artifacts:** `StatisticsCard`, `ForecastingSection`, `types/forecasting`, `demand-forecast`, `forecasting-data`, `app/api/forecasting`

---

## REQ-0170 — Admin portal/dashboard recent-card density + forecast shell

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0168, REQ-0077, REQ-0127 |

**Intent:** Clickable denser Latest-5 / portal recent cards (avatars, thumbs, · separators); ForecastingSection StatisticsCard + ChartCard parity.

**Acceptance criteria**

- AC1: Dashboard Recent Orders — buyer/product/category/supplier sky + AvatarInlineLink/ProductThumb; cache v5
- AC2: Tickets/Reviews/Imports — user(+product) avatars/links
- AC3: Supplier portal recent products/orders thumbs + supplier avatars; cache v2
- AC4: Client portal recent orders/invoices client avatars; cache v3
- AC5: ForecastingSection KPIs → StatisticsCard; sections → ChartCard; product cells thumb+sky; forecast cache v3
- AC6: No invalidation registry changes; gates pass

**Artifacts:** dashboard-data, AdminAnalyticsContent, supplier/client portal SSR+UI, ForecastingSection, demand-forecast, cache-utils

---

## REQ-0169 — Stats-grid shell spacing + My Activity Actions polish

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0168, REQ-0045, REQ-0061 |

**Intent:** Close REQ-0168 nits — no double pb under gap-6 shells; My Activity OrderActions without noop onEdit.

**Acceptance criteria**

- AC1: `PAGE_STATS_GRID_IN_SHELL_CLASS` on BI + My Activity (gap-6 parents)
- AC2: `PAGE_STATS_GRID_CLASS` unchanged for portals/browse needing pb-6
- AC3: `onEdit` optional on OrderActions + createOrderColumns; Edit hidden when absent
- AC4: My Activity passes `undefined` onEdit; View/Cancel/invoice mutations still invalidate
- AC5: No invalidation registry changes; gates pass

**Artifacts:** `shell-layout-styles.ts`, `BusinessInsightPage`, `AdminMyActivityContent`, `OrderActions`, `OrderTableColumns`

---

## REQ-0168 — Admin/Business spacing + Recent Orders density

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0045, REQ-0145, REQ-0128 |

**Intent:** Fix gap-6/pb-6 consistency on Business Insights + Activity Logs; clarify empty reorder suggestions when stock healthy; My Activity Recent Orders uses Order-list columns; enrich dashboard Overall Insights Latest 5 with buyer/product/category/supplier.

**Acceptance criteria**

- AC1: BusinessInsightPage main content `flex flex-col gap-6`; stats use `PAGE_STATS_GRID_CLASS`; trim stacked `pb-6`
- AC2: Forecasting empty reorder copy when low+out stock = 0 → healthy message (no algorithm change)
- AC3: ActivityLogSection filter→table `mb-4` gap
- AC4: My Activity — iconTile SectionTitleRow; `createOrderColumns` via AdminEmbedDataTable; keep search
- AC5: DashboardRecentOrder enriched; Latest 5 denser UI; Redis `dashboard:overview:v4:`
- AC6: No invalidation registry changes; gates pass

**Artifacts:** `BusinessInsightPage`, `forecasting-card`, `ActivityLogSection`, `AdminMyActivityContent`, `dashboard-data`, `types/dashboard`, `AdminAnalyticsContent`, `cache-utils`

---

## REQ-0167 — Compact review placement + dialog contrast

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0165 |

**Intent:** Write review / edit-delete under line-item price (right); amber glass hover; dialog rating readable on always-dark shell; Cancel matches OrderDialog.

**Acceptance criteria**

- AC1: Compact reviews in price column under amount
- AC2: `GLASS_COMPACT_AMBER_BUTTON` Write review (no gray ghost hover)
- AC3: Existing review — stars/rating then edit+delete `justify-between` under price
- AC4: `dialogTextClass` on rating label; Cancel `secondary` + `GLASS_GHOST` + shell reset
- AC5: No invalidation changes; gates pass

**Artifacts:** `ProductLineItemsList`, `ProductReviewsSection`, `WriteEditReviewDialog`, `review-rating-display.ts`, `glass-button-styles.ts`

---

## REQ-0166 — Dead party class + catalog audit sky links

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R0 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0165, REQ-0089 |

**Intent:** Remove unused `PARTY_SELF_LINK_CLASS`; unify catalog Created/Updated by with Order/Invoice via `resolveDetailAuditUserHref` (sky for all roles).

**Acceptance criteria**

- AC1: `PARTY_SELF_LINK_CLASS` removed from code + tests
- AC2: Category/Supplier/Warehouse Created+Updated by use `resolveDetailAuditUserHref`
- AC3: Product Updated by uses `resolveDetailAuditUserHref` (Created stays ownerProductsHref)
- AC4: No invalidation/SSR changes; gates pass

**Artifacts:** `owner-products-href.ts`, `audit-user-href.ts`, Category/Supplier/Warehouse/Product detail pages

---

## REQ-0165 — Order/Invoice detail + review UX gaps

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0164, REQ-0089, REQ-0122 |

**Intent:** Close Order/Invoice detail screenshot gaps — sky party/audit links for all roles, left-aligned compact reviews with table rating hues, WriteEditReviewDialog parity, delete confirm, instant eligibility patch (no Write-review flash).

**Acceptance criteria**

- AC1: Parties self names use default sky link (no gray `PARTY_SELF_LINK_CLASS` override)
- AC2: Created by / Updated by sky-clickable for admin + non-admin; admin → user-management; else → `/products?ownerId=`
- AC3: Compact reviews left-aligned under product row; stars + `n/5` use shared `getRatingDisplay` hues
- AC4: WriteEditReviewDialog — DialogHeaderBrand, FormLabels+icons, Cancel+X, Submit+Star
- AC5: Delete review opens AlertDialog with product + truncated comment
- AC6: Create/delete patch eligibility before invalidate; `showWrite` hides when myReviews cover order; no flash
- AC7: Gates pass; no invalidation registry changes

**Artifacts:** `enrich-party-person.ts`, `audit-user-href.ts`, `review-rating-display.ts`, `ProductLineItemsList`, `ProductReviewsSection`, `WriteEditReviewDialog`, `use-product-reviews.ts`

---

## REQ-0164 — Compact reviews, party links, Invoice Summary icons

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0163 |

**Intent:** Compact Order Items reviews show rating + icon-only edit/delete; Parties names link to owner products for all roles (self gray); Invoice Summary icons use meaningful hues.

**Acceptance criteria**

- AC1: Compact reviews — StarRating + `n/5` + icon Pencil/Trash; Write review when eligible/paid
- AC2: `resolveOwnerProductsHref` + enrichPartyPerson; Invoice/Order Parties cards; self `PARTY_SELF_LINK_CLASS`
- AC3: InvoiceSummaryRow `iconClassName` hues (sky/violet/cyan/rose/emerald/amber)
- AC4: No invalidation changes; gates pass

**Artifacts:** `ProductReviewsSection.tsx`, `owner-products-href.ts`, `enrich-party-person.ts`, `InvoicePartiesCard`, `OrderPartiesCard`, `InvoiceSummaryCard`

---

## REQ-0163 — Invoice Order Items parity + hydration/Back

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0162 |

**Intent:** Close Invoice Detail Order Items gaps vs OrderItemsCard; fix footer Back glass washout; eliminate ProductReviewsSection compact hydration mismatch.

**Acceptance criteria**

- AC1: Invoice Items subtitle `{n} item(s) on this invoice · {date}`; related ORD # meta chip + clipboard (sky)
- AC2: Store owner + portal roles get product sky links (`linkMode` portal/admin)
- AC3: Footer Back without `variant="ghost"` (sky glass like Order Detail)
- AC4: SSR `initialReviewContext` on `/invoices/[id]` + admin; compact reviews never Loader2 without SSR eligibility
- AC5: No invalidation registry changes; gates pass

**Artifacts:** `ProductLineItemsList.tsx`, `InvoiceItemsCard.tsx`, `InvoiceDetailPage.tsx`, `ProductReviewsSection.tsx`, `app/invoices/[id]/page.tsx`, `app/admin/invoices/[id]/page.tsx`

---

## REQ-0162 — Invoice Detail ↔ Order Detail parity

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0126 |

**Intent:** Redesign Invoice Detail to match Order Detail layout, shared detail primitives, and info density (status stack|billing, items|summary, info|parties).

**Acceptance criteria**

- AC1: Top row — Invoice Status + Amount Due stacked | Billing Address (`lg:grid-cols-2`)
- AC2: Mid row — Order Items | Invoice Summary; bottom — Invoice Information | Parties (sky party links)
- AC3: Invoice Information uses DetailInfoRow*; Invoice # top row; hide empty dates; Related Order sky `font-normal` (no ExternalLink)
- AC4: Amount Due card Paid x / total semantic colors; glass Back unchanged; no invalidation/SSR API changes

**Artifacts:** `InvoiceDetailPage.tsx`, `InvoiceItemsCard.tsx`, `InvoicePartiesCard.tsx`, `InvoiceSummaryCard.tsx` (removed dead `InvoiceDetailFactsGrid`)

---

## REQ-0161 — Order/Invoice table header HelpTooltips

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0142 |

**Intent:** HelpTooltip (?) on dense Order/Invoice list headers so users understand badges, dates, and meta in each column (catalog Products pattern).

**Acceptance criteria**

- AC1: Shared tooltip copy in `order-invoice-column-tooltips.ts`
- AC2: Order table: Order #, Total, Status, Payment, Invoice #
- AC3: Invoice table: Invoice #, Order #, Status, Total
- AC4: Sibling of SortableHeader (no nested interactive); gates pass; no invalidation changes

**Artifacts:** `lib/ui/order-invoice-column-tooltips.ts`, `OrderTableColumns.tsx`, `InvoiceTableColumns.tsx`

---

## REQ-0160 — User overview copy + My Activity tip

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0159 |

**Intent:** Role-aware Overview blurb on user-management detail; My Activity sky tip for own store-owner account. Numbers unchanged.

**Acceptance criteria**

- AC1: `getUserOverviewDescription` by role (no userId/clientId jargon)
- AC2: My Activity tip when `isOwner` + admin/user; homepage sky link pattern
- AC3: No KPI/SSR/invalidation changes; gates pass

**Artifacts:** `lib/ui/user-overview-copy.ts`, `AdminUserManagementDetailContent.tsx`

---

## REQ-0159 — Buyer display + invoice list parity

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0158 |

**Intent:** Display buyer (`clientId`) on Client-badge rows and invoice Ordered by; Self-only admin `/invoices` parity with `/orders`; clear Store · labels on client lists.

**Acceptance criteria**

- AC1: `resolveBuyerDisplayFromUsers` + `formatStoreOwnerLabel`; placedBy/customerDisplay/orderedBy use buyer
- AC2: Admin merge `_displayName` = buyer for Client rows
- AC3: Admin `/invoices` Self-only (SSR + TanStack + warm); store KPIs unchanged
- AC4: Client tables show `Store · {owner}`; seed shipping name = buyer
- AC5: Client Portal Revenue = order totals only; gates pass

**Artifacts:** `lib/orders/order-party.ts`, `orders-data.ts`, `invoices-data.ts`, `invoice-detail-data.ts`, `app/invoices/page.tsx`

---

## REQ-0158 — Order/invoice party semantics (Self vs Client)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Lock `userId`=store owner, `clientId`=buyer (null=self); fix admin Client Portal; seed Self+Client matrix.

**Acceptance criteria**

- AC1: `order-party` helpers + create/list Self-only paths
- AC2: Admin Client Portal filters `clientId`; Redis `overview:v2`
- AC3: Self/Others KPIs + admin merge badges use `isSelfOrder`
- AC4: User overview role-aware counts/revenue/spent
- AC5: Seed ORD/INV-DEMO-001…004; gates pass

**Artifacts:** `lib/orders/order-party.ts`, `client-portal-data.ts`, seed matrix

---

## REQ-0157 — Badge DRY + portal helper + test tsc hygiene

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0156 |

**Intent:** DRY remaining portal invoice KPIs; portal order badge helper (keep portal semantics); fix pre-existing test tsc noise.

**Acceptance criteria**

- AC1: Client InvoiceList + supplier OrderList invoice count badges use `buildStoreInvoiceStatusBadges`
- AC2: `buildPortalOrderStatusBadges` + Total Orders on client/supplier portals + OrderList
- AC3: `npx tsc --noEmit` clean (test fixtures only)
- AC4: No invalidation/Redis/SSR changes; gates pass

**Artifacts:** `lib/ui/portal-order-status-badges.ts`

---

## REQ-0156 — My Activity + invoice badge set parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0155 |

**Intent:** My Activity Total Orders/Invoices match store badge sets; DRY store invoice KPIs via shared helper; Client Due card Refunded.

**Acceptance criteria**

- AC1: `buildStoreInvoiceStatusBadges` + tests
- AC2: My Activity uses order + invoice helpers (Confirmed/Refund/Cancel; Cancelled/Refunded)
- AC3: Store invoice KPI cards DRY onto helper
- AC4: Client portal Due + Refunded badge
- AC5: No invalidation changes; gates pass

**Artifacts:** `lib/ui/store-invoice-status-badges.ts`, `AdminMyActivityContent.tsx`

---

## REQ-0155 — Delivered + Due badge parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0154, REQ-0136 |

**Intent:** Store Total Orders KPIs show Delivered (keep Shipping separate); align AOV/Outstanding money labels to Due; Shipping label parity on portals/My Activity.

**Acceptance criteria**

- AC1: `buildStoreOrderStatusBadges` — Pending→Confirmed→Shipping→Delivered→Refund→Cancel (+ Self/Others)
- AC2: Wired on StatisticsSection, AdminAnalytics overview, OrderList, InvoiceList
- AC3: AOV/Outstanding → Due; My Activity AOV uses `outstandingAmount`; Client portal card title Due
- AC4: Shipped→Shipping on My Activity + client/supplier portal/list KPI cards
- AC5: No invalidation/SSR/money-model changes; gates pass

**Artifacts:** `lib/ui/store-order-status-badges.ts`

---

## REQ-0154 — Partial pay stats + Total column typography

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0152, REQ-0136 |

**Intent:** Fix dashboard/list KPI badges for mid-pay invoices (Paid/Partial/Due/Pending money + invoice Partial count) across admin/user/client/supplier; shrink `PaymentMoneyBreakdown` table Total typography to match column meta.

**Acceptance criteria**

- AC1: `buildPaymentMoneyStats` pure helper + unit tests (demo partial fixture)
- AC2: Admin/client/supplier dashboards use invoice-money partition; types expose `partialOrderAmount` / `partialCount` / `pendingCount`
- AC3: Partial badge on StatisticsSection, AdminAnalytics, Order/Invoice lists, portals
- AC4: `PaymentMoneyBreakdown` table variant `text-xs font-normal` gray base
- AC5: Redis dashboard key bump `v3`; invalidation registry unchanged
- AC6: Gates — lint, test, invalidate, build

**Artifacts:** `lib/insights/payment-money-stats.ts`, `lib/server/dashboard-data.ts`, `lib/server/client-dashboard.ts`, `lib/server/supplier-dashboard.ts`, `PaymentMoneyBreakdown.tsx`

---

## REQ-0153 — Instant linked-order patch on invoice money CRUD

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0152 |

**Intent:** Close client-cache lag after invoice money mutate — instantly patch linked order `paymentStatus` + `invoiceForOrder` and invoice `linkedOrderPaymentStatus` before invalidate refetch.

**Acceptance criteria**

- AC1: `patchLinkedOrderFromInvoiceMoney` in patch-mutation-cache + unit tests
- AC2: Wired in useUpdateInvoice (onMutate/onSuccess/onError), useCreateInvoice, useSendInvoice
- AC3: Optimistic merge recomputes `amountDue` when money fields change
- AC4: Invalidation registry unchanged (still `invalidateAfterOrderGraphChange` after patch)
- AC5: Gates — lint, test, invalidate, build

**Artifacts:** `lib/react-query/patch-mutation-cache.ts`, `hooks/queries/use-invoices.ts`

---

## REQ-0152 — Partial payment sync + Invoice Total + Pay toggle

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0151, REQ-0136 |

**Intent:** Auto-sync order `paymentStatus` (unpaid/partial/paid) from invoice money on edit + Stripe; Invoice Total paid/due breakdown; PaymentDialog full/partial toggle with Zod + checkout amount; admin can checkout; no unpaid clobber.

**Acceptance criteria**

- AC1: `deriveOrderPaymentStatus` + `syncOrderPaymentStatusFromInvoice` on invoice PUT; unit tests
- AC2: Stripe checkout optional `amount`; webhook incremental `amountPaid`; admin `canCheckout`
- AC3: PaymentDialog pay-full default / partial editable + live validation
- AC4: `PaymentMoneyBreakdown` on Invoice Total; Order Total when paid>0; `invoiceForOrder.amountPaid`
- AC5: Admin order detail due + partial parity; invoice line items use linked order payment
- AC6: Gates — lint, test, invalidate, build; invalidation registry unchanged (`invalidateAfterOrderGraphChange`)

**Artifacts:** `lib/payments/order-payment-from-amounts.ts`, `app/api/payments/checkout/route.ts`, `app/api/payments/webhook/route.ts`, `PaymentDialog.tsx`, `PaymentMoneyBreakdown.tsx`, `InvoiceTableColumns.tsx`, `OrderTableColumns.tsx`

---

## REQ-0151 — Edit Invoice submit + Order # badges + due Clock

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0150, REQ-0136 |

**Intent:** Fix silent Edit Invoice Zod fail on date-only timestamps; toast on invalid; Invoice Order # shows order status/payment badges + dates; due/overdue SemanticEventDate uses Clock.

**Acceptance criteria**

- AC1: `updateInvoiceSchema` accepts `YYYY-MM-DD` for sentAt/paidAt/cancelledAt (+ unit test)
- AC2: Edit form `onInvalid` destructive toast
- AC3: List enrich `linkedOrderStatus` / `paymentStatus` / `statusAt` / `paidAt`; Invoice Order # inline badges
- AC4: `SemanticEventDate` due/overdue → Clock icon
- AC5: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `lib/validations/invoice.ts`, `InvoiceDialog.tsx`, `enrich-invoice-list-orders.ts`, `InvoiceTableColumns.tsx`, `SemanticEventDate.tsx`

---

## REQ-0150 — Invoice table density + Edit Invoice fixes

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0145 |

**Intent:** Dense Invoice table (admin/user/client/supplier) matching Order table; fix Edit Cancel submit cancel; readable status Select; list enrich linked order + statusAt.

**Acceptance criteria**

- AC1: Edit Cancel `type="button"` (InvoiceDialog + OrderDialog) — no "form not connected"
- AC2: Status Select — solid white-on-hue trigger; opaque badges in items
- AC3: List SSR/API enrich `linkedOrderNumber` / items / `linkedOrderCreatedAt` / `statusAt`; Redis `invoices:list:v2:`
- AC4: Columns — Invoice # (`OrderTableInvoiceCell`) · Order # · Status+statusAt · Total · Actions; drop standalone Due/Amount Due
- AC5: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `InvoiceDialog.tsx`, `InvoiceTableColumns.tsx`, `enrich-invoice-list-orders.ts`, `invoice-status-display-date.ts`, `invoices-data.ts`, `cache-utils.ts`

---

## REQ-0149 — Line price typography + Owner/Buyer label size

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0148, REQ-0136 |

**Intent:** Unify proportional line totals (`text-sm sm:text-base`) and strikethrough list prices (`text-xs sm:text-sm`) via `ProportionalPriceDisplay`; match Owner/Buyer name size to label (`text-xs`) on catalog recent-order / product grid rows.

**Acceptance criteria**

- AC1: `ProportionalPriceDisplay` final amount `text-sm sm:text-base`; strike `text-xs sm:text-sm` (Order Items, Recent Orders, create dialog)
- AC2: Catalog recent orders + product grid `AvatarInlineLink` names use `linkClassName="text-xs"` (parity with Owner:/Buyer: labels)
- AC3: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `ProportionalPriceDisplay.tsx`, `CatalogDetailRecentOrdersList.tsx`, `CatalogDetailProductGrid.tsx`

---

## REQ-0148 — Summary Total, line meta separators, light header Back

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0147, REQ-0136 |

**Intent:** Shrink Order/Invoice Summary Total typography; add · separators + invoice CopyableText chip on line-item meta; replace heavy slate header Back with light gray glass for all detail pages.

**Acceptance criteria**

- AC1: Order + Invoice Summary Total use `text-sm sm:text-base` (not `sm:text-lg`); emerald row retained
- AC2: `ProductLineItemsList` meta segments joined with ·; Invoice chip (`FileText` + `CopyableText` + sky Link) when `order.invoiceForOrder` present
- AC3: `DETAIL_HEADER_BACK_ICON_CLASS` light border + gray-100/200 wash; Order header uses `variant="ghost"` + token (parity with Product; default Button was red)
- AC4: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `OrderSummaryCard.tsx`, `InvoiceSummaryCard.tsx`, `ProductLineItemsList.tsx`, `OrderItemsCard.tsx`, `glass-button-styles.ts`, `OrderDetailHeader.tsx`

---

## REQ-0147 — Order detail layout + carrier badge gap closure

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0146, REQ-0136 |

**Intent:** Fix red UPS shadcn Badge conflict; Items|Summary 2-col; Info|(Parties+addresses) stack; invoice row in Order Information; Parties sky admin links; line-item text-sm/xs; remove related-entity strip; slate glass header Back.

**Acceptance criteria**

- AC1: Carrier chips use `CarrierGlassBadge` span (no shadcn Badge / bg-primary)
- AC2: `lg:grid-cols-2` Order Items | Order Summary (`h-full`)
- AC3: Info left; Parties → Shipping → Billing stacked right; no `OrderRelatedEntitiesCards`
- AC4: Invoice row in Order Information when `invoiceForOrder` exists
- AC5: Parties `href` via `resolveAuditUserManagementHref` for admin
- AC6: Line name `text-sm`; Qty/SKU/catalog meta `text-xs`; slate `DETAIL_HEADER_BACK_ICON_CLASS` without ghost
- AC7: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `OrderTrackingInfo.tsx` (`CarrierGlassBadge`), `OrderDetailPage.tsx`, `AdminOrderDetailContent.tsx`, `OrderPartiesCard.tsx`, `OrderItemsCard.tsx`, `ProductLineItemsList.tsx`, `glass-button-styles.ts`

---

## REQ-0146 — Order detail density + pricing + typography parity

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136 |

**Intent:** Denser order detail layout (equal-height status/tracking, 2-col addresses/summary, related entity cards), fix proportional strikethrough for upcharges, typography parity with product detail (Qty:, font-normal, gray-600/700), solid Back, UPS glass glow, admin `trackingCarrier` persistence.

**Acceptance criteria**

- AC1: With tracking — `lg:grid-cols-2` status stack + `OrderTrackingInfo` equal height; carrier glass glow badge
- AC2: Order Information Created/Updated same row; Shipping|Billing 2-col; compact related product/category/supplier/warehouse cards
- AC3: Line items `Qty:`; names `font-normal`; Parties labels/names font-normal sky
- AC4: Dual-price strike only when `listAmount > adjustedAmount`; upcharge shows single amount
- AC5: Footer Back solid sky glass (no `variant="ghost"`); product warehouse + recent-order meta `text-xs` / font-normal
- AC6: Admin manual tracking persists `trackingCarrier` (schema + prisma + API)
- AC7: Gates — lint, test, invalidate, build; TanStack invalidation unchanged

**Artifacts:** `OrderDetailPage.tsx`, `AdminOrderDetailContent.tsx`, `OrderTrackingInfo.tsx`, `OrderRelatedEntitiesCards.tsx`, `ProductLineItemsList.tsx`, `ProportionalPriceDisplay.tsx`, `updateOrderSchema` / `prisma/order.ts`

---

## REQ-0145 — Orders table Status, Order # meta, Invoice # column

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0061, REQ-0129 |

**Intent:** Order list UX — Status start-aligned with text-xs statusAt; Order # meta icons + truncated product names; Invoice # column (before Actions) with created/amount due/due date/status from widened `invoiceForOrder`.

**Acceptance criteria**

- AC1: `RecentOrderStatusColumn` `align="start"` on order table — badge + date left-aligned at all breakpoints; Calendar `h-3 w-3` + `text-xs`
- AC2: Order # meta — Package/Boxes/Calendar icons; clickable product links (`getOrderProductPreviewLinks`)
- AC3: Invoice # — 2-line nowrap; secondary event paid/cancelled/refunded/due/sent via `resolveInvoiceSecondaryEvent`
- AC4: Status/Payment use `SemanticEventDate`; `getInvoiceLinkMap` + sentAt/cancelledAt; Redis `orders:list:v3:`
- AC5: Gates — lint, test, invalidate, build; TanStack invalidation unchanged

**Artifacts:** `OrderTableColumns.tsx`, `OrderTableInvoiceCell.tsx`, `SemanticEventDate.tsx`, `invoice-event-date.ts`, `order-list-meta.ts`, `orders-data.ts`

---

## REQ-0144 — Products hydration + ThemeProvider script noise

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0004, REQ-0019 |

**Intent:** Fix `/products` hydration mismatch on Stock sort header (SSR `QR & Stock` vs client `Stock` from HTML-entity string props) and silence next-themes React 19 script-tag console noise; use a valid OpenRouter model for forecasting AI.

**Acceptance criteria**

- AC1: `ProductTableColumns` SortableHeader labels use plain strings (`Product & SKU`, `QR & Stock`) — no `&amp;` in props
- AC2: New-tab / hard reload `/products` — no hydration mismatch on QR & Stock header
- AC3: `ThemeProvider` filters React 19 "Encountered a script tag" false positive in development only
- AC4: Forecasting AI uses `openai/gpt-4o-mini` (valid OpenRouter id)
- AC5: Gates — lint, test, invalidate, build; no TanStack/invalidation changes

**Artifacts:** `ProductTableColumns.tsx`, `ThemeProvider.tsx`, `app/api/forecasting/route.ts`, `lib/ai/groq.ts`

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

**Remediations (2026-07-22):** Order stock Max N → warn+disable; warehouse detail cold-load pulse; dev `tracesSampleRate` 0; notification DELETE missing → 404+warn (no Sentry).

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

**Intent:** Finish deferred glass CTA sweep on detail pages, FABs, ShippingManagement, WriteEditReview cancel. Supersedes planned backlog entry; completed in REQ-0064 sweep.

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

## REQ-0105 — product detail committedQuantity SSR

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0104 |

**Intent:** Close product detail SSR/API gap — expose `committedQuantity` on `getProductDetailForPage` (same parity as category/supplier detail lists) and track `CLAUDE.md` in git for agent docs.

**Acceptance criteria**

- AC1: `enrichProductDetailWithCommittedQuantity` in `enrich-product-committed-quantity.ts`
- AC2: `product-detail-data.ts` enriches after transform; Redis cache guard requires `committedQuantity`
- AC3: `GET /api/products/:id` returns enriched shape via shared helper
- AC4: Remove `CLAUDE.md` from `.gitignore`; REQ-0103/0104/0105 sections in tracked `CLAUDE.md`
- AC5: Unit tests + gates (lint, test 464, invalidate 208, build)
- AC6: `ProductDetailPage` — `getDisplayCommittedQuantity` primary path; warehouse fallback when TanStack lags stock hook

**Artifacts:** `lib/products/enrich-product-committed-quantity.ts`, `lib/server/product-detail-data.ts`, `components/Pages/ProductDetailPage.tsx`, `.gitignore`, `CLAUDE.md`

---

## REQ-0106 — order dialog auto-assign stock UX

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0103 |

**Intent:** Client-facing order dialog uses catalog committed available by default; warehouse pick optional (auto-assign). Manual pick caps per-warehouse. Fixes conflicting UI validators.

**Acceptance criteria**

- AC1: `lib/orders/order-line-stock-validation.ts` — shared `validateOrderLineStock` + tests
- AC2: `createOrder` allows `needsPick && !warehouseId` — auto reserve on product path; catalog cap unchanged
- AC3: `OrderDialog` + `OrderLineWarehouseSelect` — auto-assign default; optional manual warehouse; submit disabled uses committed available
- AC4: All roles: "Auto-assign warehouses" first option; admin helper for optional override
- AC5: No invalidation registry changes; gates pass
- AC6: `MANUAL_TEST_FIXTURES.md` §9 Beats auto-order 40 path

**Artifacts:** `lib/orders/order-line-stock-validation.ts`, `prisma/order.ts`, `components/orders/OrderDialog.tsx`, `components/orders/OrderLineWarehouseSelect.tsx`

---

## REQ-0107 — product detail allocation summary

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0102 |

**Intent:** Product detail Warehouse Stock card shows full `Catalog · allocated · unallocated · reserved` summary; catalog available badge.

**Acceptance criteria**

- AC1: `formatCatalogAllocationDetailSummary` in `catalog-allocation-copy.ts`
- AC2: `ProductDetailPage` subtitle + catalog available badge in Warehouse Stock card
- AC3: Derives from `useProduct` + `useStockByProduct`; no new SSR fields
- AC4: Gates pass

**Artifacts:** `lib/stock-allocation/catalog-allocation-copy.ts`, `components/Pages/ProductDetailPage.tsx`

---

## REQ-0108 — live dialog stock validation

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0102 |

**Intent:** Product edit and allocate dialogs show reserved-floor errors live; submit disabled when invalid.

**Acceptance criteria**

- AC1: `useCatalogQuantityReconcilePreview` hook — live `planCatalogQuantityReconcile`
- AC2: `ProductFormDialog` — inline blocked/shrink preview; submit gated on `plan.ok`
- AC3: `StockQuantityField` + `AllocateStockDialog` — `minReserved` in edit mode; no false success message
- AC4: Unit tests + gates pass

**Artifacts:** `hooks/use-catalog-quantity-reconcile-preview.ts`, `components/products/ProductFormDialog.tsx`, `components/shared/StockQuantityField.tsx`, `components/warehouses/AllocateStockDialog.tsx`

---

## REQ-0109 — dialog feedback layout tokens

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0046 |

**Intent:** Shared CSS tokens for dialog hint/error/success rows; fix cramped helper alignment.

**Acceptance criteria**

- AC1: `DIALOG_FORM_FEEDBACK_*` tokens in `dialog-edge-scroll.ts`; export from shared barrel
- AC2: Apply to ProductForm, Order, OrderLineWarehouseSelect, Allocate, StockQuantityField
- AC3: Gates pass

**Artifacts:** `components/shared/dialog-edge-scroll.ts`, dialog components listed in AC2

---

## REQ-0110 — stock UX gap closure

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0106 |

**Intent:** Close REQ-0106–0109 minor gaps: committedQuantity order cap fallback, stock prefetch, warehouse name errors, allocation bounds DRY, reserve tests, dialog shell parity.

**Acceptance criteria**

- AC1: `getOrderLineCatalogAvailableFromProduct` + `resolveOrderLineHasAllocations` + committedQuantity tests
- AC2: `prefetchStockByProduct` on OrderDialog product select
- AC3: Manual-pick error uses warehouse name
- AC4: `getAllocationQtyBounds` DRY in validate-allocation-quantity + AllocateStockDialog
- AC5: `order-stock-reservation` auto-assign reserve path test
- AC6: ProductForm `DIALOG_EDGE_SCROLL` shell; Allocate feedback wrapper
- AC7: Gates pass

**Artifacts:** `order-line-stock-validation.ts`, `use-stock-allocation.ts`, `OrderDialog.tsx`, `validate-allocation-quantity.ts`, `ProductFormDialog.tsx`, `AllocateStockDialog.tsx`

---

## REQ-0111 — order stock workflow consistency

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0110 |

**Intent:** Reactive order-line validation (cache-aware hook), DRY manual-pick errors, server/client message parity, submit-time ensureQueryData.

**Acceptance criteria**

- AC1: `mapStockAllocationsToOrderLineRows` + `validateOrderLineStockForItem` + `ensureStockAllocationsAndValidate`
- AC2: `useOrderLineStockValidation` hook; `OrderDialogCreateLineItem` child
- AC3: `OrderLineWarehouseSelect` uses `manualPickError` from parent (no local overCap)
- AC4: `validateWarehousePick` throws `Max {n} at {name}`; prisma uses `getOrderLineCatalogAvailable`
- AC5: Gates pass

**Artifacts:** `order-line-stock-validation.ts`, `use-order-line-stock-validation.ts`, `OrderDialog.tsx`, `OrderDialogCreateLineItem.tsx`, `OrderLineWarehouseSelect.tsx`, `stock-allocation-order-sync.ts`, `prisma/order.ts`

---

## REQ-0112 — order line fetch DRY + stock error state

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0111 |

**Intent:** Single `useStockByProduct` per order line; stable `lineStockErrors` keyed by `field.id`.

**Acceptance criteria**

- AC1: `buildOrderLineWarehousePickOptions` + tests
- AC2: Hook returns `allocationRows`; warehouse select accepts injected rows
- AC3: `lineStockErrors` prune on remove + reset on dialog close
- AC4: Gates pass

**Artifacts:** `order-line-stock-validation.ts`, `use-order-line-stock-validation.ts`, `OrderLineWarehouseSelect.tsx`, `OrderDialogCreateLineItem.tsx`, `OrderDialog.tsx`

---

## REQ-0113 — warehouse select fetch removal

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0112 |

**Intent:** Remove dead `useStockByProduct` fallback from `OrderLineWarehouseSelect`; require parent-injected rows; merge `OrderFormData` types.

**Acceptance criteria**

- AC1: `OrderLineWarehouseSelect` props-only (no internal fetch)
- AC2: `OrderFormData` inlined in `OrderDialogCreateLineItem.tsx`; `.types.ts` deleted
- AC3: Gates pass

**Artifacts:** `OrderLineWarehouseSelect.tsx`, `OrderDialogCreateLineItem.tsx`, `OrderDialog.tsx`

---

## REQ-0114 — Stock UX clarity + dialog/detail UI parity

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0103, REQ-0110–0113 |

**Intent:** Fix stock/catalog display gaps, pricing display bugs, warehouse summary inconsistency, and dialog/detail UI issues from screenshots—shared tokens/components, SSR-safe patterns, existing invalidation only.

**Acceptance criteria**

- AC1: `formatCatalogCommitWarehouseHint` + `committedQuantity` on allocation enrich; warehouse/product rows show catalog-commit hint when `committedQuantity > allocation.reservedQuantity`
- AC2: `WarehouseDetailPage` stat cards use single `computeWarehouseInsights` source (SSR fallback when TanStack `[]`)
- AC3: `computeProportionalLineAmount` + `ProductLineItemsList` strikethrough subtotal when order has fee adjustments; inventory value label renamed
- AC4: `DialogFormLabel` + `TABLE_CATALOG_LINK_CLASS`; Product/Order line dialog layout fixes; dialog sweep footers/icons
- AC5: `DetailInfoRow` font-normal + `DetailInfoRowGroup` on catalog detail pages
- AC6: Unit tests + gates pass

**Artifacts:** `catalog-allocation-copy.ts`, `stock-allocation-enrich.ts`, `proportional-line-amount.ts`, `ProductLineItemsList.tsx`, `WarehouseDetailPage.tsx`, `dialog-form-label.tsx`, `DetailInfoRowGroup.tsx`, `ProductFormDialog.tsx`, `OrderDialogCreateLineItem.tsx`, table columns

---

## REQ-0115 — REQ-0114 dialog gap closure + warehouse summary test

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0114 |

**Intent:** Close REQ-0114 deferred UI gaps: remaining dialog `DialogFormLabel`/footer sweep, minor label parity, DRY `mapWarehouseStockSummary` + unit test. CSS/UI only — no invalidation changes.

**Acceptance criteria**

- AC1: `mapWarehouseStockSummary` in `warehouse-insights-compute.ts` + test; `WarehouseDetailPage` consumer
- AC2: `DialogFormLabel` + footer icons on Invoice/Order/SupportTicket dialogs; PaymentDialog submit icon
- AC3: ImageField + Category/Supplier description/notes + CategoryDialog create name label
- AC4: Gates pass; dead imports removed

**Artifacts:** `warehouse-insights-compute.ts`, `InvoiceDialog.tsx`, `OrderDialog.tsx`, `SupportTicketDialog.tsx`, `PaymentDialog.tsx`, `ImageField.tsx`, `CategoryDialog.tsx`, `SupplierDialog.tsx`

---

## REQ-0116 — Dialog parity + proportional price DRY + detail typography

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0114, REQ-0115 |

**Intent:** Close final deferred dialog gaps (supplier create name, order notes, payment cancel, warehouse status label); DRY `ProportionalPriceDisplay` for fee-adjusted line amounts; detail data values `font-normal` + semantic hues. CSS/UI only — no invalidation changes.

**Acceptance criteria**

- AC1: Supplier create `DialogFormLabel`; Order create/edit notes `DialogFormLabel`; PaymentDialog Cancel footer; WarehouseDialog status `DialogFormLabel`
- AC2: `ProportionalPriceDisplay` + test; refactor `ProductLineItemsList`, `CatalogDetailRecentOrdersList`, `ProductDetailPage`; order-create live preview in `OrderDialogCreateLineItem`
- AC3: `DETAIL_DATA_VALUE_CLASS` + `detailStatValueToneClass`; `OrderSummaryCard`, `WarehouseDetailPage` stats, `InvoiceDetailPage` amount due, admin refund amount → `font-normal`
- AC4: Gates pass; dead imports removed

**Artifacts:** `ProportionalPriceDisplay.tsx`, `SupplierDialog.tsx`, `OrderDialog.tsx`, `PaymentDialog.tsx`, `WarehouseDialog.tsx`, `OrderDialogCreateLineItem.tsx`, `typography-scale.ts`, `OrderSummaryCard.tsx`

---

## REQ-0117 — Dialog UX parity + admin embed tables + network audit

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 UI; R2 admin table refactor |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0114–0116 |

**Intent:** Fix dialog label/layout regressions (icon+label two-line bug), dropdown readability, order-create empty totals, invoice picker width, dialog headers, support/review parity, and admin portal embed table consistency. Phase 4 read-only admin network audit — no invalidation changes.

**Acceptance criteria**

- AC1: `DialogFormLabel` flex-safe (`DIALOG_FORM_LABEL_ROW`); `DIALOG_TABLE_SECTION_TITLE` white; `DIALOG_SELECT_*` tokens
- AC2: `DialogDateField` + `DialogHeaderBrand`; Category/Supplier/Product/Order/Invoice/Warehouse/Support/Review dialog sweep
- AC3: Order create totals empty state + row icons; `OrderPickerCommand` full trigger width
- AC4: `AdminEmbedDataTable` — Client/Supplier portal + My Activity Recent Orders parity
- AC5: VS-045 network audit documented; defer prefetch reduction unless duplicate proven
- AC6: Gates pass; exports in `components/shared/index.ts`

**Artifacts:** `dialog-form-label.tsx`, `DialogDateField.tsx`, `DialogHeaderBrand.tsx`, `AdminEmbedDataTable.tsx`, `OrderDialog.tsx`, `InvoiceDialog.tsx`, `OrderPickerCommand.tsx`, portal embed tables

---

## REQ-0118 — Readable popover full sweep + REQ-0117 gap closure

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 CSS-only (~22 files) |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0117 |

**Intent:** Close REQ-0117 deferred gaps (PaymentDialog header, warehouse/line pickers, dead imports) and DRY readable popover tokens across all remaining `bg-white/80` Select/Command surfaces including list filters and pagination. No invalidation/SSR/API changes.

**Acceptance criteria**

- AC1: `lib/ui/popover-readability-styles.ts` — `READABLE_POPOVER_*`, `filterCommandPopoverClass`, `paginationPopoverContentClass`
- AC2: PaymentDialog `DialogHeaderBrand`; OrderDialogCreateLineItem; Allocate/Transfer; CreateUser; Shipping; LoginRoleSelect
- AC3: Full filter Command sweep (15) + ProductOwnerSelect + pagination-select-styles + `FilterCommandCheckboxItem`
- AC4: Dead `DialogHeader`/`DialogTitle` imports removed from migrated dialogs; README accidental trim reverted
- AC5: VS-046 confirms VS-045 prod network verdict (OK — defer prefetch trim unless HAR duplicate)
- AC6: Gates pass

**Artifacts:** `popover-readability-styles.ts`, `PaymentDialog.tsx`, filter `*Filter.tsx` files, `pagination-select-styles.ts`, `filter-command-item.tsx`

---

## REQ-0119 — Catalog popover parity + order address labels + warehouse rollup

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 CSS (~3 files); R2 business-insights tab (~5 files) |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0117, REQ-0118 |

**Intent:** Close REQ-0117/0118 deferred gaps: catalog export/status popover readability, OrderDialog address sub-label tokens, Business Insights warehouse rollup tab with SSR prefetch. No invalidation/Redis/API write changes.

**Acceptance criteria**

- AC1: `catalog-filter-tokens.ts` uses `popover-readability-styles` helpers; zero `bg-white/80` blur in `lib/ui` + `components`
- AC2: `DIALOG_FORM_SUB_LABEL` + `OrderAddressFields` on OrderDialog create address grid
- AC3: `business-insights-warehouse-rollup.ts` + test; `BusinessInsightsWarehouseSection`; SSR `getWarehouseStockSummary` in `app/business-insights/page.tsx`
- AC4: `useWarehouseStockSummary` + `useSyncSsrQueryData` on BusinessInsightPage; Warehouses sidebar tab; AI summary includes warehouse rollup
- AC5: Gates pass

**Artifacts:** `popover-readability-styles.ts`, `catalog-filter-tokens.ts`, `OrderAddressFields.tsx`, `business-insights-warehouse-rollup.ts`, `BusinessInsightsWarehouseSection.tsx`, `BusinessInsightPage.tsx`, `app/business-insights/page.tsx`

---

## REQ-0120 — Nav invalidation + SSR sync gap closure

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0117 AC4, REQ-0069, REQ-0057 |

**Intent:** Close audit gaps for instant UI refresh on back nav, post-delete navigation, Business Insights SSR→TanStack sync, Admin My Activity embed table parity, and dead-code cleanup. No invalidation registry or API changes.

**Acceptance criteria**

- AC1: `BusinessInsightPage` — `useSyncSsrQueryDataMany` for products, orders, warehouse summary list keys
- AC2: `AdminMyActivityContent` Recent Orders → `AdminEmbedDataTable` + column defs (REQ-0117 AC4)
- AC3: `OrderLineWarehouseSelect` — remove unused `catalogAvailable` / `hasAllocations` props
- AC4: Dead imports removed from `OrderDialog.tsx`, `LoginRoleSelect.tsx`
- AC5: `useBackWithRefresh("history")` on `AdminHistoryDetailContent`; `support-ticket` on `SupportTicketDetailContent`
- AC6: Post-delete `navigateTo` on product/category/supplier/warehouse detail pages
- AC7: Duplicate REQ-0051 backlog entry removed from REQUIREMENTS.md
- AC8: Gates pass

**Artifacts:** `BusinessInsightPage.tsx`, `AdminMyActivityContent.tsx`, `OrderLineWarehouseSelect.tsx`, `OrderDialogCreateLineItem.tsx`, `OrderDialog.tsx`, `LoginRoleSelect.tsx`, `use-back-with-refresh.ts`, `AdminHistoryDetailContent.tsx`, `SupportTicketDetailContent.tsx`, `ProductDetailPage.tsx`, `CategoryDetailPage.tsx`, `SupplierDetailPage.tsx`, `WarehouseDetailPage.tsx`

---

## REQ-0121 — UI/data-sync bug sweep (FAB, dialogs, order fees, catalog copy)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0120 (nav/SSR sync), REQ-0114–0119 (dialog UX), REQ-0102 (allocation copy) |

**Intent:** Close a 13-item manual-QA bug list surfaced by live reproduction of a product qty edit (50→20, 20 reserved) plus a set of dialog/table UX defects. P0 (cross-page stale product qty) was investigated via live browser repro across same-page, cross-page nav, and browser-back paths at HEAD `9d7ec21`/`efb2e88` — all showed correct fresh data, confirming REQ-0120 already closed that gap; one related latent bug was found and fixed in `WarehouseDetailPage.tsx` (stale-fallback ternary that would re-show frozen SSR data whenever a live query resolved to an empty array). P1–P12 are independently-verified UI defects with concrete fixes.

**Acceptance criteria**

- AC1 (P0): `WarehouseDetailPage.tsx` `allocationRows` — replace `stockAllocations && stockAllocations.length > 0 ? stockAllocations : initialStockAllocations` with `stockAllocations ?? initialStockAllocations ?? []` so a live empty-array result is never masked by a stale SSR snapshot
- AC2 (P1): `ProductFormDialog.tsx` gains optional `onOpenChange`; `FloatingActionButtons.tsx` wires it through for `home`/`products` variants so the FAB collapses on dialog close like the other five FAB dialogs
- AC3 (P2): `DialogDateField.tsx` + `ExpirationDateField.tsx` — `[color-scheme:dark]` on the date input so the native `dd.mm.yyyy` placeholder and picker render legibly against the dark dialog chrome
- AC4 (P3): `ProductFormDialog.tsx` supplier `SelectItem` — `AvatarInlineLink` `linkClassName` changed from hardcoded `text-white/90` to `text-popover-foreground` (matches Category item pattern; trigger-side rendering unchanged since its background stays dark)
- AC5 (P4): `OrderLineWarehouseSelect.tsx` — `rounded-md` added to the three plain-`div` placeholder/loading states so they match the `SelectTrigger`'s built-in rounding
- AC6 (P5): `lib/ui/popover-readability-styles.ts` — `filterCommandPopoverClass` and `paginationPopoverContentClass` (and its `catalogEntityPopoverContentClass`/`exportMenuPopoverContentClass` composites) changed `rounded-[28px]` → `rounded-md`; propagates to all ~25 Command-popover consumers
- AC7 (P6): `OrderDialogCreateLineItem.tsx` line preview shows plain `listAmount` only (dead `showFeeAdjusted`/`proportionalLineAmount`/`orderSubtotal`/`orderTotal` props removed from the component and its `OrderDialog.tsx` call site)
- AC8 (P7): `OrderDialog.tsx` `getOrderFeesFromSubtotal` — shipping is `$0` on the 10% (`< $100`) discount tier so `total <= subtotal` holds on small orders; single source of truth (no server-side duplicate to sync)
- AC9 (P8): `OrderPickerCommand.tsx` rows show status badge, buyer (`AvatarInlineLink`, gated by `showPlacer`), order date, item/qty counts, and product names; `InvoiceDialog.tsx` selected-order summary expands to status/payment badges, buyer, date, and a line-item list
- AC10 (P9): `OrderTableColumns.tsx` Order # cell gains a muted status+item/qty/date line; `InvoiceTableColumns.tsx` Invoice # cell gains a muted status+linked-order#+due-date line (previously absent — order linkage wasn't shown anywhere in the table)
- AC11 (P10): `ProductFormDialog.tsx` — `ExpirationDateField` and `ImageField` reordered to sit adjacent in the 2-col grid; the conditional reconcile-hint block (`DIALOG_FORM_FEEDBACK_ROW`, already `col-span-full`) moved after both so it never lands between them
- AC12 (P11): `WarehouseDetailPage.tsx` Allocations `DetailInfoRow` — capitalized, per-metric colored spans (Products slate, Total sky, Available emerald, Reserved amber); `WarehouseStockAllocationRow.tsx` — SKU moved off the product-name title row into the meta row, catalog/allocated/unallocated/committed summary and commit hint moved from the meta row into the right-side qty card with the same colored-badge treatment (no more duplicate catalog string between the warehouse-info card and the stock row)
- AC13 (P12): `ProductDetailPage.tsx` — Warehouse Stock header catalog subtitle only shown when there's ≤1 warehouse row (avoids a misleading global summary above multiple per-warehouse rows); Inventory Value row changed from a stacked `flex-col` block to an inline `flex-wrap items-baseline` span so label/value/caption stay on one row like sibling `DetailInfoRow`s
- AC14: Gates pass — lint, test (504), invalidate (208), build

**Artifacts:** `components/Pages/WarehouseDetailPage.tsx`, `components/products/ProductFormDialog.tsx`, `components/shared/FloatingActionButtons.tsx`, `components/shared/DialogDateField.tsx`, `components/products/form-fields/ExpirationDateField.tsx`, `components/orders/OrderLineWarehouseSelect.tsx`, `lib/ui/popover-readability-styles.ts`, `components/orders/OrderDialogCreateLineItem.tsx`, `components/orders/OrderDialog.tsx`, `components/invoices/OrderPickerCommand.tsx`, `components/invoices/InvoiceDialog.tsx`, `components/orders/OrderTableColumns.tsx`, `components/invoices/InvoiceTableColumns.tsx`, `components/warehouses/WarehouseStockAllocationRow.tsx`, `components/Pages/ProductDetailPage.tsx`

**Build note:** `SemanticBadgeProps.size` is `"compact" | "detail"`, not `"sm"` — caught by `next build` type check on the first pass (AC9/AC10 badges), fixed before final gate run.

---

## REQ-0122 — Instant UI / no stale flash (patch + pulse)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0121 (manual QA), REQ-0021 (shell-first), REQ-0069 (SSR sync) |

**Intent:** Eliminate visible stale numbers after CRUD without blocking shell-first navigation. Patch TanStack cache on mutation success (`setQueryData` via shared helpers) before `invalidateAllRelatedQueries`; harden SSR sync to skip when client cache is fresher (`updatedAt`); pulse aggregate data slots during stale refetch (`isDataSlotUnsettled`) while patched detail/list rows show correct values immediately.

**Acceptance criteria**

- AC1: `lib/react-query/patch-mutation-cache.ts` — `patchDetailCache`, `patchListCaches`, `removeFromListCaches`, `patchStockAllocationInCaches`
- AC2: `isDataSlotRefreshing` + `isDataSlotUnsettled` in `is-data-slot-loading.ts`; cold-load `isDataSlotLoading` unchanged
- AC3: `resolveSsrSyncAction` skips apply when `cached.updatedAt >= serverData.updatedAt`
- AC4: Product/category/supplier/warehouse mutation hooks — patch detail + list before invalidate; stock allocation hooks patch product/warehouse caches
- AC5: Dashboard/portal/forecast/stock aggregate UI uses `isDataSlotUnsettled`; patched entity detail uses `isDataSlotLoading` only
- AC6: Dialog submit stays pending until `mutateAsync` completes (patch runs in `onSuccess` before close)
- AC7: Gates pass — lint, test (516), invalidate (208), build

**Artifacts:** `lib/react-query/patch-mutation-cache.ts`, `is-data-slot-loading.ts`, `ssr-sync-policy.ts`, `hooks/queries/use-products.ts`, `use-categories.ts`, `use-suppliers.ts`, `use-warehouses.ts`, `use-stock-allocation.ts`, list/detail/portal stat components

---

## REQ-0123 — Instant UI gap closure (order graph + portal browse)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0122 |

**Intent:** Close REQ-0122 audit gaps — patch order/invoice list caches, nested portal browse product caches, stock allocation delete cache removal, AdminMyActivity unsettled pulse. Dashboard KPIs remain pulse-only (server aggregates).

**Acceptance criteria**

- AC1: `patchOrderGraphListCaches`, `patchProductInPortalCaches`, `removeProductFromPortalCaches` in `patch-mutation-cache.ts`
- AC2: `use-orders.ts` / `use-invoices.ts` — patch detail + list before `invalidateAfterOrderGraphChange`
- AC3: `use-products.ts` — `patchProductInPortalCaches` on create/update; `removeProductFromPortalCaches` on hard delete
- AC4: `useDeleteStockAllocation` — scoped `{ id, productId, warehouseId }` + `removeStockAllocationFromCaches`
- AC5: `AdminMyActivityContent` — `isAnyDataSlotUnsettled` for stat cards
- AC6: Gates pass — lint, test (518), invalidate (208), build

**Artifacts:** `patch-mutation-cache.ts`, `use-orders.ts`, `use-invoices.ts`, `use-products.ts`, `use-stock-allocation.ts`, `WarehouseDetailPage.tsx`, `AdminMyActivityContent.tsx`

---

## REQ-0124 — Instant UI secondary entities + soft-delete portal

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0123 |

**Intent:** Close final audit backlog — patch list caches for support tickets, product reviews, user management; remove archived products from portal browse cache on soft delete; document dashboard pulse-only and stock-transfer invalidate-only in walkthrough.

**Acceptance criteria**

- AC1: `use-support-tickets.ts`, `use-product-reviews.ts`, `use-user-management.ts` — `patchDetailCache` + `patchListCaches` before invalidate; delete uses `removeFromListCaches`
- AC2: `use-products.ts` — `removeProductFromPortalCaches` on soft and hard delete
- AC3: `docs/PROJECT_WALKTHROUGH.md` §7 Instant UI subsection; compact `CLAUDE.md` Instant UI block
- AC4: Gates pass — lint, test, invalidate (208), build

**Artifacts:** `use-support-tickets.ts`, `use-product-reviews.ts`, `use-user-management.ts`, `use-products.ts`, `CLAUDE.md`, `docs/PROJECT_WALKTHROUGH.md`

---

## REQ-0125 — Instant UI loading parity + invoice optimistic DRY

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0124 |

**Intent:** Close audit gaps — admin support/user list pages use dashboard SSR stats + split loading predicates (CategoryList parity); client tickets split unsettled/loading; `useUpdateInvoice` DRY via `patchDetailCacheMerge` with optimistic list patch.

**Acceptance criteria**

- AC1: `patchDetailCacheMerge` in `patch-mutation-cache.ts` + test + barrel export
- AC2: `useUpdateInvoice` — optimistic detail + list patch in `onMutate`; rollback via `patchDetailCache`
- AC3: Admin support tickets + user management — `prefetchListPageStats` in `page.tsx`; stat cards `isDataSlotUnsettled(dashboardQuery)`; table `isDataSlotLoading`
- AC4: Client `SupportTicketsPageContent` — stat cards unsettled, table loading
- AC5: Gates pass — lint, test, invalidate (208), build

**Artifacts:** `patch-mutation-cache.ts`, `use-invoices.ts`, `SupportTicketList.tsx`, `UserManagementList.tsx`, `SupportTicketsPageContent.tsx`, admin `page.tsx` files

---

## REQ-0126 — Order/invoice UI bug sweep (12 points)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0125 |

**Intent:** Fix 12 order/invoice UI bugs from prod smoke screenshots — CSS/layout only using shared components (PartiesRolesCard, DialogDateField, table meta helpers, semantic badges, PaymentDialog checkout).

**Acceptance criteria**

- AC1: Shared helpers — `formatWarehouseAvailLabel`, date calendar icon token, PartiesRolesCard stack + sky email, sky detail header back
- AC2: Order dialog/table/detail — duplicate stock error fix; warehouse `· N avail.`; table column reorder; payment badge newline
- AC3: Date sweep — OrderDialog + InvoiceDialog edit dates via `DialogDateField`
- AC4: Invoice picker/dialog — readable badges; richer picker rows; edit status badge select + aligned labels
- AC5: Invoice table/detail — `compactInvoiceMeta`; Created above #; Due Date column; parties + summary side-by-side; facts grid; Send icon
- AC6: PaymentDialog — subtotal row; fee icons; ProductThumb line items; wired from order/invoice detail
- AC7: Gates pass — lint, test, invalidate (208), build

**Artifacts:** `order-line-stock-validation.ts`, `OrderTableColumns.tsx`, `InvoiceTableColumns.tsx`, `InvoiceDialog.tsx`, `OrderPickerCommand.tsx`, `InvoiceDetailPage.tsx`, `PaymentDialog.tsx`, `InvoiceDetailFactsGrid.tsx`, `compact-invoice-meta.ts`

---

## REQ-0127 — Detail & table UI parity sweep (10 points)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0126 |

**Intent:** Fix cross-page detail/table UI parity from prod screenshots — inline person rows (sky name + muted email), statistics alignment, product table column merge, shared urgent forecast table, recent-order status layout, warehouse stock row enrichment. CSS/UI + read-only SSR field additions only.

**Acceptance criteria**

- AC1: `PersonInlineRow` — audit/party rows single inline row; `AuditUserDetailRow` + `PartiesRolesCard` refactored
- AC2: Category/Supplier statistics — inventory value inline (Product detail parity)
- AC3: Product table — QR icon in Stock column; Created/Expire merged column; QR column removed
- AC4: `UrgentReorderForecastTable` — icon title, ProductThumb column, `ForecastUrgencyBadge`; wired Catalog + Warehouse insights
- AC5: Product detail — Created+Expiration same row; supplier email SSR + `PersonInlineRow`
- AC6: Recent orders — status below price; `statusAt` SSR; Product detail DRY via `CatalogDetailRecentOrdersList` + `hideProductMeta`
- AC7: Warehouse detail Address row always visible; product warehouse stock rows with address/type badges
- AC8: Gates pass — lint, test, invalidate (208), build

**Artifacts:** `PersonInlineRow.tsx`, `UrgentReorderForecastTable.tsx`, `catalog-detail-order-select.ts`, `order-status-display-date.ts`, `ProductTableColumns.tsx`, `ProductDetailPage.tsx`, `CatalogDetailRecentOrdersList.tsx`, `stock-allocation-enrich.ts`

---

## REQ-0128 — REQ-0127 gap closure (dead code + statusAt parity + warehouse icons)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0127 |

**Intent:** Close REQ-0127 audit gaps — remove dead `getProductById`, extend `statusAt` to portal/dashboard recent orders, DRY `RecentOrderStatusColumn`, dynamic warehouse type icons. Read-only SSR + UI only.

**Acceptance criteria**

- AC1: Delete unused `getProductById`; clean stale test mock
- AC2: `orderStatusAtSelect` + `withOrderStatusAt`; portal/dashboard SSR + types
- AC3: `RecentOrderStatusColumn` wired to catalog detail + 5 portal/analytics UIs
- AC4: `warehouse-type-styles.ts` — `getWarehouseTypeIcon`; ProductDetailPage + `WarehouseTypeBadge` DRY
- AC5: Gates pass — lint, test, invalidate (208), build

**Artifacts:** `RecentOrderStatusColumn.tsx`, `warehouse-type-styles.ts`, `catalog-detail-order-select.ts`, portal/dashboard SSR files

---

## REQ-0129 — statusAt invoice paidAt + order list parity + invoice cache sweep

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0128 |

**Intent:** Close REQ-0128 audit gaps — paid `statusAt` uses invoice `paidAt` (Order has no `paidAt` field); `OrderForPage.statusAt` on all order list SSR/API paths; Admin My Activity recent orders show status date; invoice mutations invalidate catalog + supplier portal caches for instant statusAt refresh.

**Acceptance criteria**

- AC1: `resolveOrderStatusAtFromSource` + `orderInvoicePaidAtSelect`; catalog/portal/dashboard SSR pass nested invoice
- AC2: `getInvoiceLinkMap` includes `paidAt`; `OrderForPage.statusAt` via `buildOrderForPageRow` (4 SSR fetches + GET `/api/orders`)
- AC3: `AdminMyActivityContent` recent orders — `RecentOrderStatusColumn` with `statusAt`
- AC4: `INVOICE_PATTERNS` adds `products`, `categories`, `suppliers`, `supplierPortal` (REQ-0055 sync await unchanged)
- AC5: Gates pass — lint, test (528), invalidate (208), build

**Artifacts:** `order-status-display-date.ts`, `catalog-detail-order-select.ts`, `orders-data.ts`, `post-mutation.ts`, `AdminMyActivityContent.tsx`

---

## REQ-0130 — semantic date colors + order table statusAt

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0129 |

**Intent:** Semantic date text colors (light+dark) via shared hub; `/orders` table status column uses `RecentOrderStatusColumn` + `statusAt`.

**Acceptance criteria**

- AC1: `lib/ui/semantic-date-styles.ts` + `semantic` prop on `ClientDate*` components
- AC2: Detail/portals/tables/facts sweep for created/paid/due/cancelled/etc. hues
- AC3: `OrderTableColumns` status → `RecentOrderStatusColumn`; `Order.statusAt` type
- AC4: Gates pass — lint, test, invalidate, build

**Artifacts:** `semantic-date-styles.ts`, `ClientDateDisplay.tsx`, `ClientFormatDisplay.tsx`, `OrderTableColumns.tsx`

---

## REQ-0131 — REQ-0130 gap closure (table dates + catalog paymentStatus)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0130 |

**Intent:** Close audit gaps — semantic dates on all list table date columns; order # meta created date; catalog detail `paymentStatus` for statusAt hue.

**Acceptance criteria**

- AC1: Category/supplier/warehouse/history/user/review/ticket/invoice list tables use `ClientDate*` + `semantic`
- AC2: `OrderTableColumns` compact meta uses `ClientDate semantic="created"`
- AC3: `CatalogDetailRecentOrderItem.paymentStatus` SSR + `RecentOrderStatusColumn` wiring
- AC4: Gates pass — lint, test, invalidate, build

**Artifacts:** `*TableColumns.tsx`, `catalog-detail-lists.ts`, category/supplier/product detail SSR

---

## REQ-0132 — Final date gap closure (CSV export + UI semantic dates)

| Field | Value |
|-------|-------|
| **Priority** | P2 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0131 |

**Intent:** Close last semantic-date gaps — DRY CSV export dates via `formatStableDate`; wire three remaining UI surfaces to `ClientDate*` with `semantic` props.

**Acceptance criteria**

- AC1: Six `*Filters.tsx` CSV export mappers use `formatStableDate` (not `toLocaleDateString`)
- AC2: `AdminClientPortalContent`, `ActivityLogSection`, `ProductReviewsSection` use `ClientDate*` + `semantic="created"`
- AC3: Dead `date-fns` `format` imports removed from UI files
- AC4: Support ticket detail replies + invoice PDF + dev script use `formatStableDate` / `ClientDateTime`
- AC5: Gates pass — lint, test, invalidate, build

**Artifacts:** `*Filters.tsx`, `AdminClientPortalContent.tsx`, `ActivityLogSection.tsx`, `ProductReviewsSection.tsx`, `SupportTicketDetailContent.tsx`, `AdminSupportTicketDetailContent.tsx`, `invoice-generator.ts`, `check-all-data.ts`

---

## REQ-0133 — Cache coherence hardening (post-CRUD revert fix)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0055 |

**Intent:** Fix prod “fresh after CRUD → old data minutes later” via four-layer coherence: SSR sync guard, widened Redis invalidation, TanStack persistence trim, Redis stale re-warm block.

**Acceptance criteria**

- AC1: `resolveSsrSyncAction` skips list/entity overwrite when server not provably fresher
- AC2: `PRODUCT_*` / `STOCK_*` / `CATEGORY_*` / `WAREHOUSE_*` Redis patterns include categories/suppliers/portals/forecasting
- AC3: TanStack persist auth/user only; buster `v2.0.2`; `refetchOnWindowFocus: false`
- AC4: `invalidateAfterCatalogChange` on catalog/stock hooks + back-nav
- AC5: `setCache` blocks re-warm when invalidation after `fetchedAt`; all GET read-through sites pass `fetchedAt`
- AC6: Gates pass — lint, test 544+, invalidate 213+, build

**Artifacts:** `ssr-sync-policy.ts`, `cache-utils.ts`, `post-mutation.ts`, `invalidate-all.ts`, `provider.tsx`, `config.ts`, all cached API/server-data paths

---

## REQ-0134 — Session TTL + auth focus + QR re-invalidate + idle nav

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0133 |

**Intent:** Close post-0133 prod gaps — idle logout (1h JWT), OAuth cookie/JWT mismatch, stale QR after async ImageKit write, slow nav after idle gcTime.

**Acceptance criteria**

- AC1: `SESSION_MAX_AGE_SECONDS` / `SESSION_JWT_EXPIRES` = 1d; password + OAuth use `sessionCookieOptions`
- AC2: `useSession` `refetchOnWindowFocus: true`; global data queries stay `false`
- AC3: TanStack `gcTime` 30 min (in-memory only; lists not persisted)
- AC4: Product POST/PUT QR `.then` calls second `invalidateOnProductChange` after DB update
- AC5: Gates pass — lint, test, invalidate, build

**Artifacts:** `utils/auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/oauth/google/callback/route.ts`, `hooks/queries/use-auth.ts`, `lib/react-query/config.ts`, `app/api/products/route.ts`

---

## REQ-0135 — Redis invalidate pattern asymmetry closure

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0133 |

**Intent:** Close remaining Redis SCAN asymmetries that let TanStack refetch refill from stale keys after stock-fulfilling invoice pay and portal-adjacent catalog/auth writes.

**Acceptance criteria**

- AC1: `INVOICE_PATTERNS` includes `stockAllocation:*` (mark-paid `fulfillPendingOrderLines`)
- AC2: `SUPPLIER_PATTERNS` includes `clientPortal:*` + `stockAllocation:*`
- AC3: `WAREHOUSE_PATTERNS` includes `supplierPortal:*`
- AC4: `CATEGORY_PATTERNS` includes `stockAllocation:*`
- AC5: `AUTH_PATTERNS` / `IMPORT_PATTERNS` include portal + admin portal keys (parity with USER/PRODUCT)
- AC6: Gates pass — lint, test, invalidate, build

**Artifacts:** `lib/cache/post-mutation.ts`

---

## REQ-0143 — Detail product/order meta polish

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0141, REQ-0086, REQ-0127 |

**Intent:** Catalog detail cards — Owner · Supplier / Owner · Buyer separators; recent-orders category sky link between SKU and Qty; invoice indicator beside order # when linked. Shared list UI + SSR enrich via `getInvoiceLinkMap`.

**Acceptance criteria**

- AC1: Product grid party row — `Owner … · Supplier …`
- AC2: Recent orders party row — `Owner … · Buyer …`
- AC3: Recent orders product line — SKU · Category (sky) · Qty · Date; product detail hideProductMeta shows Category · Qty · Date
- AC4: Invoice when linked — top line after order # with FileText + sky CopyableText/Link (`text-xs`)
- AC5: SSR — category + `invoiceForOrder` on cat/sup/product recentOrders
- AC6: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `CatalogDetailProductGrid.tsx`, `CatalogDetailRecentOrdersList.tsx`, `catalog-detail-lists.ts`, `{category,supplier,product}-detail-data.ts`, detail pages

---

## REQ-0142 — Category/supplier list polish + nest-button fix

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0141, REQ-0136 |

**Intent:** Close REQ-0141 gaps — fix nested `<button>` in supplier dialog name cell; product-like Supplier & Email layout; Products HelpTooltip for count·%; scope productCount by viewer userId; detail Products/Recent Orders iconTile.

**Acceptance criteria**

- AC1: Supplier name cell — avatar \| name control \| email sibling; no CopyableText inside navigate button/Link
- AC2: Header label **Supplier & Email**; FAB dialog opens without nested-button console error
- AC3: Products header HelpTooltip (cat + sup) with shared `CATALOG_PRODUCT_SHARE_TOOLTIP`
- AC4: `productCount` groupBy scoped to viewer `userId` (matches `catalogProductTotal`)
- AC5: Detail Products + Recent Orders `SectionTitleRow` with `iconTile` + subtitle
- AC6: Gates — lint, test, invalidate, build; invalidation unchanged

**Artifacts:** `SupplierTableColumns.tsx`, `CategoryTableColumns.tsx`, `catalog-list-enrich.ts`, `catalog-product-share.ts`, `AvatarInlineLink.tsx`, `{Category,Supplier}DetailPage.tsx`

---

## REQ-0141 — Category / supplier list + detail UI

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0084, REQ-0086, REQ-0138 |

**Intent:** Category/supplier list + detail UI parity — drop Notes column; product count + % of role-visible catalog; supplier email under name; remove top Status strip; product grid Name·SKU + category link; stock pie companion from existing stats (no new invalidation).

**Acceptance criteria**

- AC1: List tables — no Notes; Products `{count} · {%}` of catalog; supplier email under name when linked
- AC2: List SSR/API enrich `productCount` (+ supplier `email`); CSV/Excel Notes → Products
- AC3: Detail — no full-width Status card; `ActiveInactiveBadge` beside Created; Information/Statistics typography tokens
- AC4: Product grid — SKU beside name; category link on meta row; supplier SSR category enrich
- AC5: Stock pie + `CatalogSnapshotCompanion` side-by-side on `lg+` (not `lg:col-span-2`)
- AC6: Gates — lint, test, invalidate, build; invalidation registry unchanged

**Artifacts:** `lib/server/catalog-list-enrich.ts`, `lib/catalog/catalog-product-share.ts`, `CategoryTableColumns.tsx`, `SupplierTableColumns.tsx`, `CatalogDetailProductGrid.tsx`, `CatalogSnapshotCompanion.tsx`, `{Category,Supplier}DetailPage.tsx`, `{category,supplier}-detail-data.ts`

---

## REQ-0140 — Seed stock coherence + sold/insights stats

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0137, REQ-0103, REQ-0136 |

**Intent:** Fix explore-seed double-reservation on Beats (warehouse-pick ORD-DEMO-002 must not also set `product.reservedQuantity`). Align Sony post-fulfill qty. Sold stats / demand velocity count delivered or paid only. Insights stock buckets use `qty − committed`.

**Acceptance criteria**

- AC1: Beats seed `product.reservedQuantity = 0`; Main alloc `reservedQuantity = 20`; UI committed **20**, available **30**
- AC2: Sony seed post-fulfill snapshot — catalog **99**, Main alloc **49**
- AC3: `isOrderCountedAsSold` — delivered or paid; wired into product/category/supplier detail sold + `computeProductInsights` / `computeCatalogInsights` trends
- AC4: Insights low/available/out classify from `max(0, qty − committed)`
- AC5: `MANUAL_TEST_FIXTURES.md` §9 documents REQ-0140 seed floor
- AC6: Gates — lint, test, invalidate, build; re-seed spot-check Beats 30/20

**Artifacts:** `lib/auth/demo-seed-data.ts`, `lib/orders/order-sales-eligibility.ts`, `lib/server/{product,catalog}-insights.ts`, `lib/server/{product,category,supplier}-detail-data.ts`, `docs/MANUAL_TEST_FIXTURES.md`

---

## REQ-0139 — Product UI gap closure (table + detail polish)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0138 |

**Intent:** Close post-REQ-0138 screenshot gaps — QR border hue, Created/Expire labels, Status/Stock/Price icons + column stretch, reorder urgency colors, Catalog Allocation companion beside warehouse pie, TYPO_CARD_TITLE/TYPO_SUBTITLE on Sales Statistics + Product Insights.

**Acceptance criteria**

- AC1: Table QR box border light sky (icon hue); reserved text `text-muted-foreground` (SKU parity)
- AC2: Header `Created / Expire`; cell labels `Created:` / `Expire:` both `text-xs`
- AC3: Detail Status/Stock/Price cards have icons; left column `flex-1` stretch matches Image/QR height
- AC4: Reorder status uses `ForecastUrgencyBadge` with urgent/soon/normal/overstocked tones
- AC5: Catalog Allocation companion card fills empty cell beside warehouse pie (or stock chart `lg:col-span-2` when no companion)
- AC6: Sales Statistics + Product Insights use `TYPO_CARD_TITLE` / `TYPO_SUBTITLE`
- AC7: Gates pass — lint, test, invalidate, build

**Artifacts:** `qr-code-hover.tsx`, `ProductTableColumns.tsx`, `ProductDetailPage.tsx`, `CatalogInsightsSection.tsx`, `semantic-badges.tsx`

---

## REQ-0138 — Product table + detail UI parity

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0136, REQ-0127, REQ-0130 |

**Intent:** Close product list Stock/Created cells and product detail media/info/warehouse/orders/reviews UI mismatches. Shared tokens/helpers; no TanStack/Redis/invalidation changes.

**Acceptance criteria**

- AC1: Table Stock QR trigger `h-12 w-12` (thumb parity); qty/reserved vertically centered; available qty colored via `productStockAvailableTextClass`
- AC2: Created/Exp. column `text-xs` muted; sortable by `createdAt`; short `Exp.` label
- AC3: Global `semantic="created"` → muted gray (sky reserved for links)
- AC4: Detail 3-col: Status/Stock/Price stack \| Image \| QR; Status removed from Product Information
- AC5: Info Stock qty / Reserved / Available colored; reorder status capitalized
- AC6: Warehouse subtitle always shows help + `CatalogAllocationSummaryText` (justify-between); reserved on new line; row spacing + icon tile
- AC7: Recent Orders / Reviews header icon tile + subtitle; review date `text-xs`
- AC8: Gates pass — lint, test, invalidate, build

**Artifacts:** `semantic-badges.tsx`, `semantic-date-styles.ts`, `section-title-row.tsx`, `CatalogAllocationSummaryText.tsx`, `qr-code-hover.tsx`, `ProductTableColumns.tsx`, `ProductDetailPage.tsx`, `CatalogInsightsSection.tsx`, `RecentOrderStatusColumn.tsx`, `ProductReviewsSection.tsx`, `lib/format/capitalize.ts`

---

## REQ-0137 — Full explore demo seed (1–2 rows per entity)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R1 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0088, REQ-0092, REQ-0136 |

**Intent:** Opt-in seed so every user-facing schema entity has 1–2 connected rows for Gate-2 UI explore after accounts-only reset. Default reset stays accounts-only.

**Acceptance criteria**

- AC1: `DEMO_CATALOG_SEED` covers categories, warehouses, products (Beats+Sony), allocations, orders+invoices (paid + pending/reserved), transfers, tickets+replies, reviews, notifications, import history, system config, audit logs, local editable supplier
- AC2: Stub models (Department, Permission, Session, StockAlert, UserAction, VerificationToken) get ≥1 row
- AC3: `npm run script:seed-demo-catalog` seeds onto existing demo accounts (refuses if products exist)
- AC4: `npm run script:reset-demo-db -- --with-catalog` wipe + accounts + explore seed
- AC5: Stock math coherent for Beats: catalog 50 · Main 30 (20 reserved) · `product.reservedQuantity` 0 · ORD-DEMO-002 qty 20 pending (REQ-0140)
- AC6: `verify-demo-accounts.ts` prints expanded entity counts

**Artifacts:** `lib/auth/demo-seed-data.ts`, `scripts/lib/seed-demo-catalog.ts`, `scripts/seed-demo-catalog.ts`, `scripts/reset-demo-db.ts`, `package.json`

---

## REQ-0136 — Gate-2 UI mismatch pass + cache smoke (A1/A2/B1)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Risk** | R2 |
| **Status** | done |
| **Cycle** | C2 |
| **Parent** | REQ-0133–0135 (cache), REQ-0121 (UI sweep), Gate-2 |

**Intent:** Resume token `tomorrow-UI-then-cache` (2026-07-17). Fix user-reported UI mismatches that block trustworthy eyes, then run short cache coherence smoke (`docs/MANUAL_TEST_FIXTURES.md` §10 A1, A2, B1 only). Do **not** mix UI polish into cache pass/fail. Full role×route matrix deferred. Shipped park: REQ-0141–0145.

**Acceptance criteria**

- AC1: Each reported UI mismatch logged with route + expected vs actual; fixed with shared tokens/components (no one-off CSS drift) — **PASS**, closed via REQ-0141–0187 child REQs (all `Parent: REQ-0136`)
- AC2: Lists/dialogs/detail chrome usable for admin + client (+ supplier if touched) without broken layout/click/nav that hides wrong data — **PASS**, same child-REQ sweep
- AC3: §10 **A1** — product name/qty edit stays fresh on list + detail + category/supplier grids at 0s and ~5 min tab away/back — **PASS** (2026-07-27, browser-verified: Beats→Beats Pro qty 30→55/avail 35 held on list/detail/category/supplier grids at 0s and after 5 min + navigation away/back)
- AC4: §10 **A2** — detail → Back to list shows updated row (no SSR clobber) — **PASS** (2026-07-27, list→detail(Link)→Back showed "Beats Pro"/35 avail, no revert)
- AC5: §10 **B1** — mark invoice paid → product/warehouse stock + allocations stay fresh ~5 min — **PASS** (2026-07-27, INV-DEMO-002 Sent/partial→Paid/$3980; ORD-DEMO-002 paymentStatus instantly Paid; warehouse/product reserved-qty correctly unchanged since order stays Confirmed not Delivered; held at 0s and 5 min)
- AC6: Results recorded in `VALIDATION_SUMMARY.md`; gates (lint/test/invalidate/build) pass for any code fixes — **PASS** (lint ✓, test 738/738 ✓, invalidate 221/221 ✓, build ✓; no code changes required — smoke only)
- AC7: Out of scope unless AC3–5 FAIL — Infinity `staleTime`, full B2–D, every role×route CRUD — N/A, AC3–5 all PASS

**Artifacts:** TBD per mismatch; `docs/MANUAL_TEST_FIXTURES.md` §10; `.agile-v/VALIDATION_SUMMARY.md`

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
