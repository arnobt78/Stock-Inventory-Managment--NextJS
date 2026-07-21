# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–4 — **REQ-0185** active (session 2026-07-21) |
| **Last updated** | 2026-07-21 — Agile V activate / resume |
| **Active REQ** | **REQ-0185** → 0186 → 0187 → **REQ-0136** |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0184** |
| **Prod SHA** | `011d655` (REQ-0179–0184; tip docs `ceb9097`) |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — after 0185–0187 + §10 smoke → Sentry 24h |
| **Resume token** | `tomorrow-UI-tickets-warehouse-order` → **REQ-0185** |
| **CHECKPOINTS** | none PENDING |

---

## Start here (this session)

1. **REQ-0185** — Support ticket **table + detail** UI (admin / client / supplier)
2. **REQ-0186** — Warehouse **dialog + detail** UI polish
3. **REQ-0187** — Order **dialog** UI polish
4. Then **REQ-0136** — cache smoke §10 A1/A2/B1 + Gate 2 Sentry 24h

**Skills active:** 01 · 02 · 03 · 06 · 07 · 17 · 19 · 23 → write-through every prompt  
**Cursor rule:** `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`)  
**Skills registry:** 24 files in `.agile-v/skills/` (SKILLS_INDEX)

---

## Shipped 2026-07-20 (parked)

| REQ | Summary |
|-----|---------|
| 0165–0178 | Detail/audit + forecast/portal densify |
| 0179–0184 | Product reviews densify, Actions, badge contrast, edit dialog stack |

**Gates:** lint ✓ test **636** ✓ invalidate **214** ✓ build ✓ · `011d655` on `origin/main`

---

## Backlog (this wave)

| REQ | Status | Focus |
|-----|--------|-------|
| **0185** | **active** | Ticket table + detail (admin/client/supplier) |
| **0186** | planned | Warehouse dialog + detail |
| **0187** | planned | Order dialog UI |
| **0136** | parked | §10 cache smoke + Gate 2 |

**Defaults:** SSR-first · TanStack invalidate after CRUD · match glass/typography tokens · no broad invalidation registry changes unless bug requires.

---

## Session resume protocol

1. Read this file
2. Skills 01 + 17 + 19 (+ 02 pipeline when orchestrating)
3. Map work to `REQ-XXXX` (halt if missing)
4. Red Team gates before done claims
5. Write-through DECISION / BUILD / VALIDATION
