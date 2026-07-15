import { describe, expect, it, vi, beforeEach } from "vitest";
import { cacheKeyDomain } from "./cache-utils";

const redisMock = {
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  scan: vi.fn().mockResolvedValue([0, []]),
  del: vi.fn(),
};

vi.mock("./redis", () => ({
  getRedis: () => redisMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/lib/monitoring/system-metrics", () => ({
  trackCacheHit: vi.fn().mockResolvedValue(undefined),
  trackCacheMiss: vi.fn().mockResolvedValue(undefined),
}));

describe("cacheKeyDomain", () => {
  it("extracts first segment", () => {
    expect(cacheKeyDomain("products:list:v2:{}")).toBe("products");
    expect(cacheKeyDomain("stock-allocation:product:abc")).toBe("stock-allocation");
  });
});

describe("setCache stale re-warm guard (REQ-0133)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("skips setCache when domain was invalidated after read started", async () => {
    redisMock.get.mockImplementation(async (key: string) => {
      if (key.includes("__invAt:products")) return 2000;
      return null;
    });

    const { setCache } = await import("./cache-utils");
    const ok = await setCache("products:list:v2:test", [{ id: "1" }], 300, {
      fetchedAt: 1000,
    });
    expect(ok).toBe(false);
    expect(redisMock.setex).not.toHaveBeenCalled();
  });

  it("allows setCache when invalidation predates read start", async () => {
    redisMock.get.mockImplementation(async (key: string) => {
      if (key.includes("__invAt:products")) return 500;
      return null;
    });

    const { setCache } = await import("./cache-utils");
    const ok = await setCache("products:list:v2:test", [{ id: "1" }], 300, {
      fetchedAt: 1000,
    });
    expect(ok).toBe(true);
    expect(redisMock.setex).toHaveBeenCalled();
  });

  it("marks invalidation timestamp on invalidateCache", async () => {
    redisMock.get.mockResolvedValue(null);
    const { invalidateCache } = await import("./cache-utils");
    await invalidateCache("products:*");
    expect(redisMock.set).toHaveBeenCalledWith(
      expect.stringContaining("__invAt:products"),
      expect.any(Number),
    );
  });
});
