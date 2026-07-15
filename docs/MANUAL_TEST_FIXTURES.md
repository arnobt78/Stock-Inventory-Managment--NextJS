# Manual test fixtures (copy-paste)

Use after a clean demo reset. Login as **admin** (`test@admin.com` / `12345678`) unless noted.

## 1. Reset DB (recommended before REQ-0102 smoke)

```bash
npm run script:reset-demo-db
```

Creates only:

| Account       | Email               | Password | Role     |
| ------------- | ------------------- | -------- | -------- |
| Test Admin    | <test@admin.com>    | 12345678 | admin    |
| Test Client   | <test@client.com>   | 12345678 | client   |
| Test Supplier | <test@supplier.com> | 12345678 | supplier |

Also creates global supplier entity **Test Supplier** (read-only in UI). No categories, warehouses, or products.

**Optional full catalog (skip manual steps 2–5):**

```bash
npx tsx scripts/lib/seed-demo-catalog.ts
```

---

## 2. Create order (admin UI)

1. Categories → Suppliers → Warehouses → Products (below)
2. Warehouse detail → **Allocate stock** per product
3. Orders → create order (pick warehouse per line if prompted)
4. Invoices → create from order → pay if testing stock decrement

---

## 3. Categories (2–3)

**Status:** Active = `true` (toggle on in UI)

### Category A — Headphone

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| Name        | `Headphone`                                        |
| Status      | Active                                             |
| Description | `Over-ear and on-ear headphones for demo browsing` |
| Notes       | `Primary category for audio SKUs`                  |

### Category B — Accessories

| Field       | Value                        |
| ----------- | ---------------------------- |
| Name        | `Accessories`                |
| Status      | Active                       |
| Description | `Cables, cases, and add-ons` |
| Notes       | `Secondary demo category`    |

### Category C — TV (inactive test)

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| Name        | `TV`                                        |
| Status      | **Inactive**                                |
| Description | `TVs and other electronics`                 |
| Notes       | `Use to test inactive filter on list pages` |

---

## 4. Suppliers (2 extra + pre-seeded)

**Test Supplier** already exists after reset — use it on products, or assign **Test Supplier** from the supplier dropdown.

### Supplier A — Acme Parts Co

| Field       | Value                                     |
| ----------- | ----------------------------------------- |
| Name        | `Acme Parts Co.`                          |
| Status      | Active                                    |
| Description | `Wholesale parts vendor for demo orders.` |
| Notes       | `Primary supplier for SKU ACM-*`          |

### Supplier B — Nordic Components

| Field       | Value                                   |
| ----------- | --------------------------------------- |
| Name        | `Nordic Components`                     |
| Status      | Active                                  |
| Description | `EU-based component supplier.`          |
| Notes       | `Use for multi-supplier product grids.` |

### Supplier C — Legacy Vendor (inactive)

| Field       | Value                        |
| ----------- | ---------------------------- |
| Name        | `Legacy Vendor`              |
| Status      | **Inactive**                 |
| Description | `Deprecated supplier row.`   |
| Notes       | `Inactive filter test only.` |

---

## 5. Warehouses (2–3)

**Type** dropdown values: `main` | `secondary` | `storage` | `distribution` | `retail` | `other`

### Warehouse A — Main Warehouse

| Field   | Value                                        |
| ------- | -------------------------------------------- |
| Name    | `Main Warehouse`                             |
| Address | `100 Demo Industrial Park, Austin, TX 78701` |
| Type    | `main` (Main Warehouse)                      |
| Status  | Active                                       |

### Warehouse B — Secondary Storage

| Field   | Value                               |
| ------- | ----------------------------------- |
| Name    | `Secondary Storage`                 |
| Address | `200 Backup Lane, Austin, TX 78702` |
| Type    | `secondary` (Secondary)             |
| Status  | Active                              |

### Warehouse C — Retail Floor (optional)

| Field   | Value                                |
| ------- | ------------------------------------ |
| Name    | `Retail Floor`                       |
| Address | `50 Market Street, Austin, TX 78703` |
| Type    | `retail` (Retail Store)              |
| Status  | Active                               |

---

## 6. Products (2–3)

Pick **Category** + **Supplier** from dropdowns after creating rows above. **SKU:** letters, numbers, hyphen, underscore only.

### Product A — Beats

| Field           | Value                                           |
| --------------- | ----------------------------------------------- |
| Name            | `Beats`                                         |
| SKU             | `BT23`                                          |
| Quantity        | `100`                                           |
| Price           | `49.00`                                         |
| Status          | `Available` (auto from qty)                     |
| Category        | `Headphone`                                     |
| Supplier        | `Test Supplier` or `Acme Parts Co.`             |
| Expiration date | `2026-12-31`                                    |
| Image URL       | _(optional)_ leave empty or any valid https URL |

### Product B — Sony

| Field           | Value            |
| --------------- | ---------------- |
| Name            | `Sony TV`        |
| SKU             | `SNC-1234`       |
| Quantity        | `200`            |
| Price           | `12.99`          |
| Category        | `Accessories`    |
| Supplier        | `Acme Parts Co.` |
| Expiration date | `2027-06-30`     |

### Product C — LG

| Field           | Value               |
| --------------- | ------------------- |
| Name            | `LG 4K`             |
| SKU             | `LGC-5678`          |
| Quantity        | `30`                |
| Price           | `34.50`             |
| Category        | `TV`                |
| Supplier        | `Nordic Components` |
| Expiration date | _(optional)_ empty  |

---

## 7. Stock allocations (REQ-0102 smoke)

After products exist, open **Warehouse detail** → **Allocate stock**.

Example split for **Demo Wireless Headphone** (catalog qty `100`):

| Warehouse         | Allocate qty | Notes                  |
| ----------------- | ------------ | ---------------------- |
| Main Warehouse    | `60`         |                        |
| Secondary Storage | `25`         |                        |
| _(unallocated)_   | `15`         | stays on catalog total |

**Tests to run:**

1. Lower product catalog qty in edit dialog (e.g. `100` → `80`) — confirm shrink dialog if unreserved units removed
2. Try lowering below reserved total — expect block / 409
3. Edit allocation row qty on warehouse detail
4. Delete warehouse with reserved stock — expect 409
5. Soft-delete product with order history — warehouse row shows **Archived**, read-only

---

## 8. Quick login reference

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Admin    | <test@admin.com>    | 12345678 |
| Client   | <test@client.com>   | 12345678 |
| Supplier | <test@supplier.com> | 12345678 |

**Supplier account:** products linked to **Test Supplier** appear under supplier portal **My Products**.

---

## 9. Troubleshooting (REQ-0103 / REQ-0106)

If catalog edit blocks at **40 reserved** after a **20-unit** warehouse-pick order, the DB may have stale double-reservation from before REQ-0103. Run `npm run reset-demo-db`, recreate fixtures, and retest — the floor should be **20**, not 40.

### Beats auto-assign order (REQ-0106)

Fixture: **Beats** catalog **50**, **Main Warehouse** allocated **30**, **20 unallocated**.

| Step | Role   | Action                                                                | Expected                                                                            |
| ---- | ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1    | Client | Create order — Beats qty **40**, warehouse **Auto-assign warehouses** | Order succeeds; list shows **10 available**, **40 reserved** (or committed display) |
| 2    | Client | Retry qty **40** with manual **Main Warehouse** pick                  | Blocked — max **30** at warehouse                                                   |
| 3    | Client | After step 1, auto-assign qty **40**                                  | Blocked — catalog available **10**                                                  |

Admin may optionally pick a warehouse; default remains auto-assign for all roles.

---

## 10. Cache coherence smoke (REQ-0133–0135)

Redeploy → **logout/login once** (1d cookie). Prefer Network: after write, GET must miss stale Redis. Then UI.

**A — Instant + no revert (core)**

| # | Action | Wait | Pass |
|---|--------|------|------|
| A1 | Edit product name/qty → list + detail + category/supplier grids | 0s + 5min tab away/back | No revert |
| A2 | Detail → Back to list | — | Updated row (no SSR clobber) |
| A3 | Hard reload after CRUD | — | Fresh; only auth may linger in persist |

**B — Redis pattern gaps (0135)**

| # | Action | Check elsewhere | Pass |
|---|--------|-----------------|------|
| B1 | Mark invoice **paid** (pending order) | Product/warehouse stock + allocations | No revert ~5min |
| B2 | Rename category | Allocation enrich `categoryName` | Updates |
| B3 | Rename supplier | Allocations + admin client portal | Updates |
| B4 | Warehouse CRUD | Admin supplier portal | Fresh |
| B5 | Register or Google OAuth new user | Admin client/supplier portal counts | Fresh |
| B6 | Product import | Portals + product lists | Fresh |

**C — Session / QR / idle (0134)**

| # | Action | Pass |
|---|--------|------|
| C1 | Create/edit product with QR | QR URL on detail after ImageKit (2nd wipe) |
| C2 | Idle tab ~30–60min then navigate | Lists load; session OK until 1d |
| C3 | Focus window | Session may refetch; **lists** do not mass-refetch |

**D — Roles (pick 1 entity each)** admin + client + supplier: order edit, invoice, warehouse allocate/transfer, review/ticket, history, notifications, home/portal stats — mutate → other open tabs/pages update without refresh.

If revert: Vercel log `Skipped stale cache re-warm`; confirm Redis env.

**UI bugs vs cache:** Fix blocking UI first (can't trust eyes). Then run A→B→C→D. Do **not** mix UI polish into cache pass/fail.
