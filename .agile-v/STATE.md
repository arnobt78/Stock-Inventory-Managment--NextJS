# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 |
| **Phase** | `phases/07-shell-first-navigation` |
| **Infinity Loop stage** | Verify (REQ-0021 done) |
| **Last updated** | 2026-07-08 |
| **Active REQ range** | REQ-0001 … REQ-0021 |
| **Prod deploy target** | pending (REQ-0021) |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after REQ-0020 deploy |
| **Resume token** | — |

## Current focus

1. **REQ-0021** — shell-first navigation + data-slot pulse skeletons (done)
2. **Human Gate 2** — Sentry 24h after REQ-0021 deploy

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
| TanStack invalidation | unchanged; 200 audit pass |
