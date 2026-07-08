# Build Manifest — Cycle C1

**Cycle:** C1 | **Risk:** R2 | **Stack:** Next.js 16 / Prisma / MongoDB

## Artifacts (selected)

| ART-ID | REQ-ID | Location | Notes |
|--------|--------|----------|-------|
| ART-0001 | REQ-0001 | `hooks/use-deferred-radix-select.ts` | Defer Radix Select mount |
| ART-0002 | REQ-0001 | `components/shared/DeferredSelectGate.tsx` | Reusable gate |
| ART-0003 | REQ-0001 | `components/shared/PaginationSelector.tsx` | Table page-size |
| ART-0004 | REQ-0001 | `components/orders/OrderDialog.tsx` | Dialog Select gates |
| ART-0005 | REQ-0001 | `components/products/ProductFormDialog.tsx` | Dialog Select gates |
| ART-0006 | REQ-0001 | `components/invoices/InvoiceDialog.tsx` | Dialog Select gates |
| ART-0007 | REQ-0002 | `lib/ai/openrouter.ts` | OpenRouter client |
| ART-0008 | REQ-0005, REQ-0018 | `lib/ai/groq.ts` | Groq chain + resolveGroqModel + failover |
| ART-0009 | REQ-0005 | `lib/ai/create-chat-completion.ts` | Orchestrator |
| ART-0010 | REQ-0005 | `lib/ai/types.ts` | Shared LLM types |
| ART-0011 | REQ-0002, REQ-0005 | `app/api/ai/insights/route.ts` | Insights API |
| ART-0012 | REQ-0005 | `app/api/forecasting/route.ts` | Forecasting AI helper |
| ART-0013 | REQ-0003 | `lib/auth/unique-username.ts` | OAuth username |
| ART-0014 | REQ-0003 | `app/api/auth/oauth/google/callback/route.ts` | P2002 recovery |
| ART-0015 | REQ-0004 | `app/page.tsx` | SSR home, no Suspense |
| ART-0016 | REQ-0007 | `components/shared/NotificationBell.tsx` | DropdownMenu portal |
| ART-0017 | REQ-0007 | `components/shared/NotificationDropdown.tsx` | Panel content |
| ART-0018 | REQ-0007 | `components/layouts/Navbar.tsx` | overflow fix |
| ART-0019 | REQ-0008 | `.agile-v/*` | Agile V state |
| ART-0020 | REQ-0008 | `.cursor/rules/agile-v-core.mdc` | Cursor rule |
| ART-0021 | REQ-0010 | `lib/validations/product.ts` | Product body schemas |
| ART-0022 | REQ-0010 | `app/api/products/route.ts` | POST/PUT safeParse |
| ART-0023 | REQ-0011 | `lib/logger.ts`, `lib/api/errors.ts` | 4xx Sentry guard |
| ART-0024 | REQ-0011 | `lib/api/response-helpers.ts` | warn on 4xx |
| ART-0025 | REQ-0012 | `lib/validations/{category,supplier,warehouse}.ts` | Catalog schemas |
| ART-0026 | REQ-0012 | `docs/SENTRY_ERRORS.md` | Audit doc tracked |
| ART-0027 | REQ-0013 | `lib/validations/{payment,shipping,notification,system-config,ai}.ts` | API Zod sweep |
| ART-0028 | REQ-0013 | `app/api/{payments,shipping,notifications,auth,ai}/*` | safeParse routes |
| ART-0029 | REQ-0018 | `docs/LLM_MODEL_SELECTION.md` | Stock-inventory Groq chain section |
| ART-0030 | REQ-0019 | `lib/ai/constants.ts` | LLM_INSIGHTS_MAX_TOKENS |
| ART-0031 | REQ-0019 | `lib/date/format-stable.ts` | Stable currency + UTC datetime |
| ART-0033 | REQ-0020 | `lib/format/client-locale.ts` | Browser Intl formatters |
| ART-0034 | REQ-0020 | `components/shared/ClientFormatDisplay.tsx` | ClientCurrency + ClientCompactDateTime |
| ART-0035 | REQ-0021 | `components/shared/DataSlotPulse.tsx` | Inline value pulse |
| ART-0036 | REQ-0021 | `lib/react-query/is-data-slot-loading.ts` | Loading predicate |
| ART-0037 | REQ-0021 | `components/ui/table-data-skeleton.tsx` | TableBodyPulseRows |
| ART-0038 | REQ-0021 | `app/**/page.tsx` (tier 1+2) | Suspense shell + streamed data |
| ART-0039 | REQ-0021 | `hooks/queries/*` | initialData on list/dashboard hooks |

## Tests

| TC-ID | REQ-ID | Location |
|-------|--------|----------|
| TC-0001 | REQ-0002 | `lib/ai/openrouter.test.ts` |
| TC-0002 | REQ-0005 | `lib/ai/groq.test.ts` |
| TC-0003 | REQ-0005 | `lib/ai/create-chat-completion.test.ts` |
| TC-0004 | REQ-0003 | `lib/auth/unique-username.test.ts` |
| TC-0005 | REQ-0010 | `lib/validations/product-api.test.ts` |
| TC-0006 | REQ-0011 | `lib/logger.test.ts`, `lib/api/errors.test.ts` |
| TC-0007 | REQ-0012 | `lib/validations/{category,supplier,warehouse}-api.test.ts` |
| TC-0008 | REQ-0013 | `lib/validations/{payment,shipping,notification,system-config,ai,auth}-api.test.ts` |
| TC-0009 | REQ-0019 | `lib/date/format-stable.test.ts` |
| TC-0010 | REQ-0020 | `lib/format/client-locale.test.ts` |
