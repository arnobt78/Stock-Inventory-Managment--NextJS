import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { replaceShallowSearchParam } from "./shallow-search-param";

describe("replaceShallowSearchParam", () => {
  const replaceState = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { href: "http://localhost:3000/products?foo=1" },
      history: { replaceState, state: {} },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    replaceState.mockReset();
  });

  it("sets query param without navigation", () => {
    replaceShallowSearchParam("ownerId", "abc123");
    expect(replaceState).toHaveBeenCalledWith(
      {},
      "",
      "/products?foo=1&ownerId=abc123",
    );
  });

  it("removes query param when value is empty", () => {
    replaceShallowSearchParam("foo", null);
    expect(replaceState).toHaveBeenCalledWith({}, "", "/products");
  });
});
