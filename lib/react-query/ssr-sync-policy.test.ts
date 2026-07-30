import { describe, expect, it } from "vitest";
import {
  listHasFresherStatusBadges,
  mergeDensifyOnly,
  mergeSsrIntoCache,
  resolveSsrSyncAction,
  serverHasRicherDensify,
} from "./ssr-sync-policy";

describe("serverHasRicherDensify", () => {
  it("detects missing email on cache when SSR has it", () => {
    expect(
      serverHasRicherDensify(
        { id: "1", creatorEmail: "a@b.com" },
        { id: "1" },
      ),
    ).toBe(true);
  });

  it("returns false when densify already present", () => {
    expect(
      serverHasRicherDensify(
        { id: "1", creatorEmail: "a@b.com" },
        { id: "1", creatorEmail: "a@b.com" },
      ),
    ).toBe(false);
  });

  // REQ-0218 — catalog calculated densify keys
  it("detects missing productInsights / committedQuantity / productCount", () => {
    expect(
      serverHasRicherDensify(
        { id: "1", productInsights: { totalStock: 10 }, committedQuantity: 2 },
        { id: "1" },
      ),
    ).toBe(true);
    expect(
      serverHasRicherDensify(
        { id: "c1", productCount: 3, catalogProductTotal: 10 },
        { id: "c1", productCount: 0 },
      ),
    ).toBe(true);
  });
});

describe("resolveSsrSyncAction", () => {
  it("refetches when query is invalidated", () => {
    expect(
      resolveSsrSyncAction({ id: "1" }, { id: "1" }, { isInvalidated: true }),
    ).toBe("refetch");
  });

  it("refetches when query is fetching and densify parity", () => {
    expect(
      resolveSsrSyncAction({ id: "1" }, { id: "1" }, { fetchStatus: "fetching" }),
    ).toBe("refetch");
  });

  // REQ-0136 — never apply SSR while invalidated/fetching (prod badge revert)
  it("refetches richer SSR densify while fetching instead of apply", () => {
    expect(
      resolveSsrSyncAction(
        {
          id: "1",
          placedByName: "Admin",
          placedByEmail: "a@b.com",
          placedByUserId: "u1",
          orderProductOwners: [{ userId: "u1", email: "a@b.com" }],
        },
        { id: "1", orderNumber: "ORD-1" },
        { fetchStatus: "fetching", isInvalidated: true },
      ),
    ).toBe("refetch");
  });

  it("skips when cached array is longer than SSR snapshot", () => {
    expect(
      resolveSsrSyncAction([{ id: "1" }], [{ id: "1" }, { id: "2" }], {}),
    ).toBe("skip");
  });

  it("skips when cached updatedAt is newer than SSR (REQ-0122 back-nav guard)", () => {
    expect(
      resolveSsrSyncAction(
        { id: "1", updatedAt: "2026-01-01T00:00:00.000Z" },
        { id: "1", updatedAt: "2026-01-02T00:00:00.000Z" },
        {},
      ),
    ).toBe("skip");
  });

  it("skips when cached updatedAt equals SSR and densify parity", () => {
    const at = "2026-01-02T00:00:00.000Z";
    expect(
      resolveSsrSyncAction(
        { id: "1", updatedAt: at, creatorEmail: "a@b.com" },
        { id: "1", updatedAt: at, creatorEmail: "a@b.com" },
        {},
      ),
    ).toBe("skip");
  });

  // REQ-0202 / REQ-0136 Fix B — equal updatedAt but SSR densify richer → gap-fill only
  it("applies densify-only when updatedAt equal but SSR has densify cache lacks", () => {
    const at = "2026-01-02T00:00:00.000Z";
    expect(
      resolveSsrSyncAction(
        { id: "1", updatedAt: at, creatorEmail: "a@b.com", role: "admin" },
        { id: "1", updatedAt: at },
        {},
      ),
    ).toBe("applyDensifyOnly");
  });

  it("applies densify-only when no updatedAt but SSR densify richer than cache", () => {
    expect(
      resolveSsrSyncAction(
        { id: "1", assignedToEmail: "o@x.com" },
        { id: "1" },
        {},
      ),
    ).toBe("applyDensifyOnly");
  });

  it("still skips when cached updatedAt is newer even if densify thinner", () => {
    expect(
      resolveSsrSyncAction(
        {
          id: "1",
          updatedAt: "2026-01-01T00:00:00.000Z",
          creatorEmail: "a@b.com",
        },
        { id: "1", updatedAt: "2026-01-02T00:00:00.000Z" },
        {},
      ),
    ).toBe("skip");
  });

  it("applies when SSR updatedAt is newer than cache", () => {
    expect(
      resolveSsrSyncAction(
        { id: "1", updatedAt: "2026-01-03T00:00:00.000Z" },
        { id: "1", updatedAt: "2026-01-02T00:00:00.000Z" },
        {},
      ),
    ).toBe("apply");
  });

  it("skips same-length lists without updatedAt (REQ-0133 post-CRUD guard)", () => {
    expect(
      resolveSsrSyncAction(
        [{ id: "1", name: "old" }],
        [{ id: "1", name: "patched" }],
        {},
      ),
    ).toBe("skip");
  });

  it("applies empty cache from SSR list seed", () => {
    expect(
      resolveSsrSyncAction([{ id: "1" }], [], {}),
    ).toBe("apply");
  });

  it("skips entity objects without updatedAt when cache exists (REQ-0133)", () => {
    expect(resolveSsrSyncAction({ id: "1" }, { id: "2" }, {})).toBe("skip");
  });

  it("applies entity when cache is empty", () => {
    expect(resolveSsrSyncAction({ id: "1" }, undefined, {})).toBe("apply");
  });

  it("skips when list cached max updatedAt is newer than SSR", () => {
    expect(
      resolveSsrSyncAction(
        [
          { id: "1", updatedAt: "2026-01-01T00:00:00.000Z" },
          { id: "2", updatedAt: "2026-01-02T00:00:00.000Z" },
        ],
        [
          { id: "1", updatedAt: "2026-01-03T00:00:00.000Z" },
          { id: "2", updatedAt: "2026-01-04T00:00:00.000Z" },
        ],
        {},
      ),
    ).toBe("skip");
  });

  // REQ-0136 idle harden — equal updatedAt + linked badge drift: keep cache (patch+refetch)
  it("skips list when linkedOrderStatus differs but updatedAt equal", () => {
    const at = "2026-01-02T00:00:00.000Z";
    expect(
      resolveSsrSyncAction(
        [
          {
            id: "i1",
            updatedAt: at,
            linkedOrderStatus: "confirmed",
            linkedOrderPaymentStatus: "unpaid",
          },
        ],
        [
          {
            id: "i1",
            updatedAt: at,
            linkedOrderStatus: "pending",
            linkedOrderPaymentStatus: "unpaid",
          },
        ],
        {},
      ),
    ).toBe("skip");
  });

  it("applies list badges when SSR updatedAt is strictly newer", () => {
    expect(
      resolveSsrSyncAction(
        [
          {
            id: "o1",
            status: "confirmed",
            paymentStatus: "unpaid",
            updatedAt: "2026-01-03T00:00:00.000Z",
          },
        ],
        [
          {
            id: "o1",
            status: "pending",
            paymentStatus: "unpaid",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        {},
      ),
    ).toBe("apply");
  });

  it("skips list badge diff when either updatedAt is missing", () => {
    expect(
      resolveSsrSyncAction(
        [{ id: "o1", status: "confirmed", paymentStatus: "unpaid" }],
        [
          {
            id: "o1",
            status: "pending",
            paymentStatus: "unpaid",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        {},
      ),
    ).toBe("skip");
  });

  it("refetches list status badges while invalidated instead of applying SSR", () => {
    expect(
      resolveSsrSyncAction(
        [{ id: "o1", status: "confirmed", paymentStatus: "unpaid" }],
        [{ id: "o1", status: "pending", paymentStatus: "unpaid" }],
        { isInvalidated: true },
      ),
    ).toBe("refetch");
  });

  it("skips applying stale SSR badges when cache is newer by updatedAt (idle)", () => {
    expect(
      resolveSsrSyncAction(
        [
          {
            id: "o1",
            status: "pending",
            paymentStatus: "unpaid",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        [
          {
            id: "o1",
            status: "confirmed",
            paymentStatus: "unpaid",
            updatedAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        {},
      ),
    ).toBe("skip");
  });
});

describe("listHasFresherStatusBadges", () => {
  it("detects order status drift", () => {
    expect(
      listHasFresherStatusBadges(
        [{ id: "o1", status: "confirmed" }],
        [{ id: "o1", status: "pending" }],
      ),
    ).toBe(true);
  });
});

// REQ-0136 Fix B — merge helpers must never let a stale/thin SSR object clobber
// cached-only fields, even when the resolver decided to "apply".
describe("mergeSsrIntoCache", () => {
  it("returns serverData as-is when cache is undefined", () => {
    expect(mergeSsrIntoCache({ id: "1" }, undefined)).toEqual({ id: "1" });
  });

  it("keeps cached-only fields a thinner SSR entity omits", () => {
    expect(
      mergeSsrIntoCache(
        { id: "1", status: "shipped" },
        { id: "1", status: "confirmed", notes: "gift wrap" },
      ),
    ).toEqual({ id: "1", status: "shipped", notes: "gift wrap" });
  });

  it("merges arrays per row by id, preserving cached-only rows fields", () => {
    expect(
      mergeSsrIntoCache(
        [{ id: "o1", status: "confirmed" }],
        [{ id: "o1", status: "pending", orderNumber: "ORD-1" }],
      ),
    ).toEqual([{ id: "o1", status: "confirmed", orderNumber: "ORD-1" }]);
  });

  it("passes through new rows the cache does not have yet", () => {
    expect(
      mergeSsrIntoCache(
        [{ id: "o1" }, { id: "o2" }],
        [{ id: "o1" }],
      ),
    ).toEqual([{ id: "o1" }, { id: "o2" }]);
  });
});

describe("mergeDensifyOnly", () => {
  it("fills a missing densify field without touching status", () => {
    expect(
      mergeDensifyOnly(
        { id: "1", creatorEmail: "a@b.com", status: "sent" },
        { id: "1", status: "paid" },
      ),
    ).toEqual({ id: "1", status: "paid", creatorEmail: "a@b.com" });
  });

  it("never overwrites a densify field cache already has", () => {
    expect(
      mergeDensifyOnly(
        { id: "1", creatorEmail: "stale@old.com" },
        { id: "1", creatorEmail: "fresh@new.com" },
      ),
    ).toEqual({ id: "1", creatorEmail: "fresh@new.com" });
  });

  it("ignores non-densify fields entirely (status never merged in)", () => {
    expect(
      mergeDensifyOnly(
        { id: "1", status: "sent", paymentStatus: "unpaid" },
        { id: "1", status: "paid", paymentStatus: "paid" },
      ),
    ).toEqual({ id: "1", status: "paid", paymentStatus: "paid" });
  });
});
