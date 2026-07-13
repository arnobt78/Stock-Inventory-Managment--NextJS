/**
 * Invalidation audit spec (static analysis — no server required).
 * Covers: hooks/queries mutations, components using mutate, inline fetch CRUD,
 * invalidate-all registry, per-route Redis invalidation (31 routes), spec/exempt
 * completeness, update detail touch, delete cancel/remove.
 * Dynamic test count varies when inline-fetch components change (e.g. AdminSidebar
 * logout fetch removed REQ-0094 → 205 vs prior 206).
 * Run: npm run test:invalidate
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HOOKS_DIR = join(ROOT, "hooks/queries");
const API_DIR = join(ROOT, "app/api");

/** Hooks that intentionally scope invalidation (notifications — not full-app blast) */
const SCOPED_INVALIDATION_FILES = new Set(["use-notifications.ts"]);

/** Components with inline fetch CRUD — exempt or must call invalidateAllRelatedQueries */
const COMPONENT_FETCH_CRUD_ALLOWLIST = new Set([
  "components/products/form-fields/ImageField.tsx",
  "components/products/ProductImportDialog.tsx",
  "components/layouts/Navbar.tsx",
  "components/layouts/AdminSidebar.tsx",
  "components/Pages/BusinessInsightPage.tsx",
  "components/admin/AdminAnalyticsContent.tsx",
  "components/Pages/ApiStatusPage.tsx",
  "components/Pages/ApiDocsPage.tsx",
]);

/** Domains with query sub-keys beyond list/detail — invalidate-all must use *.all */
const DOMAIN_KEYS_REQUIRE_ALL = [
  { domain: "productReviews", key: "queryKeys.productReviews.all" },
  { domain: "invoices", key: "queryKeys.invoices.all" },
  { domain: "supportTickets", key: "queryKeys.supportTickets.all" },
  { domain: "stockAllocation", key: "queryKeys.stockAllocation.all" },
  { domain: "notifications", key: "queryKeys.notifications.all" },
  { domain: "portal", key: "queryKeys.portal.all" },
  { domain: "history", key: "queryKeys.history.all" },
] as const;

/**
 * Per-route Redis invalidation contract for API write handlers.
 * At least one listed pattern must appear in the route file body.
 */
const API_WRITE_ROUTE_INVALIDATION_SPEC: Record<string, readonly string[]> = {
  "app/api/products/route.ts": ["invalidateOnProductChange", "scheduleAfterResponse"],
  "app/api/products/import/route.ts": ["scheduleInvalidateImportCaches"],
  "app/api/products/image/route.ts": ["scheduleInvalidateProductCaches"],
  "app/api/products/qr-code/route.ts": ["scheduleInvalidateProductCaches"],
  "app/api/categories/route.ts": ["scheduleInvalidateCategoryCaches"],
  "app/api/suppliers/route.ts": ["scheduleInvalidateSupplierCaches"],
  "app/api/orders/route.ts": ["invalidateOnOrderChange"],
  "app/api/orders/[id]/route.ts": ["invalidateOnOrderChange"],
  "app/api/invoices/route.ts": ["scheduleInvalidateInvoiceCaches"],
  "app/api/invoices/[id]/route.ts": ["scheduleInvalidateInvoiceCaches"],
  "app/api/invoices/[id]/send/route.ts": ["scheduleInvalidateInvoiceCaches"],
  "app/api/invoices/reminders/route.ts": ["scheduleInvalidateInvoiceCaches"],
  "app/api/warehouses/route.ts": ["scheduleInvalidateWarehouseCaches"],
  "app/api/stock-allocations/route.ts": ["scheduleInvalidateStockAllocationCaches"],
  "app/api/stock-allocations/[id]/route.ts": ["scheduleInvalidateStockAllocationCaches"],
  "app/api/stock-transfers/route.ts": ["scheduleInvalidateStockAllocationCaches"],
  "app/api/product-reviews/route.ts": ["scheduleInvalidateProductReviewCaches"],
  "app/api/product-reviews/[id]/route.ts": ["scheduleInvalidateProductReviewCaches"],
  "app/api/support-tickets/route.ts": ["scheduleInvalidateSupportTicketCaches"],
  "app/api/support-tickets/[id]/route.ts": ["scheduleInvalidateSupportTicketCaches"],
  "app/api/support-tickets/[id]/replies/route.ts": ["scheduleInvalidateSupportTicketCaches"],
  "app/api/users/route.ts": ["scheduleInvalidateUserCaches"],
  "app/api/users/[id]/route.ts": ["scheduleInvalidateUserCaches"],
  "app/api/user/email-preferences/route.ts": ["scheduleInvalidateEmailPreferenceCaches"],
  "app/api/system-config/route.ts": ["invalidateCache(", "scheduleInvalidateSystemConfigCaches"],
  "app/api/auth/register/route.ts": ["scheduleInvalidateAuthCaches"],
  "app/api/payments/checkout/route.ts": ["scheduleInvalidateOrderGraphCaches"],
  "app/api/payments/webhook/route.ts": ["invalidateOnOrderChange"],
  "app/api/shipping/labels/route.ts": ["invalidateOnOrderChange"],
  "app/api/shipping/tracking/route.ts": ["invalidateOnOrderChange"],
  "app/api/shipping/webhook/route.ts": ["invalidateOnOrderChange"],
  "app/api/notifications/in-app/[id]/route.ts": ["scheduleInvalidateNotificationCaches"],
  "app/api/notifications/in-app/mark-all-read/route.ts": ["scheduleInvalidateNotificationCaches"],
};

/** Update mutations must refresh the open detail view (setQueryData or invalidateQueries on detail) */
const UPDATE_HOOKS_TOUCH_DETAIL = [
  "use-products.ts",
  "use-categories.ts",
  "use-suppliers.ts",
  "use-warehouses.ts",
  "use-orders.ts",
  "use-invoices.ts",
  "use-product-reviews.ts",
  "use-support-tickets.ts",
  "use-user-management.ts",
] as const;

/** Domains with list+detail only — invalidate-all must use *.lists() (avoid detail 404 after delete) */
const DOMAIN_KEYS_REQUIRE_LISTS = [
  "queryKeys.products.lists()",
  "queryKeys.categories.lists()",
  "queryKeys.suppliers.lists()",
  "queryKeys.orders.lists()",
] as const;

/** API write routes that do not mutate cached inventory data (no Redis invalidation required) */
const API_WRITE_EXEMPT = new Set([
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/ai/insights/route.ts",
  "app/api/shipping/rates/route.ts",
  "app/api/notifications/route.ts",
  "app/api/email/queue/process/route.ts",
]);

const SERVER_INVALIDATE_PATTERNS = [
  "invalidateOnProductChange",
  "invalidateOnOrderChange",
  "scheduleInvalidateProductCaches",
  "scheduleInvalidateCategoryCaches",
  "scheduleInvalidateSupplierCaches",
  "scheduleInvalidateWarehouseCaches",
  "scheduleInvalidateStockAllocationCaches",
  "scheduleInvalidateOrderGraphCaches",
  "scheduleInvalidateInvoiceCaches",
  "scheduleInvalidateSupportTicketCaches",
  "scheduleInvalidateProductReviewCaches",
  "scheduleInvalidateUserCaches",
  "scheduleInvalidateNotificationCaches",
  "scheduleInvalidateAuthCaches",
  "scheduleInvalidateEmailPreferenceCaches",
  "scheduleInvalidateSystemConfigCaches",
  "scheduleInvalidateImportCaches",
  "scheduleInvalidateAllServerCaches",
  "invalidateCache(",
];

const DIRECT_FETCH_WRITE =
  /fetch\s*\(\s*[`'"]\/api\/[^`'"]+[`'"][\s\S]*?method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i;

function readRepoFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function walkFiles(
  dir: string,
  predicate: (name: string) => boolean,
  acc: string[] = [],
): string[] {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walkFiles(full, predicate, acc);
    } else if (predicate(ent.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function hasMutationInvalidation(fileName: string, content: string): boolean {
  if (!content.includes("useMutation")) return true;
  if (SCOPED_INVALIDATION_FILES.has(fileName)) {
    return (
      content.includes("invalidateQueries") &&
      (content.includes("onSuccess") || content.includes("onSettled"))
    );
  }
  return (
    content.includes("invalidateAllRelatedQueries") ||
    content.includes("invalidateAfterOrderGraphChange") ||
    content.includes("invalidateAfterStockChange")
  );
}

function hasServerInvalidation(content: string): boolean {
  return SERVER_INVALIDATE_PATTERNS.some((p) => content.includes(p));
}

function hasWriteHandler(content: string): boolean {
  return /export async function (POST|PUT|PATCH|DELETE)\b/.test(content);
}

describe("mutation invalidation coverage (hooks/queries)", () => {
  const hookFiles = readdirSync(HOOKS_DIR).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  );

  for (const file of hookFiles) {
    it(`${file}`, () => {
      const content = readRepoFile(join("hooks/queries", file));
      expect(hasMutationInvalidation(file, content)).toBe(true);
    });
  }
});

describe("mutation invalidation coverage (components using hooks)", () => {
  const componentFiles = walkFiles(
    join(ROOT, "components"),
    (n) => n.endsWith(".tsx") || n.endsWith(".ts"),
  );

  for (const absPath of componentFiles) {
    const rel = relative(ROOT, absPath);
    const content = readFileSync(absPath, "utf8");
    const usesMutate =
      content.includes(".mutate(") || content.includes("mutateAsync(");
    if (!usesMutate) continue;

    it(`${rel} uses mutation hooks or invalidates`, () => {
      const usesQueryHooks =
        content.includes("@/hooks/queries") ||
        content.includes('from "@/hooks/queries');
      const hasBroadInvalidate = content.includes(
        "invalidateAllRelatedQueries",
      );
      expect(usesQueryHooks || hasBroadInvalidate).toBe(true);
    });
  }
});

describe("mutation invalidation coverage (inline fetch CRUD components)", () => {
  const componentFiles = walkFiles(
    join(ROOT, "components"),
    (n) => n.endsWith(".tsx") || n.endsWith(".ts"),
  );

  for (const absPath of componentFiles) {
    const rel = relative(ROOT, absPath);
    const content = readFileSync(absPath, "utf8");
    if (!DIRECT_FETCH_WRITE.test(content)) continue;

    it(`${rel}`, () => {
      if (COMPONENT_FETCH_CRUD_ALLOWLIST.has(rel)) {
        if (rel === "components/products/ProductImportDialog.tsx") {
          expect(content.includes("invalidateAllRelatedQueries")).toBe(true);
        }
        return;
      }
      expect(content.includes("invalidateAllRelatedQueries")).toBe(true);
    });
  }
});

/** Top-level TanStack domains used by hooks/queries — each must appear in invalidate-all.ts */
const INVALIDATE_ALL_HOOK_DOMAINS = [
  "queryKeys.products",
  "queryKeys.categories",
  "queryKeys.suppliers",
  "queryKeys.orders",
  "queryKeys.clientOrders",
  "queryKeys.invoices",
  "queryKeys.clientInvoices",
  "queryKeys.warehouses",
  "queryKeys.history",
  "queryKeys.supportTickets",
  "queryKeys.productReviews",
  "queryKeys.dashboard",
  "queryKeys.admin",
  "queryKeys.userManagement",
  "queryKeys.clientPortal",
  "queryKeys.supplierPortal",
  "queryKeys.stockAllocation",
  "queryKeys.forecasting",
  "queryKeys.portal",
  "queryKeys.auditLogs",
  "queryKeys.notifications",
  "queryKeys.systemConfig",
  "queryKeys.user",
  "queryKeys.auth",
] as const;

describe("invalidateAllRelatedQueries registry", () => {
  const content = readRepoFile("lib/react-query/invalidate-all.ts");

  it("covers every hooks/queries domain root", () => {
    for (const domain of INVALIDATE_ALL_HOOK_DOMAINS) {
      expect(content).toContain(domain);
    }
  });

  it("uses lists() for catalog entities with list+detail only", () => {
    const broadOnly = content.slice(
      0,
      content.indexOf("export function invalidateAfterOrderGraphChange"),
    );
    for (const key of DOMAIN_KEYS_REQUIRE_LISTS) {
      expect(broadOnly).toContain(key);
    }
    expect(broadOnly).not.toMatch(/queryKeys\.products\.all[^.]/);
  });

  it("uses .all for domains with extra sub-query keys", () => {
    for (const { key } of DOMAIN_KEYS_REQUIRE_ALL) {
      expect(content).toContain(key);
    }
    expect(content).not.toContain("queryKeys.productReviews.lists()");
    expect(content).not.toContain("queryKeys.invoices.lists()");
    expect(content).not.toContain("queryKeys.supportTickets.lists()");
    expect(content).not.toContain("queryKeys.history.lists()");
  });
});

describe("hooks/use-back-with-refresh", () => {
  it("order/invoice back uses invalidateAfterOrderGraphChange", () => {
    const content = readRepoFile("hooks/use-back-with-refresh.ts");
    expect(content).toContain("invalidateAfterOrderGraphChange");
    expect(content).toContain("invalidateAllRelatedQueries");
  });
});

describe("API write routes — per-route Redis invalidation spec", () => {
  for (const [rel, patterns] of Object.entries(API_WRITE_ROUTE_INVALIDATION_SPEC)) {
    it(rel, () => {
      const content = readRepoFile(rel);
      expect(hasWriteHandler(content)).toBe(true);
      expect(patterns.some((p) => content.includes(p))).toBe(true);
    });
  }
});

/** Every route.ts with a write handler must be in the per-route spec or the exempt set */
describe("API write routes — spec/exempt completeness", () => {
  const specKeys = new Set(Object.keys(API_WRITE_ROUTE_INVALIDATION_SPEC));
  const routeFiles = walkFiles(API_DIR, (n) => n === "route.ts");

  for (const absPath of routeFiles) {
    const rel = relative(ROOT, absPath);
    const content = readFileSync(absPath, "utf8");
    if (!hasWriteHandler(content)) continue;

    it(rel, () => {
      expect(API_WRITE_EXEMPT.has(rel) || specKeys.has(rel)).toBe(true);
    });
  }
});

describe("API write routes server cache invalidation", () => {
  const routeFiles = walkFiles(API_DIR, (n) => n === "route.ts");

  for (const absPath of routeFiles) {
    const rel = relative(ROOT, absPath);
    const content = readFileSync(absPath, "utf8");
    if (!hasWriteHandler(content)) continue;

    it(rel, () => {
      if (API_WRITE_EXEMPT.has(rel)) return;
      expect(hasServerInvalidation(content)).toBe(true);
    });
  }
});

describe("update mutations refresh mounted detail cache", () => {
  for (const file of UPDATE_HOOKS_TOUCH_DETAIL) {
    it(`${file}`, () => {
      const content = readRepoFile(join("hooks/queries", file));
      const touchesDetail =
        /\.detail\(/.test(content) &&
        (content.includes("setQueryData") ||
          content.includes("invalidateQueries"));
      expect(touchesDetail).toBe(true);
    });
  }
});

describe("delete mutations cancel/remove detail before broad invalidation", () => {
  const deleteHookFiles = [
    "use-products.ts",
    "use-categories.ts",
    "use-suppliers.ts",
    "use-orders.ts",
    "use-invoices.ts",
    "use-warehouses.ts",
    "use-product-reviews.ts",
    "use-support-tickets.ts",
    "use-user-management.ts",
  ];

  for (const file of deleteHookFiles) {
    it(`${file}`, () => {
      const content = readRepoFile(join("hooks/queries", file));
      expect(content).toContain("cancelOrRemoveDetailQuery");
      expect(
        content.includes("invalidateAllRelatedQueries") ||
          content.includes("invalidateAfterOrderGraphChange"),
      ).toBe(true);
    });
  }
});

describe("invalidateAfterOrderGraphChange", () => {
  it("refreshes catalog detail queries that embed order rows", () => {
    const content = readRepoFile("lib/react-query/invalidate-all.ts");
    expect(content).toContain("invalidateAfterOrderGraphChange");
    expect(content).toContain("queryKeys.products.all");
    expect(content).toContain("queryKeys.orders.all");
  });

  const orderGraphHooks = [
    "use-orders.ts",
    "use-invoices.ts",
    "use-shipping.ts",
    "use-payments.ts",
  ];
  for (const file of orderGraphHooks) {
    it(`${file} calls invalidateAfterOrderGraphChange`, () => {
      const content = readRepoFile(join("hooks/queries", file));
      expect(content).toContain("invalidateAfterOrderGraphChange");
    });
  }

  const orderGraphPages = [
    "components/Pages/OrderDetailPage.tsx",
    "components/Pages/InvoiceDetailPage.tsx",
  ];
  for (const rel of orderGraphPages) {
    it(`${rel} uses invalidateAfterOrderGraphChange for payment/back refresh`, () => {
      const content = readRepoFile(rel);
      expect(content).toContain("invalidateAfterOrderGraphChange");
      expect(content).not.toMatch(/invalidateAllRelatedQueries\s*\(/);
    });
  }
});

describe("invalidateAfterStockChange", () => {
  it("use-stock-allocation.ts refreshes product detail quantity", () => {
    const content = readRepoFile("hooks/queries/use-stock-allocation.ts");
    expect(content).toContain("invalidateAfterStockChange");
  });
});

describe("cancelOrRemoveDetailQuery helper", () => {
  it("documents observer-safe detail cleanup", () => {
    const content = readRepoFile("lib/react-query/cancel-or-remove-detail.ts");
    expect(content).toContain("getObserversCount");
    expect(content).toContain("cancelQueries");
    expect(content).toContain("removeQueries");
  });
});
