# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–5 — **REQ-0136** (UI explore → cache smoke) |
| **Last updated** | 2026-07-17 audit+ship REQ-0146–0149 |
| **Active REQ** | **REQ-0136** (UI explore → §10 A1/A2/B1) |
| **Done range** | REQ-0001 … REQ-0135 + REQ-0137–**0149** |
| **Prod SHA** | `61c1e79` (REQ-0146–0149) on `origin/main` · prior `c62d364` |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING (GATE-0002) — UI explore → §10 → Sentry 24h |
| **Resume token** | `tomorrow-UI-then-cache` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Active session (2026-07-17)

**Agile V activated:** core + pipeline loaded; `.agile-v/` intact (no re-bootstrap needed).

**Skills this session:** 01 core · 02 pipeline · 06 PO · 14/15 when new mismatches → REQ · 17 build-js · 19 red-team · 23 Sentry · 24 release after Gate 2.

### Resume order (do not reorder)

1. **Human UI + calc explore** (REQ-0136 AC1–AC2) — report mismatches → fix under new/child REQs
2. **Cache smoke** — §10 **A1, A2, B1** only (`docs/MANUAL_TEST_FIXTURES.md`)
3. **Gate 2** — Sentry 24h (REQ-0009) after smoke PASS

**Pass rule:** A1/A2/B1 no stale revert → cache goal met. Do **not** mix UI polish into cache pass/fail.

**Re-seed:** `npm run script:reset-demo-db -- --with-catalog`

---

## Shipped park (2026-07-16)

| REQ | Summary | SHA |
|-----|---------|-----|
| 0141–0143 | Cat/sup list+detail; nest-button; Owner·Buyer; category+invoice recent orders | `9919eb0` |
| 0144 | Products hydration plain `&`; ThemeProvider script filter; forecasting `gpt-4o-mini` | `3c3a441` |
| 0145 | Orders Invoice #; product links; SemanticEventDate; `orders:list:v3` | `c62d364` |
| 0146–0149 | Order detail polish batch | `61c1e79` |

**Gates:** lint ✓ · test **573** ✓ · invalidate **213** ✓ · build ✓ · pushed `61c1e79`

---

## Session resume (every chat)

1. Read this file (resume token + checklist)
2. Skills: `skills/SKILLS_INDEX.md` — **01** always; **02** pipeline; **17** Next.js; **19** before done
3. Map work to `REQ-XXXX` — halt if missing
4. Red Team: `lint` · `test` · `test:invalidate` · `build`
5. Write-through DECISION / BUILD / VALIDATION on material changes
