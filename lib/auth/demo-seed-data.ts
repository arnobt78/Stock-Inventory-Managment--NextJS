/**
 * REQ-0088 / REQ-0091 / REQ-0092 — canonical demo seed fixtures for reset-demo-db + create-demo-accounts.
 * Demo users and global supplier entity share Test Admin / Test Client / Test Supplier naming.
 */

import { DEFAULT_EMAIL_PREFERENCES } from "@/types/auth";
import { DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";

/** Global supplier entity linked to test@supplier.com; isGlobalDemo keyed on userId, not name. */
export const DEMO_SUPPLIER_ENTITY = {
  name: "Test Supplier",
  description:
    "Global Test Supplier linked to test@supplier.com. All admins can assign products to this supplier; the supplier account can view My Products and View Orders. This supplier cannot be edited, duplicated, or deleted from the UI.",
  notes:
    "Use Test Supplier when creating products to see them under test@supplier.com's My Products. Orders that include these products will appear in that account's View Orders.",
  status: true,
} as const;

/** Legacy entity name before REQ-0091 — backfilled by create-demo-accounts on existing DBs. */
export const LEGACY_DEMO_SUPPLIER_NAME = "Demo Supplier";

/** Default email notification prefs stored on demo user rows at seed time. */
export const DEMO_USER_EMAIL_PREFERENCES = DEFAULT_EMAIL_PREFERENCES;

export type DemoCatalogCategorySeed = {
  name: string;
  description: string;
  notes: string;
  status: boolean;
};

export type DemoCatalogWarehouseSeed = {
  name: string;
  address: string;
  type: string;
  status: boolean;
};

export type DemoCatalogProductSeed = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  status: string;
  categoryName: string;
  expirationDate: string;
};

export type DemoCatalogAllocationSeed = {
  productSku: string;
  warehouseName: string;
  quantity: number;
  reservedQuantity: number;
};

export type DemoCatalogOrderSeed = {
  orderNumber: string;
  invoiceNumber: string;
  productSku: string;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  status: string;
  paymentStatus: string;
  invoiceStatus: string;
  /** ISO date for sales-trend chart (e.g. 2024-07) */
  orderDate: string;
};

/** Connected catalog — OPT-IN ONLY via scripts/lib/seed-demo-catalog.ts (not default reset). */
export const DEMO_CATALOG_SEED = {
  categories: [
    {
      name: "Headphone",
      description: "Over-ear and on-ear headphones for demo browsing.",
      notes: "Primary category for BT23 demo SKU.",
      status: true,
    },
    {
      name: "Accessories",
      description: "Cables, cases, and add-ons.",
      notes: "Secondary demo category.",
      status: true,
    },
  ] satisfies DemoCatalogCategorySeed[],
  warehouses: [
    {
      name: "Main Warehouse",
      address: "100 Demo Industrial Park, Austin, TX 78701",
      type: "main",
      status: true,
    },
    {
      name: "Secondary Storage",
      address: "200 Backup Lane, Austin, TX 78702",
      type: "secondary",
      status: true,
    },
  ] satisfies DemoCatalogWarehouseSeed[],
  products: [
    {
      name: "Demo Wireless Headphone",
      sku: "BT23",
      price: 49,
      quantity: 49,
      status: "Available",
      categoryName: "Headphone",
      expirationDate: "2026-07-08",
    },
  ] satisfies DemoCatalogProductSeed[],
  allocations: [
    {
      productSku: "BT23",
      warehouseName: "Main Warehouse",
      quantity: 29,
      reservedQuantity: 0,
    },
  ] satisfies DemoCatalogAllocationSeed[],
  orders: [
    {
      orderNumber: "ORD-DEMO-001",
      invoiceNumber: "INV-DEMO-001",
      productSku: "BT23",
      warehouseName: "Main Warehouse",
      quantity: 1,
      unitPrice: 49,
      tax: 3.52,
      status: "delivered",
      paymentStatus: "paid",
      invoiceStatus: "paid",
      orderDate: "2024-07-15T14:00:00.000Z",
    },
  ] satisfies DemoCatalogOrderSeed[],
} as const;

/** Re-export user specs for scripts that need the full list. */
export { DEMO_SEED_USERS };
