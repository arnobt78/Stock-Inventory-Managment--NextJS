# Change Log — Agile V Cycles

## C1 (2026-05-19 → 2026-07-09, code-complete)

| Date | Change | REQ-IDs |
|------|--------|---------|
| 2026-05-19 | Sentry remediation: removeChild, OAuth, hydration, OpenRouter 402 | REQ-0001..0004 |
| 2026-05-28 | Groq fallback + remaining DeferredSelectGate | REQ-0005, REQ-0006 |
| 2026-05-28 | Notification dropdown portal fix | REQ-0007 |
| 2026-05-28 | `.agile-v/` bootstrap + Cursor agile-v-core rule | REQ-0008 |
| 2026-05-19 | Products Zod + 4xx Sentry logger | REQ-0010, REQ-0011 |
| 2026-05-19 | Catalog Zod (cat/supplier/warehouse) + API barrel | REQ-0012 |
| 2026-05-19 | Remaining API Zod sweep (payment/shipping/auth/AI) | REQ-0013 |
| 2026-06-27 | ChunkLoadError reload + OrderDialog logger.warn | REQ-0014, REQ-0015 |
| 2026-07-08 | OAuth warn, Groq chain, forecasting tokens, locale format | REQ-0016–0020 |
| 2026-07-08 | Shell-first nav + DataSlotPulse | REQ-0021 (`733681a`) |
| 2026-07-08–09 | Detail SSR prefetch, order DRY, P3 SSR, client browse | REQ-0022–0026 |
| 2026-07-09 | Shallow ownerId URL + deferred admin warm | REQ-0027 |
| 2026-07-09 | Glass badges, invoice scope, table typography, login persist | REQ-0028 |
| 2026-07-09 | Supplier read-only category/supplier detail Option B | REQ-0029 (`3ebb4db`) |

## C2 (2026-07-09 → open)

| Date | Change | REQ-IDs |
|------|--------|---------|
| 2026-07-10 | Auth UX: role Select icons, max-w-7xl shell, stagger anim | REQ-0030 |
| 2026-07-10 | Auth left panel: brand header + flat list (removed AuthPromoCard) | REQ-0031 |
| 2026-07-10 | Auth glass form, flat list rows, BG float animation | REQ-0032 |
| 2026-07-10 | Auth polish: pro copy, scroll gutter, icon glow, tight spacing | REQ-0033 |
| 2026-07-10 | Auth welcome/goodbye session toasts fix | REQ-0034 |
| 2026-07-10 | Google OAuth welcome toast on role destinations | REQ-0035 |
| 2026-07-10 | App shell full bleed; shared shell-layout tokens; auth max-w-7xl only | REQ-0036 |
| 2026-07-10 | Product status filter glass badges (ProductStockStatusBadge) | REQ-0037 |
| 2026-07-10 | SafeImage rollout — all UI images + SafeAvatarImage | REQ-0038 |
| 2026-07-10 | Navbar/Sidebar SafeAvatarImage + shared avatar resolver | REQ-0039 |
| 2026-07-10 | Avatar URL DRY — resolveAvatarSourcesFromSeed for reviews/tickets | REQ-0040 |
| 2026-07-10 | Catalog filter icons, dismissible chips, export chevron | REQ-0041 |
| 2026-07-10 | Catalog select inline layout; orders/invoices export chevron | REQ-0042 |
| 2026-07-10 | Unified filter chip row + reset on all list filters | REQ-0043 |
| 2026-07-10 | Unified responsive typography scale + gap fixes (zero text-xl) | REQ-0044 |
| 2026-07-10 | Filter row UX, invoice status client-side filter, header spacing | REQ-0045 |
| 2026-07-10 | Catalog filter/export toolbar px-4 gap-2 sm:w-auto parity | REQ-0046 |
| 2026-07-10 | Focus no-shift + hue rings; dialog-form-field token sweep | REQ-0046 |
| 2026-07-10 | Glass button tokens; Batch A/B migrations; Email prefs polish | REQ-0047 |
| 2026-07-10 | Auth light mode; dialog table tokens; order product thumbs | REQ-0048 |
| 2026-07-10 | Dialog table dual-theme; glass CTA fix; submit gates; column slim | REQ-0049 |
| 2026-07-10 | Glass shell-reset Batch B; dialog table titles; review submit tokens | REQ-0050 |
| 2026-07-10 | Hotfix: restore CTA gradients; AUTH_SUBMIT_BUTTON_EMERALD; SHELL_RESET fix | `73060a1` |
| 2026-07-11 | REQ-0064–0067 polish, warehouse integration, AI insights | REQ-0064–0067 |
| 2026-07-11 | REQ-0066 hardening: avail sync, role gates | `86421b8` |
| 2026-07-11 | REQ-0068 picking + pre-test gaps | `72647ed` |
| 2026-07-11 | Dead-code: unused deleteCache + getRateLimitStatus | `f892b65` |
| 2026-07-13 | Admin portal UI parity — glow badges, dashboard CTAs, portal avatars, notifications | REQ-0098 |
| 2026-07-13 | Analytics gap-6; supplier portal userId/image SSR; dead stock scripts removed | REQ-0099 |
| 2026-07-13 | Supplier portal avatar seed fallback `userId ?? id` (stale Redis guard) | REQ-0100 |
| 2026-07-13 | Stock allocation sync — catalog reconcile, unified enrich, warehouse guards, archived rows | REQ-0102 `554af8e` |
| 2026-07-13 | Disjoint order reservation — fix double-count floor; committedQuantity list enrich | REQ-0103 |
| 2026-07-13 | committedQuantity parity — detail SSR, forecast, supplier dashboard | REQ-0104 |
| 2026-07-14 | Order stock UX workflow — auto-assign, reactive validation, fetch DRY | REQ-0106–0113 |
| 2026-07-14 | Stock UX + dialog/UI closure — proportional pricing, labels, typography | REQ-0114–0116 |
