/**
 * REQ-0088 / REQ-0091 / REQ-0092 / REQ-0137 — canonical demo seed fixtures.
 * Accounts: reset-demo-db (default). Explore catalog: seed-demo-catalog / --with-catalog.
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

/** Second editable supplier for list/detail CRUD explore (admin-owned). */
export const DEMO_LOCAL_SUPPLIER_ENTITY = {
  name: "Local Parts Co",
  description: "Editable local supplier for demo UI explore (not global).",
  notes: "Safe to edit/delete in QA — not linked to test@supplier.com.",
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
  reservedQuantity: number;
  status: string;
  categoryName: string;
  supplierKey: "demo" | "local";
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
  shipping: number;
  discount: number;
  status: string;
  paymentStatus: string;
  invoiceStatus: string;
  orderDate: string;
  notes: string;
  trackingNumber?: string;
  trackingCarrier?: string;
};

export type DemoCatalogTransferSeed = {
  productSku: string;
  fromWarehouseName: string;
  toWarehouseName: string;
  quantity: number;
  status: string;
  notes: string;
};

export type DemoCatalogTicketSeed = {
  subject: string;
  description: string;
  status: string;
  priority: string;
  productSku?: string;
  replyBody?: string;
};

export type DemoCatalogReviewSeed = {
  productSku: string;
  orderNumber: string;
  rating: number;
  comment: string;
  status: string;
};

export type DemoCatalogNotificationSeed = {
  role: "admin" | "client" | "supplier";
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
};

export type DemoCatalogImportSeed = {
  importType: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: string;
};

export type DemoCatalogSystemConfigSeed = {
  key: string;
  value: string;
  type: string;
  label: string;
  description: string;
  category: string;
  isPublic: boolean;
};

export type DemoCatalogAuditSeed = {
  action: string;
  entityType: string;
  details: Record<string, unknown>;
};

/**
 * Connected explore catalog — opt-in via `npm run script:seed-demo-catalog`
 * or `npm run script:reset-demo-db -- --with-catalog` (REQ-0137).
 */
export const DEMO_CATALOG_SEED = {
  categories: [
    {
      name: "Headphone",
      description: "Over-ear and on-ear headphones for demo browsing.",
      notes: "Primary category for Beats demo SKU.",
      status: true,
    },
    {
      name: "TV",
      description: "Televisions and displays.",
      notes: "Secondary demo category for Sony TV.",
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
  // REQ-0140 / REQ-0103 — warehouse-pick pending → product.reserved=0 (alloc owns reserve);
  // delivered/paid fulfill snapshot already decrements catalog + alloc qty.
  products: [
    {
      name: "Beats",
      sku: "SK56",
      price: 199,
      quantity: 50,
      // ORD-DEMO-002 picks Main — reservation lives on allocation only
      reservedQuantity: 0,
      status: "Available",
      categoryName: "Headphone",
      supplierKey: "demo",
      expirationDate: "2027-12-31",
    },
    {
      name: "Sony TV",
      sku: "BT23",
      price: 499,
      // ORD-DEMO-001 delivered+paid qty 1 from Main — post-fulfill catalog
      quantity: 99,
      reservedQuantity: 0,
      status: "Available",
      categoryName: "TV",
      supplierKey: "demo",
      expirationDate: "2028-06-15",
    },
  ] satisfies DemoCatalogProductSeed[],
  allocations: [
    {
      productSku: "SK56",
      warehouseName: "Main Warehouse",
      quantity: 30,
      // ORD-DEMO-002 pending 20 units — single reservation path
      reservedQuantity: 20,
    },
    {
      productSku: "BT23",
      warehouseName: "Main Warehouse",
      // 50 pre-fulfill − 1 delivered ORD-DEMO-001
      quantity: 49,
      reservedQuantity: 0,
    },
    {
      productSku: "BT23",
      warehouseName: "Secondary Storage",
      quantity: 20,
      reservedQuantity: 0,
    },
  ] satisfies DemoCatalogAllocationSeed[],
  /** Pending client order (stock reserved) + historical delivered/paid order. */
  orders: [
    {
      orderNumber: "ORD-DEMO-001",
      invoiceNumber: "INV-DEMO-001",
      productSku: "BT23",
      warehouseName: "Main Warehouse",
      quantity: 1,
      unitPrice: 499,
      tax: 35.93,
      shipping: 0,
      discount: 0,
      status: "delivered",
      paymentStatus: "paid",
      invoiceStatus: "paid",
      orderDate: "2026-06-15T14:00:00.000Z",
      notes: "Historical paid demo order for invoice + review explore.",
      trackingNumber: "DEMO-TRACK-001",
      trackingCarrier: "ups",
    },
    {
      orderNumber: "ORD-DEMO-002",
      invoiceNumber: "INV-DEMO-002",
      productSku: "SK56",
      warehouseName: "Main Warehouse",
      quantity: 20,
      unitPrice: 199,
      tax: 0,
      shipping: 0,
      discount: 0,
      status: "pending",
      paymentStatus: "unpaid",
      invoiceStatus: "sent",
      orderDate: "2026-07-15T10:00:00.000Z",
      notes: "Active reserved order — use for pay/stock/allocate QA.",
    },
  ] satisfies DemoCatalogOrderSeed[],
  transfers: [
    {
      productSku: "BT23",
      fromWarehouseName: "Main Warehouse",
      toWarehouseName: "Secondary Storage",
      quantity: 5,
      status: "completed",
      notes: "Demo completed transfer (allocations already reflect post-transfer).",
    },
  ] satisfies DemoCatalogTransferSeed[],
  tickets: [
    {
      subject: "Beats delivery question",
      description:
        "Client demo ticket: when will ORD-DEMO-002 ship after payment?",
      status: "open",
      priority: "medium",
      productSku: "SK56",
      replyBody: undefined,
    },
    {
      subject: "TV packaging damage report",
      description: "Admin-assigned ticket with a reply for support UI explore.",
      status: "in_progress",
      priority: "high",
      productSku: "BT23",
      replyBody:
        "Thanks for reporting — we opened a replacement case. Reply from Test Admin.",
    },
  ] satisfies DemoCatalogTicketSeed[],
  reviews: [
    {
      productSku: "BT23",
      orderNumber: "ORD-DEMO-001",
      rating: 5,
      comment: "Great picture quality — demo approved review.",
      status: "approved",
    },
    {
      productSku: "SK56",
      orderNumber: "ORD-DEMO-002",
      rating: 4,
      comment: "Comfortable fit — pending moderation demo review.",
      status: "pending",
    },
  ] satisfies DemoCatalogReviewSeed[],
  notifications: [
    {
      role: "admin",
      type: "order_status_update",
      title: "New client order",
      message: "ORD-DEMO-002 is pending payment (20× Beats).",
      link: "/orders",
      read: false,
    },
    {
      role: "client",
      type: "invoice_sent",
      title: "Invoice ready",
      message: "INV-DEMO-002 was sent for your pending Beats order.",
      link: "/invoices",
      read: false,
    },
    {
      role: "supplier",
      type: "low_stock",
      title: "Allocation reserved",
      message: "Beats (SK56) has 20 units reserved on Main Warehouse.",
      link: "/products",
      read: true,
    },
  ] satisfies DemoCatalogNotificationSeed[],
  imports: [
    {
      importType: "products",
      fileName: "demo-products.csv",
      fileSize: 2048,
      totalRows: 2,
      successRows: 2,
      failedRows: 0,
      status: "completed",
    },
    {
      importType: "categories",
      fileName: "demo-categories.csv",
      fileSize: 512,
      totalRows: 2,
      successRows: 1,
      failedRows: 1,
      status: "completed",
    },
  ] satisfies DemoCatalogImportSeed[],
  systemConfigs: [
    {
      key: "company_name",
      value: "Stockly Demo",
      type: "string",
      label: "Company name",
      description: "Display name for invoices and emails.",
      category: "general",
      isPublic: true,
    },
    {
      key: "low_stock_threshold",
      value: "10",
      type: "number",
      label: "Low stock threshold",
      description: "Alert when available qty falls at or below this value.",
      category: "notifications",
      isPublic: false,
    },
  ] satisfies DemoCatalogSystemConfigSeed[],
  audits: [
    {
      action: "create",
      entityType: "product",
      details: { sku: "SK56", name: "Beats", source: "demo-seed" },
    },
    {
      action: "create",
      entityType: "order",
      details: { orderNumber: "ORD-DEMO-002", source: "demo-seed" },
    },
  ] satisfies DemoCatalogAuditSeed[],
  demoAddress: {
    street: "42 Explore Lane",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    country: "US",
  },
} as const;

/** Re-export user specs for scripts that need the full list. */
export { DEMO_SEED_USERS };
