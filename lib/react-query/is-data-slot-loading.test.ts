import { describe, expect, it } from "vitest";
import {
  isAnyDataSlotLoading,
  isAnyDataSlotUnsettled,
  isDataSlotLoading,
  isDataSlotRefreshing,
  isDataSlotUnsettled,
} from "./is-data-slot-loading";

describe("isDataSlotLoading", () => {
  it("returns false when server initial is provided", () => {
    expect(
      isDataSlotLoading({ isPending: true, data: undefined }, [{ id: "1" }]),
    ).toBe(false);
  });

  it("returns false when query already has data", () => {
    expect(
      isDataSlotLoading({ isPending: false, data: [1] }, undefined),
    ).toBe(false);
  });

  it("returns true when pending and no data or server initial", () => {
    expect(
      isDataSlotLoading({ isPending: true, data: undefined }, undefined),
    ).toBe(true);
  });

  it("returns false when not pending and data undefined (empty result)", () => {
    expect(
      isDataSlotLoading({ isPending: false, data: [] }, undefined),
    ).toBe(false);
  });
});

describe("isDataSlotRefreshing", () => {
  it("returns true when refetching stale cached data", () => {
    expect(
      isDataSlotRefreshing({
        isPending: false,
        data: [1],
        isFetching: true,
        isStale: true,
      }),
    ).toBe(true);
  });

  it("returns false on initial pending fetch", () => {
    expect(
      isDataSlotRefreshing({
        isPending: true,
        data: undefined,
        isFetching: true,
        isStale: true,
      }),
    ).toBe(false);
  });

  it("returns false when fetch completes (not stale)", () => {
    expect(
      isDataSlotRefreshing({
        isPending: false,
        data: [1],
        isFetching: false,
        isStale: false,
      }),
    ).toBe(false);
  });
});

describe("isDataSlotUnsettled", () => {
  it("returns true when refreshing even with server initial", () => {
    expect(
      isDataSlotUnsettled(
        {
          isPending: false,
          data: [1],
          isFetching: true,
          isStale: true,
        },
        [{ id: "1" }],
      ),
    ).toBe(true);
  });
});

describe("isAnyDataSlotLoading", () => {
  it("returns true if any entry is loading", () => {
    expect(
      isAnyDataSlotLoading([
        { query: { isPending: false, data: [1] } },
        { query: { isPending: true, data: undefined } },
      ]),
    ).toBe(true);
  });

  it("returns false when all have data", () => {
    expect(
      isAnyDataSlotLoading([
        { query: { isPending: false, data: [1] } },
        { query: { isPending: false, data: [2] }, serverInitial: [2] },
      ]),
    ).toBe(false);
  });
});

describe("isAnyDataSlotUnsettled", () => {
  it("returns true when any query is refreshing", () => {
    expect(
      isAnyDataSlotUnsettled([
        {
          query: {
            isPending: false,
            data: [1],
            isFetching: true,
            isStale: true,
          },
        },
      ]),
    ).toBe(true);
  });
});
