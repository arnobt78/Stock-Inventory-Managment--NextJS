# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C1 (closing) → **C2 open** |
| **Phase** | C2 — REQ-0082 **done** |
| **Infinity Loop stage** | Verify ✓ (Gate 2 open) |
| **Last updated** | 2026-07-12 (REQ-0082 category gap closure + forecast perf) |
| **Session** | **ACTIVE** — REQ-0082 complete |
| **Active REQ range** | REQ-0001 … REQ-0082 **done** |
| **Prod deploy target** | `ba69321` — REQ-0081 (REQ-0082 pending push) |
| **Human Gate 1** | APPROVED (retroactive bootstrap) |
| **Human Gate 2** | PENDING — Sentry 24h after prod deploy |
| **Resume token** | `REQ-0083-supplier-ui-sweep` — supplier role UX backlog |

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
12. **REQ-0041** — Catalog filter icons, chips, export chevron (code-complete)
13. **REQ-0042** — Catalog select inline + orders/invoices export chevron (code-complete)
14. **REQ-0043** — Unified filter chip row + reset (code-complete)
15. **REQ-0044** — Unified responsive typography scale (code-complete)
16. **REQ-0045** — Filter row UX + invoice status perf + header spacing (code-complete)
17. **REQ-0046** — Catalog toolbar parity + focus no-shift + hue rings (code-complete)
18. **REQ-0047** — Glass button tokens + Batch A/B page consistency (code-complete)
19. **REQ-0048** — Auth light mode + dialog tables + order product thumbs (code-complete)
20. **REQ-0049** — Dialog UX polish: dual-theme tables, glass CTAs, submit gates (code-complete)
21. **REQ-0050** — Glass shell-reset Batch B + dialog table titles + review submits (code-complete)
22. **Hotfix** — CTA gradient restore `73060a1` (auth + page buttons; SHELL_RESET fix)
23. **REQ-0051** — glass consistency backlog (planned — see handoff)
24. **REQ-0052** — post-mutation deferred cache (`after()`) (code-complete, **uncommitted**)
25. **REQ-0053** — scoped warehouse/stock Redis invalidation (code-complete, **uncommitted**)
26. **REQ-0054** — scoped invalidation sweep, all 32 write routes (code-complete, **uncommitted**)
27. **REQ-0055** — fix Redis race condition (sync await, not `after()`) + stale-UI fix (code-complete, **uncommitted**)
28. **REQ-0056** — demo DB reset script + DRY seed source (code-complete, **uncommitted**)
29. **REQ-0057** — back-button sweep + router.refresh() elimination (code-complete, **uncommitted**)
30. **REQ-0058** — CopyableText for order/invoice numbers everywhere (code-complete, **uncommitted**)
31. **REQ-0059** — ProductThumb on detail line items / allocations / catalog grids (code-complete, **uncommitted**)
32. **REQ-0060** — OrderPickerCommand searchable invoice-dialog picker (code-complete, **uncommitted**)
33. **REQ-0061** — situation-based invoice actions on orders (+ invoiceForOrder on list rows) (code-complete, **uncommitted**)
34. **REQ-0062** — order actions in invoice table + role gating (done)
35. **REQ-0063** — detail copy + invoice line items parity (done)
36. **C2 backlog** — Gate 2 + manual QA + push REQ-0063 (see below)

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
| Red Team (latest) | lint ✓ test 343 ✓ invalidate 202 ✓ build ✓ (`73060a1` hotfix 2026-07-10) |
| PLAYBOOK.md | active — session ops guide |

## Recent commits (last ~3 days)

| SHA | REQ | Summary |
|-----|-----|---------|
| `73060a1` | hotfix | Restore glass CTA gradients — auth + page buttons; SHELL_RESET no bg-transparent |
| `3c01ad1` | REQ-0049/0050 | Dialog glass polish — tables, CTAs, submit gates, shell-reset |
| `9aa2f1e` | REQ-0048 | Auth light mode, dialog tables, order product thumbs |
| `3ebb4db` | REQ-0022–0029 | Detail SSR, glass badges, supplier catalog detail |

## Session handoff (2026-07-11 — pick up next)

**Found on resume:** working tree had REQ-0055 (Redis race fix, sync-await invalidation) code-complete with gates already logged in `DECISION_LOG.md` (test 352) but **not committed**. Also found untracked demo-DB-reset refactor (`lib/auth/demo-seed-users.ts`, `scripts/lib/delete-all-db-data.ts`, `scripts/reset-demo-db.ts`) with no REQ — assigned **REQ-0056** for traceability (Directive 2), reviewed diffs, confirmed coherent/complete.

**Re-verified Red Team (2026-07-11):** lint ✓ test 352 ✓ invalidate 202 ✓ build ✓; `tsc --noEmit` clean on touched scripts.

**Next action:** push REQ-0063, confirm Vercel prod SHA, resume REQ-0051 glass backlog.

**REQ-0063 (2026-07-11 PM):** invoice detail linked order line items (`linkedOrderItems` via widened enrichInvoice query — no extra DB round-trip); `ProductLineItemsList` shared with `OrderItemsCard`; CopyableText on shipping order#/tracking; Related Order shows order # + admin-aware href. Gates: lint ✓ test 356 ✓ invalidate 202 ✓ build ✓.

**Do NOT repeat:** don't re-derive REQ-0073/0074 — shipped `188e8ae`+`578999f`; gates lint ✓ test 384 ✓ invalidate 206 ✓ build ✓.

## Session handoff (2026-07-12 — ACTIVE)

**Yesterday shipped (2026-07-11 PM):** REQ-0073 + REQ-0074. Commits: `8fdd937`/`95446fd` (0073), `188e8ae`/`578999f`/`ce7c80b` (0074 + chart type fix + backlog docs). **main = origin/main** at `ce7c80b`.

**Red Team re-verified (2026-07-12):** lint ✓ test 384 ✓ invalidate 206 ✓ build ✓

**Next — REQ-0075 (planned, spec in REQUIREMENTS.md):**
1. **P1** Supplier product detail — warehouse count/allocations mismatch ("no warehouse" when stock exists)
2. **P1** Supplier table action menu — invoice/create actions gating review
3. **P2** Static pages UI parity — remove/email, API status, docs (`PageSectionHeader` + icon row)
4. **P2** Admin detail pages consistency pass (icons, cards, spacing)
5. **P2** AdminOrderDetailContent — split Order/Payment status rows (REQ-0074 gap)

**Invalidation:** REQ-0075 likely SSR/data fix for supplier warehouse display (AC1–AC2); UI-only for AC3–AC5 — no TanStack registry changes unless new queries added.

---

## Session handoff (2026-07-10 — pick up tomorrow)

**Done today:** REQ-0049/0050 pushed; user smoke OK on auth + toolbar CTAs; hotfix `73060a1` (Login kept `GLASS_PRIMARY_BUTTON.sky`; Register → `AUTH_SUBMIT_BUTTON_EMERALD`; page Save/Refresh/Export restored; `GLASS_BUTTON_SHELL_RESET` no longer uses `bg-transparent`).

**Do NOT repeat:** Do not put `bg-transparent` + `GLASS_PRIMARY_BUTTON` together; do not shell-reset Login/Register CTAs.

**REQ-0051 next (CSS only):** Migrate remaining inline glass gradients → tokens + smoke light/dark:

| Area | Files |
|------|-------|
| Detail page CTAs | `OrderDetailPage`, `InvoiceDetailPage`, `CategoryDetailPage`, `WarehouseDetailPage` |
| FABs | `FloatingActionButtons.tsx` |
| Batch A leftover | `ShippingManagement.tsx` |
| Review cancel | `WriteEditReviewDialog` cancel → `GLASS_GHOST_BUTTON` |
| Dialog smoke | Batch B dialogs still use `variant="ghost"` + SHELL_RESET — verify gradients OK post-hotfix |

**Out of scope:** TanStack, SSR, API, invalidation.

## Open backlog (C2 — fix next, updated 2026-07-11 PM)

| ID | Priority | Item | REQ / notes |
|----|----------|------|-------------|
| OB-009 | P0 | Push `main` (REQ-0073+0074) | **done** — `ce7c80b` synced |
| OB-010 | P0 | Sentry 24h after prod deploy | REQ-0009 |
| OB-011 | P1 | Supplier product detail warehouse mismatch | **REQ-0075 AC1** |
| OB-012 | P1 | Supplier table action menu gating | **REQ-0075 AC2** |
| OB-013 | P2 | Static pages header parity | **REQ-0075 AC3** |
| OB-014 | P2 | Admin detail pages consistency | **REQ-0075 AC4** |
| OB-015 | P2 | AdminOrderDetailContent status rows | **REQ-0075 AC5** |
| OB-001 | P0 | Confirm Vercel prod SHA post-push | deploy — verify `ce7c80b` |
| OB-008 | P2 | Glass consistency sweep | REQ-0051 |
| OB-003 | P1 | Manual QA: supplier `/products` → category/supplier links | REQ-0029 |
| OB-004 | P1 | Manual QA: removeChild nav smoke | REQ-0001 |

**Rule:** New fixes → new REQ-0030+ in C2; do not expand C1 without traceability.
