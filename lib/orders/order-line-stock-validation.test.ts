/**
 * REQ-0106/0110 — order-line stock validation tests (Beats scenario + caps).
 */

import { describe, expect, it } from "vitest";
import {
  AUTO_WAREHOUSE_VALUE,
  formatOrderLineAutoAssignHint,
  buildOrderLineWarehousePickOptions,
  getOrderLineCatalogAvailable,
  getOrderLineCatalogAvailableFromProduct,
  getOrderLineWarehouseAvailable,
  resolveOrderLineHasAllocations,
  mapStockAllocationsToOrderLineRows,
  validateOrderLineStock,
  validateOrderLineStockForItem,
} from "./order-line-stock-validation";
import type { StockAllocation } from "@/types";

describe("order-line-stock-validation", () => {
  const beatsProduct = { quantity: 50, reservedQuantity: 0 };
  const beatsAllocations = [
    { warehouseId: "wh-main", quantity: 30, reservedQuantity: 0 },
  ];

  it("getOrderLineCatalogAvailable — Beats 50 catalog, 30 allocated, 0 reserved", () => {
    expect(
      getOrderLineCatalogAvailable(50, 0, [{ reservedQuantity: 0 }]),
    ).toBe(50);
  });

  it("getOrderLineCatalogAvailable — subtracts disjoint commitment after order", () => {
    expect(
      getOrderLineCatalogAvailable(50, 0, [{ reservedQuantity: 20 }]),
    ).toBe(30);
  });

  it("getOrderLineWarehouseAvailable", () => {
    expect(getOrderLineWarehouseAvailable(30, 20)).toBe(10);
  });

  it("auto mode allows 40 when catalog 50 and 20 unallocated (Beats)", () => {
    const result = validateOrderLineStock({
      qty: 40,
      product: beatsProduct,
      allocations: beatsAllocations,
      warehouseId: AUTO_WAREHOUSE_VALUE,
      hasAllocations: true,
    });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("auto");
    expect(result.maxQty).toBe(50);
  });

  it("manual mode blocks 40 when warehouse only has 30 available", () => {
    const result = validateOrderLineStock({
      qty: 40,
      product: beatsProduct,
      allocations: beatsAllocations,
      warehouseId: "wh-main",
      hasAllocations: true,
    });
    expect(result.ok).toBe(false);
    expect(result.mode).toBe("manual");
    expect(result.maxQty).toBe(30);
  });

  it("manual mode error includes warehouse name when provided", () => {
    const result = validateOrderLineStock({
      qty: 40,
      product: beatsProduct,
      allocations: [
        {
          warehouseId: "wh-main",
          quantity: 30,
          reservedQuantity: 0,
          warehouse: { name: "Main Warehouse" },
        },
      ],
      warehouseId: "wh-main",
      hasAllocations: true,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Max 30 at Main Warehouse");
  });

  it("committedQuantity fallback when allocation cache empty", () => {
    expect(
      getOrderLineCatalogAvailableFromProduct(
        { quantity: 50, reservedQuantity: 0, committedQuantity: 20 },
        [],
      ),
    ).toBe(30);

    const result = validateOrderLineStock({
      qty: 40,
      product: { quantity: 50, reservedQuantity: 0, committedQuantity: 20 },
      allocations: [],
      warehouseId: AUTO_WAREHOUSE_VALUE,
    });
    expect(result.ok).toBe(false);
    expect(result.maxQty).toBe(30);
    expect(result.mode).toBe("auto");
  });

  it("resolveOrderLineHasAllocations hints warehouse-tracked before cache loads", () => {
    expect(
      resolveOrderLineHasAllocations(
        { quantity: 50, reservedQuantity: 0, committedQuantity: 20 },
        [],
      ),
    ).toBe(true);
    expect(
      resolveOrderLineHasAllocations(
        { quantity: 50, reservedQuantity: 0, committedQuantity: 0 },
        [],
      ),
    ).toBe(false);
  });

  it("auto mode blocks 40 after 20 reserved on allocation", () => {
    const result = validateOrderLineStock({
      qty: 40,
      product: { quantity: 50, reservedQuantity: 0 },
      allocations: [{ warehouseId: "wh-main", quantity: 30, reservedQuantity: 20 }],
      warehouseId: undefined,
      hasAllocations: true,
    });
    expect(result.ok).toBe(false);
    expect(result.maxQty).toBe(30);
  });

  it("catalog-only product uses product reserved", () => {
    const okResult = validateOrderLineStock({
      qty: 2,
      product: { quantity: 10, reservedQuantity: 8 },
      allocations: [],
      hasAllocations: false,
    });
    expect(okResult.ok).toBe(true);
    expect(okResult.maxQty).toBe(2);
    expect(okResult.mode).toBe("catalog");

    const overResult = validateOrderLineStock({
      qty: 5,
      product: { quantity: 10, reservedQuantity: 8 },
      allocations: [],
      hasAllocations: false,
    });
    expect(overResult.ok).toBe(false);
  });

  it("formatOrderLineAutoAssignHint", () => {
    expect(formatOrderLineAutoAssignHint(50)).toContain("50");
    expect(formatOrderLineAutoAssignHint(50)).toContain("unallocated");
  });

  it("mapStockAllocationsToOrderLineRows maps API rows", () => {
    const rows: StockAllocation[] = [
      {
        id: "a1",
        productId: "p1",
        warehouseId: "wh1",
        quantity: 30,
        reservedQuantity: 5,
        warehouse: { id: "wh1", name: "Main" },
      } as StockAllocation,
    ];
    expect(mapStockAllocationsToOrderLineRows(rows)).toEqual([
      {
        warehouseId: "wh1",
        quantity: 30,
        reservedQuantity: 5,
        warehouse: { id: "wh1", name: "Main" },
      },
    ]);
  });

  it("validateOrderLineStockForItem matches validateOrderLineStock", () => {
    const result = validateOrderLineStockForItem(
      beatsProduct,
      { productId: "p1", quantity: 40, warehouseId: "wh-main" },
      beatsAllocations,
    );
    expect(result.ok).toBe(false);
    expect(result.maxQty).toBe(30);
  });

  it("buildOrderLineWarehousePickOptions sorts by available desc", () => {
    const options = buildOrderLineWarehousePickOptions(
      [
        { warehouseId: "wh-a", quantity: 10, reservedQuantity: 0 },
        { warehouseId: "wh-b", quantity: 30, reservedQuantity: 10, warehouse: { name: "Main" } },
      ],
      null,
    );
    expect(options).toEqual([
      { warehouseId: "wh-b", name: "Main", available: 20 },
      { warehouseId: "wh-a", name: "Warehouse", available: 10 },
    ]);
  });

  it("buildOrderLineWarehousePickOptions keeps selected warehouse when avail 0", () => {
    const options = buildOrderLineWarehousePickOptions(
      [{ warehouseId: "wh-main", quantity: 30, reservedQuantity: 30 }],
      "wh-main",
    );
    expect(options).toEqual([
      { warehouseId: "wh-main", name: "Warehouse", available: 0 },
    ]);
  });
});
