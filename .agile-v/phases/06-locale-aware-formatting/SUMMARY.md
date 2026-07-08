# Phase 06 — Locale-aware formatting (REQ-0020)

**Status:** done | **Deploy:** pending push

## Delivered

- `lib/format/client-locale.ts` — browser Intl (USD, local TZ)
- `ClientCurrency` + `ClientCompactDateTime` — stable SSR, locale after mount
- `AdminMyActivityContent` + `AdminAnalyticsContent` updated
- Chart revenue tooltip uses `formatClientCurrency`
- `force-dynamic` on `app/admin/my-activity/page.tsx`

## Out of scope

BusinessInsightPage, SupplierPortalPage, TanStack invalidation.

## Red Team

lint · test · invalidate · build
