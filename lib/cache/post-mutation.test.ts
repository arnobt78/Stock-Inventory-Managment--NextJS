/**
 * Post-mutation cache scheduling — unit tests (REQ-0052).
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
    stockAllocation: { pattern: "stock-allocation:*" },
    dashboard: { pattern: "dashboard:*" },
    portal: { pattern: "portal:*" },
    clientPortal: { pattern: "clientPortal:*" },
    supplierPortal: { pattern: "supplierPortal:*" },
    productReviews: { pattern: "productReviews:*" },
    history: { pattern: "history:*" },
  },
  invalidateAllServerCaches: vi.fn(async () => undefined),
  invalidateCache: vi.fn(async () => 0),
}));

import {
  invalidateOnProductChange,
  scheduleAfterResponse,
  scheduleInvalidateAllServerCaches,
} from "./post-mutation";
import { invalidateAllServerCaches } from "./cache-utils";

describe("post-mutation scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scheduleInvalidateAllServerCaches registers after() callback", async () => {
    scheduleInvalidateAllServerCaches();
    expect(after).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(invalidateAllServerCaches).toHaveBeenCalled();
    });
  });

  it("invalidateOnProductChange schedules scoped invalidation via after()", () => {
    invalidateOnProductChange();
    expect(after).toHaveBeenCalled();
  });

  it("scheduleAfterResponse runs task inside after()", async () => {
    const task = vi.fn(async () => undefined);
    scheduleAfterResponse(task, "test");
    await vi.waitFor(() => {
      expect(task).toHaveBeenCalled();
    });
  });
});
