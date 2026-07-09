# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 |
| **Phase** | `phases/07-shell-first-navigation` |
| **Infinity Loop stage** | Verify (REQ-0027 done) |
| **Last updated** | 2026-07-09 |
| **Active REQ range** | REQ-0001 … REQ-0029 |
| **Prod deploy target** | pending (REQ-0026 + REQ-0027 + REQ-0029) |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after REQ-0020 deploy |
| **Resume token** | — |

## Current focus

1. **REQ-0029** — done (supplier read-only category/supplier detail — Option B)
2. **REQ-0028** — done (scrollbar gutter, login form persist, table typography)
3. **Commit + deploy** — pending user

## Session resume (every chat)

1. Read `.agile-v/STATE.md` + `.agile-v/REQUIREMENTS.md`
2. Load skill: `.agile-v/skills/SKILLS_INDEX.md` (01 core → task skill)
3. Cursor rule active: `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`)
4. Red Team: `npm run lint && npm run test && npm run test:invalidate && npm run build`
5. Write-through on material change: `DECISION_LOG.md`, `BUILD_MANIFEST.md`, `VALIDATION_SUMMARY.md`

## Pipeline (V-model)

```
[Specify ✓] → [Constrain ✓] → [Orchestrate ✓] → [Prove ✓] → [Verify ◐] → [Evolve ◐]
```

## C1 completion snapshot

| Area | Status |
|------|--------|
| Sentry/Groq/Select (REQ-0001–0007) | code done; manual QA partial |
| Agile V bootstrap (REQ-0008) | done |
| Zod + 4xx logging (REQ-0010–0013) | done, 304 tests |
| Sentry chunk/order/oauth/radix (REQ-0014–0017) | done |
| Groq model chain (REQ-0018) | done |
| Admin AI + hydration (REQ-0019) | done |
| Locale-aware admin format (REQ-0020) | done |
| Shell-first nav + data-slot pulse (REQ-0021) | done |
| Tier-3 detail shell-first gap (REQ-0022) | done |
| Admin detail shell-first gap (REQ-0023) | done |
| Shell-first consistency + detail SSR + order DRY (REQ-0024) | done |
| TanStack invalidation | unchanged; 200 audit pass |
| Client owner dropdown | ProductOwnerSelect + product-owner filter; QA PASS |
| REQ-0027 perf polish | shallow ?ownerId= sync; admin client-list warm on / or /admin only |
