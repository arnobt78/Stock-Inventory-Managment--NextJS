# Eval Results — Gate 2 flywheel

**eval_gate_status:** PENDING

| Eval | REQ | Result | Date |
|------|-----|--------|------|
| lint | ALL | PASS | 2026-07-26 |
| tsc | REQ-0212 | PASS | 2026-07-26 |
| invalidate | ALL | PASS (221) | 2026-07-26 |
| build | ALL | PASS | 2026-07-26 |
| merge-densify | REQ-0212 | PASS (2) | 2026-07-26 |
| UI explore + §10 A1/A2/B1 | REQ-0136 | PENDING | — |
| Sentry 24h | REQ-0009 | PENDING | — |

**Gate 2 blocked until:** Human UI explore (REQ-0136) + §10 cache smoke + Sentry 24h. Tip after REQ-0212 push; prior Ready tip `1ec1e8a` (then Vercel Errors until 0212).

**Session 2026-07-26:** REQ-0212 deploy unblock done. Resume `gate2-0136-cache-smoke`.
