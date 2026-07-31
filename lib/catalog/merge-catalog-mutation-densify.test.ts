import { describe, expect, it } from "vitest";
import { mergeCatalogMutationIntoDetail } from "./merge-catalog-mutation-densify";

describe("mergeCatalogMutationIntoDetail", () => {
  it("keeps creator/supplier objects when PATCH returns thin strings/ids", () => {
    const old = {
      id: "p1",
      quantity: 50,
      creator: { id: "u1", email: "a@b.com", name: "Admin" },
      supplier: { id: "s1", name: "Sup", email: "s@x.com" },
      productInsights: { totalStock: 50 },
    };
    const patch = {
      id: "p1",
      quantity: 10,
      supplier: "Sup",
      category: "Cat",
      createdBy: "u1",
    };
    const merged = mergeCatalogMutationIntoDetail(
      old,
      patch as unknown as typeof old,
    );
    expect(merged.quantity).toBe(10);
    expect(merged.creator).toEqual(old.creator);
    expect(merged.supplier).toEqual(old.supplier);
    expect(merged.productInsights).toEqual(old.productInsights);
  });

  it("returns patch when no prior detail cache", () => {
    const patch = { id: "p1", quantity: 5, supplier: "Sup" };
    expect(mergeCatalogMutationIntoDetail(undefined, patch)).toEqual(patch);
  });
});
