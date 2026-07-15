import { describe, expect, it } from "vitest";
import { resolveSsrSyncAction } from "./ssr-sync-policy";

describe("resolveSsrSyncAction", () => {
  it("refetches when query is invalidated", () => {
    expect(
      resolveSsrSyncAction({ id: "1" }, { id: "1" }, { isInvalidated: true }),
    ).toBe("refetch");
  });

  it("refetches when query is fetching", () => {
    expect(
      resolveSsrSyncAction({ id: "1" }, { id: "1" }, { fetchStatus: "fetching" }),
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

  it("skips when cached updatedAt equals SSR", () => {
    const at = "2026-01-02T00:00:00.000Z";
    expect(
      resolveSsrSyncAction({ id: "1", updatedAt: at }, { id: "1", updatedAt: at }, {}),
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
});
