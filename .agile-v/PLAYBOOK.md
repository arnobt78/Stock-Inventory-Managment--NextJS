# Agile V Playbook — stock-inventory

**Project:** Stockly Inventory (Next.js 16, React 19, Prisma/MongoDB)  
**Cycle:** C2 active (C1 Gate 2 PENDING)  
**Active:** REQ-0136 — Gate 2 UI explore + §10 A1/A2/B1 (`resume_token: gate2-0136-cache-smoke`)  
**Prod SHA:** `60f3280` · **Last:** REQ-0212 Vercel deploy unblock · **Session:** 2026-07-26 · **Standard:** Agile V 1.4 | Infinity Loop

---

## Session start (every chat)

1. Read `STATE.md` → cycle, gate, resume token, open backlog
2. Read `REQUIREMENTS.md` → map work to `REQ-XXXX` (halt if missing)
3. Load skills: `skills/SKILLS_INDEX.md` → **01** always; **17** for Next.js build; **19** before done; **23** for Sentry
4. Cursor rule: `.cursor/rules/agile-v-core.mdc` (`alwaysApply: true`)
5. On material change: write-through `DECISION_LOG.md`, `BUILD_MANIFEST.md`, `VALIDATION_SUMMARY.md`

---

## Infinity Loop (SCOPE-V)

```
Specify → Constrain → Orchestrate → Prove → Verify → Evolve
```

| Stage | Agent skills | Artifacts |
|-------|--------------|-----------|
| 1 Specify | 13, 14, 21, 22 | `REQUIREMENTS.md` |
| 2 Constrain | 15, 09 | Logic validation, impact |
| 3 Orchestrate | 16, 17, 18 | Code + `BUILD_MANIFEST.md` |
| 4 Prove | 17, 18, 23 | Tests, manifests, logs |
| 5 Verify | 19, 20, 07 | `VALIDATION_SUMMARY.md`, Red Team |
| Evolve | 03, 06 | `CHANGE_LOG.md`, `DECISION_LOG.md` |

**Red Team protocol:** Build agent does not self-verify. Run independently:

```bash
npm run lint && npm run test && npm run test:invalidate && npm run build
```

---

## Human gates

| Gate | Status (C1) | Prerequisite |
|------|-------------|--------------|
| Gate 1 (Blueprint) | APPROVED | `REQUIREMENTS.md` |
| Gate 2 (Release) | PENDING | `VALIDATION_SUMMARY.md` + `EVAL_RESULTS.md` eval_gate PASS |

**Gate 2 checklist:** Vercel prod SHA, Sentry 24h (REQ-0009), manual QA (REQ-0029, removeChild smoke).

On pause: append `CHECKPOINTS.md` with `resume_token`; resume only from `STATE.md` + matching `APPROVALS.md`.

---

## REQ workflow

1. **New work in C2+** → add `REQ-0030+` in `REQUIREMENTS.md` (never orphan artifacts)
2. **Bug fix, no REQ change** → Stage 3 re-entry (lifecycle skill 03)
3. **REQ change** → `CHANGE_LOG.md` CR → Gate 1 → full affected pipeline
4. Tag status: `done` | `verify` | `planned` | `approved [Cn]` | `new [Cn]`

---

## Architecture conventions (match codebase)

| Area | Rule |
|------|------|
| SSR | `export const dynamic = "force-dynamic"`; server logic in `page.tsx` |
| Client | Hooks, TanStack Query, Radix — only when required |
| CRUD | `invalidateAllRelatedQueries` on success |
| Delete | `cancelOrRemoveDetailQuery` then invalidate |
| API | Zod `safeParse` + `logger.warn` on 4xx; no Sentry for expected client errors |
| Selects | `DeferredSelectGate` / `PaginationSelector` for Radix portal safety |
| Dates | `ClientFormatDisplay` / stable formatters — no hydration-unsafe locale in SSR |
| Sentry | Tunnel `/api/monitoring`; scrub removeChild + translate noise |

---

## Cycle rules

- **C1:** REQ-0001…0029 code-complete; archive on Gate 2 acceptance → `cycles/C1/`
- **C2:** User-reported fixes, manual QA gaps → new REQs; see `STATE.md` Open backlog
- Living docs: write-through. Archives: frozen, never edit.

---

## Evidence summary (before Gate 2)

```
Scope: [built/verified] | Traceability: [REQ-IDs] | Findings: [PASS/FAIL]
Commands: lint, test, test:invalidate, build
```

---

## Quick reference

| File | Purpose |
|------|---------|
| `STATE.md` | Resume point, backlog, gate status |
| `REQUIREMENTS.md` | Canonical REQs |
| `BUILD_MANIFEST.md` | REQ → code mapping |
| `VALIDATION_SUMMARY.md` | Red Team + manual QA |
| `DECISION_LOG.md` | Append-only decisions |
| `POLICY.yaml` | Policy-as-code (git, secrets, REQ trace) |
| `skills/SKILLS_INDEX.md` | 24 agent skills |

**Upstream skills:** https://github.com/Agile-V/agile_v_skills
