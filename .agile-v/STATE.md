# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 (closing) → **C2 open** |
| **Phase** | C2 — REQ-0105 **done** |
| **Infinity Loop stage** | Verify ✓ (Gate 2 open) |
| **Last updated** | 2026-07-13 (REQ-0105 complete) |
| **Session** | **ACTIVE** — REQ-0105 done |
| **Active REQ range** | REQ-0001 … REQ-0105 **done** |
| **Prod deploy target** | pending — REQ-0105 |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after prod deploy |
| **Resume token** | `Gate-2-deploy` — prod SHA + Sentry 24h |

## REQ-0105 — product detail committedQuantity SSR (2026-07-13)

Product detail SSR/API + Redis cache guard expose `committedQuantity`; `CLAUDE.md` tracked in git. Gates: lint ✓ test 464 ✓ invalidate 208 ✓ build ✓.

## REQ-0104 — committedQuantity parity (2026-07-13)

Category/supplier detail SSR + forecast/supplier-dashboard avail use `committedQuantity` / `getDisplayCommittedQuantity`. Cache guard on detail Redis. Gates: lint ✓ test 461 ✓ invalidate 208 ✓ build ✓.

## REQ-0103 done (2026-07-13)

Disjoint order reservation — warehouse pick reserves allocation only; `committedQuantity` on list APIs; catalog floor 20 not 40. Gates: lint ✓ test 460 ✓ invalidate 208 ✓ build ✓.

## REQ-0102 done (2026-07-13)

Catalog reconcile + allocation validation + warehouse delete guards + archived rows + unified `enrichStockAllocationRows` (API + SSR) + `formatCatalogAllocationSummary` + dialog fetch gates. Commit `554af8e`. Gates: lint ✓ test 449 ✓ invalidate 208 ✓ build ✓.

## Next session

| Priority | Item |
|----------|------|
| P0 | Prod deploy REQ-0105; Sentry 24h Gate 2 |
| P1 | Manual smoke — Beats fixture after reset-demo-db (catalog floor 20) |

## Current focus

1. **REQ-0105** — done
2. **Gate 2** — Sentry 24h post-deploy (REQ-0009)

## Session resume (every chat)

1. Read `.agile-v/STATE.md` + `.agile-v/REQUIREMENTS.md` + `.agile-v/PLAYBOOK.md`
2. Load skill: `.agile-v/skills/SKILLS_INDEX.md` (01 core → task skill)
3. Map work to REQ-XXXX; halt if missing traceability
4. Red Team: lint, test, test:invalidate, build before Gate 2 claim
5. Write-through DECISION_LOG, BUILD_MANIFEST, VALIDATION_SUMMARY on material changes
