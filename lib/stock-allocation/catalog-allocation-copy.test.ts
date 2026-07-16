import { describe, expect, it } from "vitest";
import {
  formatCatalogAllocationDetailSummary,
  formatCatalogAllocationSummary,
  formatCatalogCommitWarehouseHint,
} from "./catalog-allocation-copy";

describe("catalog-allocation-copy", () => {
  it("formatCatalogAllocationSummary", () => {
    expect(formatCatalogAllocationSummary(50, 30, 20)).toBe(
      "Catalog 50 · Allocated 30 · Unallocated 20",
    );
  });

  it("formatCatalogAllocationDetailSummary with reserved", () => {
    expect(formatCatalogAllocationDetailSummary(25, 20, 5, 20)).toBe(
      "Catalog 25 · Allocated 20 · Unallocated 5 · 20 Reserved",
    );
  });

  it("formatCatalogAllocationDetailSummary omits reserved when zero", () => {
    expect(formatCatalogAllocationDetailSummary(50, 30, 20, 0)).toBe(
      "Catalog 50 · Allocated 30 · Unallocated 20",
    );
  });

  it("formatCatalogCommitWarehouseHint", () => {
    expect(formatCatalogCommitWarehouseHint(20)).toBe(
      "20 on catalog orders — warehouse row unchanged until fulfilled",
    );
  });
});
