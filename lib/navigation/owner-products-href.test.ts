import { describe, expect, it } from "vitest";
import { resolveOwnerProductsHref } from "@/lib/navigation/owner-products-href";

describe("resolveOwnerProductsHref", () => {
  it("returns admin products path for admin viewers", () => {
    expect(resolveOwnerProductsHref("owner-1", true)).toBe(
      "/admin/products?ownerId=owner-1",
    );
  });

  it("returns portal products path for non-admin viewers", () => {
    expect(resolveOwnerProductsHref("owner-1", false)).toBe(
      "/products?ownerId=owner-1",
    );
  });

  it("returns undefined when owner id missing", () => {
    expect(resolveOwnerProductsHref("", true)).toBeUndefined();
    expect(resolveOwnerProductsHref("", false)).toBeUndefined();
  });
});
