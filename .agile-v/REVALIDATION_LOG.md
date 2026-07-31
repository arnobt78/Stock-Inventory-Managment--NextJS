# Revalidation Log

| Date | Trigger | REQ-IDs | Result | Notes |
|------|---------|---------|--------|-------|
| 2026-07-31 | Densify parity portals/invoice/BI | REQ-0224 | PASS (automated) | lint ✓ tsc ✓ rollup 6 ✓ invalidate 222 ✓ |
| 2026-05-19 | Catalog Zod + barrel export deploy | REQ-0012 | PASS (automated) | lint/test(260)/invalidate/build green |
| 2026-05-19 | Notification bell code + prod reachability | REQ-0007 | PASS (code) | `NotificationBell` uses `DropdownMenu` portal |
| 2026-07-08 | REQ-0019 dashboard AI + hydration deploy | REQ-0019 | PASS (automated) | test 301; prod `4f02cf3` |
| 2026-07-09 | REQ-0021–0029 bulk push | REQ-0021–0029 | PASS (automated) | lint ✓ test 329 ✓ invalidate 202 ✓ build ✓; SHA `3ebb4db` |
| 2026-07-14 | Stock UX + dialog/UI closure | REQ-0114–0116 | PASS (automated) | lint ✓ test 498 ✓ invalidate 208 ✓ build ✓; pending manual §9 |

## REQ-0009 checklist (24h after deploy)

- [ ] Deploy SHA: `3ebb4db` (REQ-0022–0029 + REQ-0028 glass badges + REQ-0029 supplier detail)
- [ ] Sentry project **stock-inventory** — cases 1–7 vs baseline (`docs/SENTRY_ERRORS.md`)
- [ ] Case 1 `Product operation error:` — no new 4xx events (logger guard)
- [ ] Case 3 duplicate invoice — 409 only, no Sentry
- [ ] Case 4 OAuth `access_denied` — silent
- [ ] Case 6–7 `removeChild` — translate scrub only; real portal bugs → CAPA
- [ ] Supplier category link no longer 404 (REQ-0029)
- [ ] CAPA entry in `CAPA_LOG.md` if regression

## C2 manual QA (post-`3ebb4db`)

- [ ] Supplier: product detail → category link → read-only, scoped products
- [ ] Supplier: product detail → supplier link → own record, read-only
- [ ] Supplier: unrelated `/categories/{id}` → 404
- [ ] Admin/client: category/supplier detail unchanged
- [ ] Glass badges readable in dark mode on tables/dashboards
