import { describe, expect, it } from "vitest";
import {
  resolveOwnerProductsHref,
  PARTY_SELF_LINK_CLASS,
} from "@/lib/navigation/owner-products-href";

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

describe("PARTY_SELF_LINK_CLASS", () => {
  it("includes gray/white self tone classes", () => {
    expect(PARTY_SELF_LINK_CLASS).toContain("text-gray-700");
    expect(PARTY_SELF_LINK_CLASS).toContain("dark:text-white");
  });
});
