# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 (closing) → **C2 open** |
| **Phase** | C2 — REQ-0106 … REQ-0119 **done** |
| **Last updated** | 2026-07-14 (REQ-0119) |
| **Active REQ range** | REQ-0001 … REQ-0119 **done** |
| **Prod deploy target** | `7b5c999` (REQ-0114–0116) — pushed `origin/main` |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after prod deploy |
| **Resume token** | `Gate-2-deploy` — prod SHA + Sentry 24h |

## REQ-0105 — product detail committedQuantity SSR (2026-07-13)

Product detail SSR/API + Redis cache guard expose `committedQuantity`; `CLAUDE.md` tracked in git. AC6: `ProductDetailPage` primary path `getDisplayCommittedQuantity(product)`; warehouse `computeCommittedQuantity` fallback. Commit `3cc5c4b` pushed `origin/main`. Gates: lint ✓ test 464 ✓ invalidate 208 ✓ build ✓ (re-verified 2026-07-14).

## REQ-0104 — committedQuantity parity (2026-07-13)

Category/supplier detail SSR + forecast/supplier-dashboard avail use `committedQuantity` / `getDisplayCommittedQuantity`. Cache guard on detail Redis. Gates: lint ✓ test 461 ✓ invalidate 208 ✓ build ✓.

## REQ-0103 done (2026-07-13)

Disjoint order reservation — warehouse pick reserves allocation only; `committedQuantity` on list APIs; catalog floor 20 not 40. Gates: lint ✓ test 460 ✓ invalidate 208 ✓ build ✓.

## REQ-0102 done (2026-07-13)

Catalog reconcile + allocation validation + warehouse delete guards + archived rows + unified `enrichStockAllocationRows` (API + SSR) + `formatCatalogAllocationSummary` + dialog fetch gates. Commit `554af8e`. Gates: lint ✓ test 449 ✓ invalidate 208 ✓ build ✓.

## REQ-0106–0109 — stock UX gaps (2026-07-14)

Order auto-assign + catalog cap (0106); product detail allocation summary (0107); live dialog validation (0108); feedback layout tokens (0109). Gates: lint ✓ test 479 ✓ invalidate 208 ✓ build ✓.

## REQ-0110 — stock UX gap closure (2026-07-14)

committedQuantity order cap fallback + prefetch; warehouse name errors; `getAllocationQtyBounds` DRY; reserve auto-assign test; ProductForm edge-scroll shell; Allocate feedback wrapper. Gates: lint ✓ test 484 ✓ invalidate 208 ✓ build ✓.

## REQ-0111 — order stock workflow consistency (2026-07-14)

Reactive `useOrderLineStockValidation` hook; `OrderDialogCreateLineItem`; `manualPickError` DRY; `ensureStockAllocationsAndValidate` on submit; server `Max {n} at {name}` parity. Gates: lint ✓ test 486 ✓ invalidate 208 ✓ build ✓.

## REQ-0112 — order line fetch DRY (2026-07-14)

Single useStockByProduct per line; injected allocationRows; lineStockErrors keyed by field.id. Gates: lint ✓ test 488 ✓ invalidate 208 ✓ build ✓.

## REQ-0113 — warehouse select fetch removal (2026-07-14)

OrderLineWarehouseSelect props-only; OrderFormData merged; .types.ts deleted. Gates: lint ✓ test 488 ✓ invalidate 208 ✓ build ✓.

## REQ-0114 — Stock UX clarity + dialog/detail UI parity (2026-07-14)

Catalog-commit warehouse hints + `committedQuantity` on allocation enrich; `computeWarehouseInsights` DRY on warehouse detail; proportional order line amounts; `DialogFormLabel` + dialog sweep; `DetailInfoRow` font-normal + `DetailInfoRowGroup`; `TABLE_CATALOG_LINK_CLASS`. Gates: lint ✓ test 492 ✓ invalidate 208 ✓ build ✓.

## REQ-0115 — REQ-0114 dialog gap closure (2026-07-14)

`mapWarehouseStockSummary` + test; Invoice/Order/SupportTicket/Payment dialog label+footer parity; ImageField + Category/Supplier label sweep. Gates: lint ✓ test 494 ✓ invalidate 208 ✓ build ✓.

## REQ-0116 — Dialog parity + proportional price DRY + detail typography (2026-07-14)

`ProportionalPriceDisplay` + test; supplier create / order notes / payment cancel / warehouse status dialog labels; order-create proportional preview; `DETAIL_DATA_VALUE_CLASS` + detail stat tone tokens. Gates: lint ✓ test 498 ✓ invalidate 208 ✓ build ✓.

## REQ-0117 — Dialog UX parity + admin embed tables + network audit (2026-07-14)

`DialogFormLabel` flex-safe + `DIALOG_SELECT_*` tokens; `DialogDateField` + `DialogHeaderBrand`; order-create totals empty state; `AdminEmbedDataTable`; admin portal table parity; VS-045 network audit (defer prefetch cuts to REQ-0118). Gates: lint ✓ test 498 ✓ invalidate 208 ✓ build ✓.

## REQ-0118 — Readable popover full sweep + REQ-0117 gap closure (2026-07-14)

`lib/ui/popover-readability-styles.ts` hub; PaymentDialog `DialogHeaderBrand`; warehouse/order line pickers; 15 filter Command popovers + pagination + `FilterCommandCheckboxItem`; dead import cleanup; README revert; VS-046 prod network confirm. Gates: lint ✓ test 498 ✓ invalidate 208 ✓ build ✓.

## REQ-0119 — Catalog popover parity + order address labels + warehouse rollup (2026-07-14)

Catalog/export popover readability via `catalogEntityPopoverContentClass`; `DIALOG_FORM_SUB_LABEL` + `OrderAddressFields`; Business Insights Warehouses tab + SSR `getWarehouseStockSummary` + rollup helper/test. Gates: lint ✓ test 504 ✓ invalidate 208 ✓ build ✓.

## Next session

| Priority | Item | REQ |
|----------|------|-----|
| P0 | Confirm Vercel prod SHA; Sentry 24h Gate 2 | REQ-0009 |
| P1 | Manual smoke — dialog UX + admin portal tables | REQ-0117 |

## Current focus

1. **REQ-0106–0119** — done
2. **Gate 2** — deploy confirm + Sentry 24h
3. **Manual QA** — Beats auto-order walkthrough

## Session resume (every chat)

1. Read `.agile-v/STATE.md` + `.agile-v/REQUIREMENTS.md` + `.agile-v/PLAYBOOK.md`
2. Load skill: `.agile-v/skills/SKILLS_INDEX.md` (01 core → task skill)
3. Map work to REQ-XXXX; halt if missing traceability
4. Red Team: lint, test, test:invalidate, build before Gate 2 claim
5. Write-through DECISION_LOG, BUILD_MANIFEST, VALIDATION_SUMMARY on material changes
