/**
 * Post-mutation cache invalidation — unit tests (REQ-0052/0054).
 *
 * Architecture validated:
 * - scheduleInvalidate*Caches() are synchronous async functions (no after()).
 *   API routes await them before sending the response to prevent the
 *   race condition where TanStack re-fetches before Redis is cleared.
 * - scheduleInvalidateAllServerCaches() and scheduleAfterResponse() still use
 *   after() for escape-hatch / external side-effects (ImageKit, etc.).
 */

import { after } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  after: vi.fn((task: () => void | Promise<void>) => {
    void task();
  }),
}));

vi.mock("@/lib/cache/cache-utils", () => ({
  cacheKeys: {
    products: { pattern: "products:*" },
    categories: { pattern: "categories:*" },
    suppliers: { pattern: "suppliers:*" },
    orders: { pattern: "orders:*" },
    invoices: { pattern: "invoices:*" },
    stockAllocation: { pattern: "stock-allocation:*" },
    dashboard: { pattern: "dashboard:*" },
    portal: { pattern: "portal:*" },
    clientPortal: { pattern: "clientPortal:*" },
    supplierPortal: { pattern: "supplierPortal:*" },
    productReviews: { pattern: "productReviews:*" },
    history: { pattern: "history:*" },
    userManagement: { pattern: "userManagement:*" },
    sessions: { pattern: "sessions:*" },
    notifications: { pattern: "notifications:*" },
    supportTickets: { pattern: "supportTickets:*" },
  },
  invalidateAllServerCaches: vi.fn(async () => undefined),
  invalidateCache: vi.fn(async () => 0),
}));

import {
  invalidateOnOrderChange,
  invalidateOnProductChange,
  scheduleAfterResponse,
  scheduleInvalidateAllServerCaches,
  scheduleInvalidateInvoiceCaches,
  scheduleInvalidateOrderGraphCaches,
  scheduleInvalidateProductReviewCaches,
  scheduleInvalidateSupportTicketCaches,
  scheduleInvalidateWarehouseCaches,
} from "./post-mutation";
import { invalidateAllServerCaches, invalidateCache } from "./cache-utils";

describe("post-mutation cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Escape-hatch: still deferred via after()
  it("scheduleInvalidateAllServerCaches registers after() callback and calls full wipe", async () => {
    scheduleInvalidateAllServerCaches();
    expect(after).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(invalidateAllServerCaches).toHaveBeenCalled();
    });
  });

  // scheduleAfterResponse: still deferred via after()
  it("scheduleAfterResponse runs task inside after()", async () => {
    const task = vi.fn(async () => undefined);
    scheduleAfterResponse(task, "test");
    expect(after).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(task).toHaveBeenCalled();
    });
  });

  // Domain helpers: synchronous (NO after()) — fix for Redis race condition
  it("scheduleInvalidateOrderGraphCaches calls invalidateCache directly (no after)", async () => {
    await scheduleInvalidateOrderGraphCaches();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("scheduleInvalidateInvoiceCaches calls invalidateCache directly (no after)", async () => {
    await scheduleInvalidateInvoiceCaches();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("scheduleInvalidateWarehouseCaches calls invalidateCache directly (no after)", async () => {
    await scheduleInvalidateWarehouseCaches();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalledWith("products:*");
  });

  it("scheduleInvalidateSupportTicketCaches calls invalidateCache directly (no after)", async () => {
    await scheduleInvalidateSupportTicketCaches();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("scheduleInvalidateProductReviewCaches calls invalidateCache directly (no after)", async () => {
    await scheduleInvalidateProductReviewCaches();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  // Deprecated aliases: also async, delegate to domain functions (no after)
  it("invalidateOnProductChange is async and calls invalidateCache directly", async () => {
    await invalidateOnProductChange();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });

  it("invalidateOnOrderChange is async and calls invalidateCache directly", async () => {
    await invalidateOnOrderChange();
    expect(after).not.toHaveBeenCalled();
    expect(invalidateCache).toHaveBeenCalled();
  });
});
