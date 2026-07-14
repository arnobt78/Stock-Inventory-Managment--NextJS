import { describe, expect, it } from "vitest";
import { computeCatalogReconcilePreview } from "@/hooks/use-catalog-quantity-reconcile-preview";

describe("computeCatalogReconcilePreview", () => {
  const product = { quantity: 50, reservedQuantity: 0 };
  const allocations = [
    { id: "a1", quantity: 30, reservedQuantity: 20 },
  ];

  it("blocks below reserved commitment live", () => {
    const preview = computeCatalogReconcilePreview({
      selectedProduct: product,
      allocations,
      quantityRaw: 10,
    });
    expect(preview.ok).toBe(false);
    expect(preview.blockedReason).toContain("20");
    expect(preview.reservedCommitment).toBe(20);
  });

  it("shows shrink units when lowering catalog", () => {
    const preview = computeCatalogReconcilePreview({
      selectedProduct: product,
      allocations,
      quantityRaw: 25,
    });
    expect(preview.ok).toBe(true);
    expect(preview.shrinkUnits).toBe(5);
  });
});
