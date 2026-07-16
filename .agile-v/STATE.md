# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (human UI explore → cache smoke) |
| **Last updated** | 2026-07-16 EOD |
| **Active REQ** | **REQ-0136** (UI mismatch + §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0145** |
| **Prod SHA** | `c62d364` feat / `fe5cbdc` docs — on `origin/main` |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — finish UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |

---

## Start here tomorrow (2026-07-17)

1. **Pull** `main` @ `fe5cbdc` (or later). Redeploy Vercel if prod ≠ this SHA.
2. **Continue human UI explore** (REQ-0136) — browse seeded pages; note mismatches.
3. **Do not start §10 A1/A2/B1** until UI explore + expected calculations feel OK.
4. Then: cache smoke only (§10 A1/A2/B1) → Gate 2 Sentry 24h.

**Re-seed if needed:** `npm run script:reset-demo-db -- --with-catalog`

---

## Done today (2026-07-16) — shipped

| REQ | Summary | SHA |
|-----|---------|-----|
| 0141–0143 | Cat/sup list+detail UI; nest-button; Owner·Buyer; category+invoice on recent orders | `9919eb0` |
| 0144 | Products hydration (`QR & Stock` plain `&`); ThemeProvider script filter; forecasting `gpt-4o-mini` | in `3c3a441` |
| 0145 | Orders: Status start-align; Invoice # col; product sky links; semantic paid/cancelled/refunded/due events; `orders:list:v3` | `c62d364` |

**Gates (latest):** lint ✓ · test **571** ✓ · invalidate **213** ✓ · build ✓

**Invalidation:** unchanged this wave — order graph / catalog patterns already cover list refresh after CRUD.

---

## Still open (do not reorder)

1. **Human UI + calc check** (REQ-0136 AC1–AC2) — remaining pages beyond orders/catalog polish
2. **Cache smoke** — `docs/MANUAL_TEST_FIXTURES.md` §10 **A1, A2, B1** only (no UI polish mixed in)
3. **Gate 2** — Sentry 24h after smoke PASS (REQ-0009)

**Pass rule:** A1/A2/B1 no stale revert → cache goal met.

---

## Session resume (every chat)

1. Read this file (resume token + tomorrow checklist)
2. Skills: `.agile-v/skills/SKILLS_INDEX.md` (01 → 17 → 19)
3. Map work to REQ-XXXX
4. Red Team before Gate 2 claim
5. Write-through DECISION / BUILD / VALIDATION on material changes
