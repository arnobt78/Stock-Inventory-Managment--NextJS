# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–4 — **REQ-0136** next |
| **Stopped** | 2026-07-22 — REQ-0206 portal SSR sync keys |
| **Session** | 2026-07-22 — REQ-0206 done; next REQ-0136 |
| **Active REQ** | **REQ-0136** (Gate 2 / cache smoke) |
| **Done range** | REQ-0001…0135 + 0137–0187 + 0188–**0206** |
| **Prod SHA** | `fa73409` (REQ-0204–0206) |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING — §10 smoke → Sentry 24h |
| **Resume token** | `gate2-0136-cache-smoke` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Next (start here)

1. **REQ-0136** — cache smoke §10 + Gate 2 Sentry 24h

**Skills:** 01 · 02 · 03 · 06 · 07 · 17 · 19 · 23

---

## Shipped 2026-07-22

| REQ | One-liner |
|-----|-----------|
| 0206 | Role portal SSR sync → `portal.*Dashboard(userId)` (lists + hooks + warm) |
| 0205 | Supplier Related Invoices: same 4 portal KPI cards as View Orders |
| 0204 | Supplier view-only invoice detail + PDF gate; Related Invoices nav |
| 0187 | Invoice densify; order line cols; Cat/Sup STATUS; Product Combobox + Warehouse two-line |
| 0203 | Detail + Allocate/Transfer; gap layout; DRY productSupplier helpers |

**Gates (0206):** lint ✓ test **692** ✓ invalidate **217** ✓ build ✓

---

## Session resume protocol

1. Read this file → map `REQ-XXXX`
2. Skills 01 + 17 + 19
3. Red Team before done claims
4. Write-through DECISION / BUILD / VALIDATION
