import { describe, expect, it } from "vitest";
import {
  getReservedCommitment,
  planCatalogQuantityReconcile,
} from "./catalog-quantity-reconcile";

describe("getReservedCommitment", () => {
  it("sums product and allocation reserved", () => {
    expect(
      getReservedCommitment(5, [
        { id: "a", quantity: 10, reservedQuantity: 3 },
        { id: "b", quantity: 8, reservedQuantity: 2 },
      ]),
    ).toBe(10);
  });
});

describe("planCatalogQuantityReconcile", () => {
  const allocations = [
    { id: "a", quantity: 50, reservedQuantity: 10 },
    { id: "b", quantity: 30, reservedQuantity: 0 },
  ];

  it("allows catalog increase with no shrink steps", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 150,
      productReserved: 0,
      allocations,
    });
    expect(plan.ok).toBe(true);
    expect(plan.shrinkSteps).toEqual([]);
    expect(plan.unitsRemoved).toBe(0);
  });

  it("allows unchanged catalog", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 100,
      productReserved: 0,
      allocations,
    });
    expect(plan.ok).toBe(true);
    expect(plan.shrinkSteps).toEqual([]);
  });

  it("allows decrease when total allocated stays under new catalog", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 90,
      productReserved: 0,
      allocations,
    });
    expect(plan.ok).toBe(true);
    expect(plan.overage).toBe(0);
    expect(plan.shrinkSteps).toEqual([]);
  });

  it("plans greedy shrink of unreserved warehouse stock", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 70,
      productReserved: 0,
      allocations,
    });
    expect(plan.ok).toBe(true);
    expect(plan.overage).toBe(10);
    expect(plan.unitsRemoved).toBe(10);
    expect(plan.shrinkSteps).toEqual([{ id: "a", deduct: 10 }]);
  });

  it("blocks when new catalog is below reserved commitment", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 5,
      productReserved: 2,
      allocations: [{ id: "a", quantity: 80, reservedQuantity: 75 }],
    });
    expect(plan.ok).toBe(false);
    expect(plan.blockedReason).toContain("reserved");
  });

  it("shrinks exactly when overage equals unreserved warehouse stock", () => {
    const plan = planCatalogQuantityReconcile({
      currentCatalog: 100,
      newCatalog: 94,
      productReserved: 0,
      allocations: [
        { id: "a", quantity: 90, reservedQuantity: 88 },
        { id: "b", quantity: 10, reservedQuantity: 6 },
      ],
    });
    expect(plan.ok).toBe(true);
    expect(plan.overage).toBe(6);
    expect(plan.unitsRemoved).toBe(6);
    expect(plan.shrinkSteps.reduce((sum, step) => sum + step.deduct, 0)).toBe(6);
  });
});
