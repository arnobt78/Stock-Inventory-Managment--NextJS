# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-19 REQ-0157 |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0157** |
| **Prod SHA** | `e9349ca` (REQ-0155) on `origin/main` |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Active session (2026-07-19)

**Agile V activated:** core + pipeline loaded; `.agile-v/` intact (**no re-bootstrap**).

**Skills this session:** **01** core · **02** pipeline · **06** PO · **14/15** on new mismatches → REQ · **17** build-js · **19** red-team · **23** Sentry · **24** release after Gate 2.

**Cursor rule:** `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`) · **24 skills** in `.agile-v/skills/`.

### Resume order (do not reorder) — left from 2026-07-17 EOD

1. **Human UI + calc explore** (REQ-0136 AC1–AC2) — admin/client/supplier; order/invoice **partial pay** (`ORD-DEMO-002` / `INV-DEMO-002`); report mismatches → new/child REQs
2. **Cache smoke** — §10 **A1, A2, B1** only (`docs/MANUAL_TEST_FIXTURES.md`) — Amount Paid → order Partial (REQ-0152/0153)
3. **Gate 2** — Sentry 24h (REQ-0009) after smoke PASS

**Pass rule:** A1/A2/B1 no stale revert → cache goal met. Do **not** mix UI polish into cache pass/fail.

**Re-seed:** `npm run script:reset-demo-db -- --with-catalog`

**Demo fixtures:** ORD-DEMO-001 paid/delivered · ORD-DEMO-002 confirmed + partial `$100`/`$3980` · INV-DEMO-001/002 · catalogs/stock/tickets/reviews

---

## Shipped park (recent)

| REQ | Summary | SHA |
|-----|---------|-----|
| 0146–0149 | Order detail polish | `61c1e79` |
| 0150–0153 | Invoice densify + partial pay + linked-order patch | `122da3d` |
| 0154 | Partial pay KPI stats + Total typography | `4e7bd56` |
| 0155 | Delivered + Due badge parity | `e9349ca` |
| 0156 | My Activity + invoice badge set parity | pending |
| 0157 | Badge DRY + portal helper + test tsc | pending |
| docs EOD | Park resume REQ-0136 | `157c581` |

**Last gates (REQ-0157):** lint ✓ test **606** ✓ invalidate **213** ✓ build ✓ tsc ✓

---

## Session resume (every chat)

1. Read this file (resume token + checklist)
2. Skills: `skills/SKILLS_INDEX.md` — **01** always; **02** pipeline; **17** Next.js; **19** before done
3. Map work to `REQ-XXXX` — halt if missing
4. Red Team: `lint` · `test` · `test:invalidate` · `build`
5. Write-through DECISION / BUILD / VALIDATION on material changes
