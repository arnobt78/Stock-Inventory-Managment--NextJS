import { describe, expect, it } from "vitest";
import {
  listHasFresherStatusBadges,
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

  // REQ-0209 — thin create patch + SSR parties while refetching → apply densify
  it("applies richer SSR densify while fetching (parties flash guard)", () => {
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
    ).toBe("apply");
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

  // REQ-0202 — equal updatedAt but SSR densify richer → apply
  it("applies when updatedAt equal but SSR has densify cache lacks", () => {
    const at = "2026-01-02T00:00:00.000Z";
    expect(
      resolveSsrSyncAction(
        { id: "1", updatedAt: at, creatorEmail: "a@b.com", role: "admin" },
        { id: "1", updatedAt: at },
        {},
      ),
    ).toBe("apply");
  });

  it("applies when no updatedAt but SSR densify richer than cache", () => {
    expect(
      resolveSsrSyncAction(
        { id: "1", assignedToEmail: "o@x.com" },
        { id: "1" },
        {},
      ),
    ).toBe("apply");
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

  // REQ-0211 — order status change leaves invoice.updatedAt equal → apply linked badges
  it("applies list when linkedOrderStatus fresher even if updatedAt equal", () => {
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
    ).toBe("apply");
  });

  it("applies list status badges while invalidated instead of refetch-only", () => {
    expect(
      resolveSsrSyncAction(
        [{ id: "o1", status: "confirmed", paymentStatus: "unpaid" }],
        [{ id: "o1", status: "pending", paymentStatus: "unpaid" }],
        { isInvalidated: true },
      ),
    ).toBe("apply");
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
