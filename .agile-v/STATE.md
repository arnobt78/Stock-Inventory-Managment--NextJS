# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-17 EOD |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0153** |
| **Prod SHA** | tip `ea20bef` · feature `122da3d` (REQ-0150–0153) on `origin/main` |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## EOD park (2026-07-17) — start here tomorrow

**Shipped today:** REQ-0150–0153 (`122da3d`) — invoice table densify; edit Zod dates; partial pay sync (order unpaid/partial/paid); Stripe amount + Pay toggle; `PaymentMoneyBreakdown`; `patchLinkedOrderFromInvoiceMoney` instant UI. Docs SHA `ea20bef`.

**Gates:** lint ✓ · test **595** ✓ · invalidate **213** ✓ · build ✓

**Demo seed (already reset):** `npm run script:reset-demo-db -- --with-catalog`
- ORD-DEMO-001 paid/delivered + INV-DEMO-001
- ORD-DEMO-002 confirmed + **partial $100/$3980** + INV-DEMO-002 sent
- categories/warehouses/products/allocations/transfer/tickets/reviews

### Tomorrow resume (do not reorder)

1. **Human UI + calc explore** (REQ-0136 AC1–AC2) — login admin/client/supplier; exercise order/invoice partial pay + lists; report mismatches → new/child REQs
2. **Cache smoke** — §10 **A1, A2, B1** only (`docs/MANUAL_TEST_FIXTURES.md`) — include invoice Amount Paid → order Partial (REQ-0152/0153)
3. **Gate 2** — Sentry 24h (REQ-0009) after smoke PASS

**Pass rule:** A1/A2/B1 no stale revert → cache goal met. Do **not** mix UI polish into cache pass/fail.

---

## Shipped park (recent)

| REQ | Summary | SHA |
|-----|---------|-----|
| 0141–0143 | Cat/sup list+detail | `9919eb0` |
| 0144 | Products hydration + theme | `3c3a441` |
| 0145 | Orders Invoice # / SemanticEventDate | `c62d364` |
| 0146–0149 | Order detail polish | `61c1e79` |
| 0150–0153 | Invoice densify + partial pay + linked-order patch | `122da3d` |

---

## Session resume (every chat)

1. Read this file (resume token + checklist)
2. Skills: `skills/SKILLS_INDEX.md` — **01** always; **02** pipeline; **17** Next.js; **19** before done
3. Map work to `REQ-XXXX` — halt if missing
4. Red Team: `lint` · `test` · `test:invalidate` · `build`
5. Write-through DECISION / BUILD / VALIDATION on material changes
