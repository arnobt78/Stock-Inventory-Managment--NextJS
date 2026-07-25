# Agile V — Project State

| Field | Value |
|-------|-------|
| **Cycle** | C2 (C1 Gate 2 still PENDING) |
| **Phase** | Stage 3–4 — **REQ-0136** next |
| **Stopped** | 2026-07-25 — REQ-0209…0211 shipped |
| **Session** | 2026-07-25 — resume Gate 2 |
| **Active REQ** | **REQ-0136** (Gate 2 / cache smoke) |
| **Done range** | REQ-0001…0135 + 0137–0187 + 0188–**0211** |
| **Prod SHA** | `a7d8e7c` (REQ-0209…0211) |
| **Human Gate 1** | APPROVED (GATE-0001) |
| **Human Gate 2** | PENDING — §10 smoke → Sentry 24h |
| **Resume token** | `gate2-0136-cache-smoke` → **REQ-0136** |
| **CHECKPOINTS** | none PENDING |

---

## Next (start here)

1. **REQ-0136 AC1–2** — Human UI explore (remaining)
2. **REQ-0136 AC3–5** — §10 A1 / A2 / B1 cache smoke
3. Record → Sentry 24h (**REQ-0009**) → Gate 2

**Skills:** 01 · 02 · 03 · 06 · 07 · 17 · 19 · 23

---

## Shipped 2026-07-25

| REQ | One-liner |
|-----|-----------|
| 0211 | Shippo test-key silent US to + USPS; canShip confirm/partial/paid |
| 0210 | Cancel→invoice patch; billing/shipping; cancelled read-only; pay due fix |
| 0209 | Stripe return; confirm+fulfill on first money; Cancel vs Process Refund |
| 0208 | Admin order detail parity + Parties User ID + shared action bar |
