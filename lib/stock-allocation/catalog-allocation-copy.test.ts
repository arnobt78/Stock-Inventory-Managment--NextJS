import { describe, expect, it } from "vitest";
import {
  formatCatalogAllocationDetailSummary,
  formatCatalogAllocationSummary,
} from "./catalog-allocation-copy";

describe("catalog-allocation-copy", () => {
  it("formatCatalogAllocationSummary", () => {
    expect(formatCatalogAllocationSummary(50, 30, 20)).toBe(
      "Catalog 50 · allocated 30 · unallocated 20",
    );
  });

  it("formatCatalogAllocationDetailSummary with reserved", () => {
    expect(formatCatalogAllocationDetailSummary(25, 20, 5, 20)).toBe(
      "Catalog 25 · allocated 20 · unallocated 5 · 20 reserved",
    );
  });

  it("formatCatalogAllocationDetailSummary omits reserved when zero", () => {
    expect(formatCatalogAllocationDetailSummary(50, 30, 20, 0)).toBe(
      "Catalog 50 · allocated 30 · unallocated 20",
    );
  });
});
