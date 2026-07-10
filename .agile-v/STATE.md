# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 (closing) → **C2 open** |
| **Phase** | `phases/07-shell-first-navigation` → C2 backlog |
| **Infinity Loop stage** | Verify ◐ (code done; Human Gate 2 + manual QA open) |
| **Last updated** | 2026-07-10 |
| **Session** | ACTIVE — Agile V bootstrap resume |
| **Active REQ range** | REQ-0001 … REQ-0040 (REQ-0040 code-complete) |
| **Prod deploy target** | `3ebb4db` (pushed `main` 2026-07-09) — confirm Vercel SHA |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after prod deploy |
| **Resume token** | `C2-fix-backlog` — see **Open backlog** below |

## Current focus

1. **REQ-0021–0029** — code done; pushed `3ebb4db`
2. **Human Gate 2** — deploy confirm + Sentry 24h (REQ-0009)
3. **REQ-0032** — auth glass parity, flat list, BG animation (code-complete)
4. **REQ-0033** — auth copy, scroll shift, icon glow, spacing (code-complete)
5. **REQ-0034** — auth welcome/goodbye session toasts (code-complete)
6. **REQ-0035** — Google OAuth welcome toast (code-complete)
7. **REQ-0036** — App shell full bleed; auth max-w-7xl only (code-complete)
8. **REQ-0037** — Product status filter glass badges (code-complete)
9. **REQ-0038** — SafeImage rollout (code-complete)
10. **REQ-0039** — Navbar Google avatar SafeAvatarImage (code-complete)
11. **REQ-0040** — Avatar URL DRY reviews/tickets (code-complete)
12. **C2 backlog** — user-reported issues + manual QA gaps (see below)

## Session resume (every chat)

1. Read `.agile-v/STATE.md` + `.agile-v/REQUIREMENTS.md` + `.agile-v/PLAYBOOK.md`
2. Load skill: `.agile-v/skills/SKILLS_INDEX.md` (01 core → task skill)
3. Cursor rule: `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`)
4. Red Team: `npm run lint && npm run test && npm run test:invalidate && npm run build`
5. Write-through on material change: `DECISION_LOG.md`, `BUILD_MANIFEST.md`, `VALIDATION_SUMMARY.md`

## Pipeline (V-model)

```
[Specify ✓] → [Constrain ✓] → [Orchestrate ✓] → [Prove ✓] → [Verify ◐] → [Evolve ◐]
```

## C1 completion snapshot (2026-05-19 → 2026-07-09)

| Area | Status |
|------|--------|
| Sentry/Groq/Select (REQ-0001–0007) | code done; manual QA partial |
| Agile V bootstrap (REQ-0008) | done |
| Zod + 4xx logging (REQ-0010–0013) | done |
| Sentry chunk/order/oauth/radix (REQ-0014–0017) | done |
| Groq model chain (REQ-0018) | done |
| Admin AI + hydration (REQ-0019) | done |
| Locale-aware admin format (REQ-0020) | done |
| Shell-first nav + data-slot pulse (REQ-0021) | done — `733681a` |
| Tier-3 detail shell-first (REQ-0022) | done |
| Admin detail shell-first (REQ-0023) | done |
| Detail SSR prefetch + order DRY (REQ-0024/0025) | done |
| P3 SSR gaps + client browse (REQ-0026) | done |
| Perf polish shallow ownerId + warm (REQ-0027) | done |
| UI glass badges + tables + invoices (REQ-0028) | done |
| Supplier catalog detail Option B (REQ-0029) | done — `3ebb4db` |
| TanStack invalidation | unchanged; 202 audit pass |
| Red Team (latest) | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ (2026-07-10 REQ-0040) |
| PLAYBOOK.md | active — session ops guide |

## Recent commits (last ~3 days)

| SHA | REQ | Summary |
|-----|-----|---------|
| `733681a` | REQ-0021 | Shell-first nav + DataSlotPulse |
| `3ebb4db` | REQ-0022–0029 | Detail SSR, glass badges, invoices, supplier catalog detail, UI polish (338 files) |

## Open backlog (C2 — fix next)

| ID | Priority | Item | REQ / notes |
|----|----------|------|-------------|
| OB-001 | P0 | Confirm Vercel prod SHA = `3ebb4db` | deploy |
| OB-002 | P0 | Sentry 24h regression watch | REQ-0009 checklist in `REVALIDATION_LOG.md` |
| OB-003 | P1 | Manual QA: supplier `/products` → category/supplier links | REQ-0029 |
| OB-004 | P1 | Manual QA: removeChild nav smoke (products↔orders×10) | REQ-0001, REQ-0006 |
| OB-005 | P2 | Broken product `imageUrl` 404s in UI | data/ImageKit — not REQ-0029 |
| OB-006 | P2 | User-reported issues from live testing | _capture per session in CAPA_LOG_ |
| OB-007 | P3 | Optional: `use-deferred-radix-select.test.ts` | known gap OK |

**Rule:** New fixes → new REQ-0030+ in C2; do not expand C1 without traceability.
