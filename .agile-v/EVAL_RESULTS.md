# Eval Results — Gate 2 flywheel

**eval_gate_status:** PENDING

| Eval | REQ | Result | Date |
|------|-----|--------|------|
| lint | ALL | PASS | 2026-07-27 |
| statusAt unit | REQ-0136 | PASS (8) | 2026-07-27 |
| ssr-sync unit | REQ-0136 | PASS (30) | 2026-07-27 |
| invalidate | ALL | PASS (221) | 2026-07-27 |
| UI explore + §10 A1/A2/B1 | REQ-0136 | PASS | 2026-07-27 |
| Sentry 24h | REQ-0009 | PENDING | — |

**Gate 2 blocked until:** Sentry 24h after tip `db0bacf` Ready (REQ-0009). Prod smoke: badge no-revert + statusAt under Status column.

**Session 2026-07-27:** REQ-0136 Fix A/B + idle + statusAt + hydration shipped. Resume `gate2-sentry-24h`.
