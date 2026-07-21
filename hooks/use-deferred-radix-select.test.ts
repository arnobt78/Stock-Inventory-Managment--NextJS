import { describe, expect, it } from "vitest";
import { shouldDeferRadixSelectMount } from "./use-deferred-radix-select";

describe("shouldDeferRadixSelectMount (REQ-0198)", () => {
  it("does not defer on first mount (no prior path)", () => {
    expect(shouldDeferRadixSelectMount(undefined, "/orders")).toBe(false);
  });

  it("does not defer when path unchanged (dialog open on same route)", () => {
    expect(shouldDeferRadixSelectMount("/orders", "/orders")).toBe(false);
  });

  it("defers when pathname changed since last stable Select", () => {
    expect(shouldDeferRadixSelectMount("/products", "/orders")).toBe(true);
  });
});
