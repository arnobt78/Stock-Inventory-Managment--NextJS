# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136 in progress** (UI mismatch → cache smoke) |
| **Last updated** | 2026-07-16 |
| **Active REQ** | **REQ-0136** (UI mismatch + §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0143** |
| **Prod SHA** | `b358ae5` (REQ-0141–0142) — REQ-0143 local pending push |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — short QA (REQ-0136) + Sentry 24h |
| **Resume token** | `tomorrow-QA` → active as **REQ-0136** |

## Session resume (2026-07-16)

**REQ-0143 done:** detail Owner·Supplier/Buyer dots; recent-orders category + invoice indicator.

**REQ-0142 done:** supplier nest-button fix; Supplier & Email layout; Products HelpTooltip; userId-scoped counts; detail iconTile.

**REQ-0141 done:** category/supplier list product counts + email; detail Status strip removed; product grid SKU/category; stock pie companion.

**REQ-0140 done:** seed Beats reserved=0 (no double-book); sold stats delivered|paid; insights qty−committed. Re-seed local DB with `--with-catalog` after pull.

**Pipeline stage:** Human UI explore → Specify mismatches under REQ-0136 → Orchestrate fixes → §10 A1/A2/B1.

### Order of work (do not reorder)

1. **Human:** browse each page with seeded data; report UI mismatches
2. **UI blockers** — fix under REQ-0136
3. **Cache smoke** — §10 **A1, A2, B1** only
4. Gate 2 — Sentry 24h after smoke PASS

**Pass rule:** A1/A2/B1 no revert → cache goal met. Do **not** mix UI polish into cache pass/fail.

**Re-seed:** `npm run script:reset-demo-db -- --with-catalog` or accounts-only then `npm run script:seed-demo-catalog`

## Current focus

1. Collect / fix remaining UI mismatches (REQ-0136 AC1–AC2)
2. §10 A1/A2/B1 (REQ-0136 AC3–AC5)
3. Gate 2 — after smoke PASS: prod confirm + Sentry 24h (REQ-0009)

## Session resume (every chat)

1. Read `.agile-v/STATE.md` (resume token + checklist)
2. Load skill: `.agile-v/skills/SKILLS_INDEX.md` (01 core → 17 build-js → 19 red-team)
3. Map work to REQ-XXXX; halt if missing traceability
4. Red Team: lint, test, test:invalidate, build before Gate 2 claim
5. Write-through DECISION_LOG, BUILD_MANIFEST, VALIDATION_SUMMARY on material changes
