# Phase 05 — Dashboard AI + hydration (REQ-0019)

**Status:** done | **Deploy:** pending push

## Delivered

- `LLM_INSIGHTS_MAX_TOKENS=512` shared by `/api/ai/insights` + `/api/forecasting`
- Redis cache key `forecasting:summary:v2:*` busts truncated AI cache
- `formatStableCurrency` + `formatStableCompactDateTime` (UTC) in `AdminAnalyticsContent`
- `force-dynamic` on `app/admin/dashboard-overall-insights/page.tsx`

## Out of scope

TanStack invalidation, Sentry 4xx warn noise, `AdminMyActivityContent` (same pattern, optional follow-up).

## Red Team

lint · test · invalidate · build
