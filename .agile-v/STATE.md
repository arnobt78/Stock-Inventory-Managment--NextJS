# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-19 REQ-0161 |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0161** |
| **Prod SHA** | `c44b719` tip; REQ-0161 pending push |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Active session (2026-07-19)

**Skills:** **01** core · **17** build-js · **19** red-team

### Resume order

1. **Human UI + calc explore** (REQ-0136)
2. **Cache smoke** — §10 A1/A2/B1
3. **Gate 2** — Sentry 24h

**Re-seed:** `npm run script:reset-demo-db -- --with-catalog`

---

## Shipped park (recent)

| REQ | Summary | SHA |
|-----|---------|-----|
| 0158–0159 | Party + buyer display | `35bb8a2` |
| 0160 | User overview copy | `5dcd6f9` |
| 0161 | Order/Invoice header HelpTooltips | pending |

**Last gates (REQ-0161):** lint ✓ test **616** ✓ invalidate **213** ✓ build ✓ tsc ✓

---

## Session resume

1. Read this file
2. Skills 01 + 17 + 19
3. Map `REQ-XXXX`
4. Red Team: lint · test · test:invalidate · build
5. Write-through DECISION / BUILD / VALIDATION
