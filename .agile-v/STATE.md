# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-19 EOD REQ-0162–0164 |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0164** |
| **Prod SHA** | `a32be36` (REQ-0162–0164) |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Tomorrow (start here)

1. **REQ-0136** — Human UI + calc explore
2. **Cache smoke** — `MANUAL_TEST_FIXTURES.md` §10 A1/A2/B1
3. **Gate 2** — Sentry 24h after explore + smoke
4. Re-seed if needed: `npm run script:reset-demo-db -- --with-catalog`

**Skills:** 01 · 17 · 19 → lint · test · test:invalidate · build → write-through

---

## Shipped today (2026-07-19)

| REQ | Summary |
|-----|---------|
| 0162–0164 | Invoice detail parity + items/reviews/parties/summary | `a32be36` |

**Gates:** lint ✓ test **620** ✓ invalidate **213** ✓ build ✓

---

## Session resume

1. Read this file
2. Skills 01 + 17 + 19
3. Map `REQ-XXXX`
4. Red Team gates
5. Write-through DECISION / BUILD / VALIDATION
