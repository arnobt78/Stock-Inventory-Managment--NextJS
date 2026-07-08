import { describe, expect, it } from "vitest";
import {
  isAnyDataSlotLoading,
  isDataSlotLoading,
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
