import { describe, expect, it } from "vitest";
import { resolveSsrSyncAction } from "./ssr-sync-policy";

describe("resolveSsrSyncAction", () => {
  it("refetches when query is invalidated", () => {
    expect(
      resolveSsrSyncAction([{ id: "1" }], [{ id: "1" }, { id: "2" }], {
        isInvalidated: true,
      } as never),
    ).toBe("refetch");
  });

  it("skips stale shorter SSR list when cache has more rows", () => {
    expect(
      resolveSsrSyncAction(
        [{ id: "1" }, { id: "2" }],
        [{ id: "1" }, { id: "2" }, { id: "3" }],
        { isInvalidated: false } as never,
      ),
    ).toBe("skip");
  });

  it("applies SSR when cache is empty", () => {
    expect(
      resolveSsrSyncAction([{ id: "1" }], undefined, {
        isInvalidated: false,
      } as never),
    ).toBe("apply");
  });
});
