# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 4–5 Verify — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-20 REQ-0169 done (gates PASS) |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0169** |
| **Prod SHA** | pending push (REQ-0168–0169 local; tip was `672d782`) |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Start here (this session)

1. **REQ-0136 AC1–AC2** — Human UI + calc explore
2. **REQ-0136 AC3–AC5** — Cache smoke `MANUAL_TEST_FIXTURES.md` §10 A1/A2/B1
3. **Gate 2** — Sentry 24h (REQ-0009) after explore + smoke → `EVAL_RESULTS.md` PASS
4. Re-seed if needed: `npm run script:reset-demo-db -- --with-catalog`

**Skills active:** 01 · 02 · 03 · 06 · 07 · 17 · 19 · 23 → write-through every prompt

---

## Shipped today (2026-07-20)

| REQ | Summary |
|-----|---------|
| 0165–0167 | Detail review/audit UX |
| 0168 | Admin/BI spacing; My Activity Order columns; dashboard Latest 5 |
| 0169 | Shell stats token; optional onEdit (My Activity embed) |

**Gates:** lint ✓ test **630** ✓ invalidate **213** ✓ build ✓

---

## Session resume protocol

1. Read this file
2. Skills 01 + 17 + 19 (+ 02 pipeline when orchestrating)
3. Map work to `REQ-XXXX` (halt if missing)
4. Red Team gates before done claims
5. Write-through DECISION / BUILD / VALIDATION
