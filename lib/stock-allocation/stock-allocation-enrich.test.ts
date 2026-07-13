import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  attachProductAllocationTotals,
  enrichStockAllocationRows,
  enrichWarehouseAllocationRows,
  fetchStockAllocationProductMap,
  getProductAllocationTotalsMap,
  transformStockAllocationRow,
  type StockAllocationProductSnapshot,
} from "./stock-allocation-enrich";
import type { StockAllocation } from "@/types";

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
    stockAllocation: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";

const baseRow = {
  id: "alloc-1",
  productId: "prod-1",
  warehouseId: "wh-1",
  quantity: 10,
  reservedQuantity: 2,
  userId: "user-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("transformStockAllocationRow", () => {
  it("maps product + warehouse when both exist in lookup maps", () => {
    const productMap = new Map<string, StockAllocationProductSnapshot>([
      [
        "prod-1",
        {
          name: "Widget",
          sku: "W-1",
          imageUrl: "https://example.com/w.jpg",
          price: 19.99,
          quantity: 100,
          categoryId: "cat-1",
          categoryName: "Gadgets",
          supplierId: "sup-1",
          supplierName: "Acme",
          deletedAt: null,
          isArchived: false,
        },
      ],
    ]);
    const warehouseMap = new Map([
      ["wh-1", { name: "Main WH", status: true }],
    ]);

    const result = transformStockAllocationRow(
      baseRow,
      productMap,
      warehouseMap,
    );

    expect(result).toMatchObject({
      id: "alloc-1",
      quantity: 10,
      reservedQuantity: 2,
      product: {
        id: "prod-1",
        name: "Widget",
        sku: "W-1",
        categoryName: "Gadgets",
        supplierName: "Acme",
      },
      warehouse: { id: "wh-1", name: "Main WH", status: true },
    });
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("omits product and warehouse when missing from maps", () => {
    const result = transformStockAllocationRow(
      baseRow,
      new Map(),
      new Map(),
    );

    expect(result.product).toBeUndefined();
    expect(result.warehouse).toBeUndefined();
    expect(result.quantity).toBe(10);
    expect(result.reservedQuantity).toBe(2);
  });

  it("coerces numeric fields from unknown Prisma values", () => {
    const result = transformStockAllocationRow(
      { ...baseRow, quantity: "5", reservedQuantity: "1", updatedAt: null },
      new Map(),
      new Map(),
    );

    expect(result.quantity).toBe(5);
    expect(result.reservedQuantity).toBe(1);
    expect(result.updatedAt).toBeNull();
  });
});

describe("fetchStockAllocationProductMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty map without querying when productIds is empty", async () => {
    const map = await fetchStockAllocationProductMap([]);

    expect(map.size).toBe(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("loads products with category and supplier labels", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: "prod-1",
        name: "Widget",
        sku: "W-1",
        imageUrl: null,
        price: 9.5,
        quantity: 50,
        categoryId: "cat-1",
        supplierId: "sup-1",
        deletedAt: null,
      },
    ] as never);
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: "cat-1", name: "Gadgets" },
    ] as never);
    vi.mocked(prisma.supplier.findMany).mockResolvedValue([
      { id: "sup-1", name: "Acme" },
    ] as never);

    const map = await fetchStockAllocationProductMap(["prod-1"]);

    expect(map.get("prod-1")).toEqual({
      name: "Widget",
      sku: "W-1",
      imageUrl: null,
      price: 9.5,
      quantity: 50,
      categoryId: "cat-1",
      categoryName: "Gadgets",
      supplierId: "sup-1",
      supplierName: "Acme",
      deletedAt: null,
      isArchived: false,
    });
  });
});

describe("attachProductAllocationTotals", () => {
  it("merges allocated and unallocated onto product snapshots", () => {
    const rows: StockAllocation[] = [
      {
        id: "alloc-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 30,
        reservedQuantity: 0,
        userId: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: null,
        product: {
          id: "prod-1",
          name: "Widget",
          sku: "W-1",
          quantity: 100,
        },
      },
    ];
    const totalsMap = new Map([
      ["prod-1", { allocatedTotal: 70, unallocated: 30 }],
    ]);

    const result = attachProductAllocationTotals(rows, totalsMap);
    expect(result[0].product).toMatchObject({
      allocatedTotal: 70,
      unallocated: 30,
    });
  });
});

describe("getProductAllocationTotalsMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sums allocations across all warehouses per product", async () => {
    vi.mocked(prisma.stockAllocation.findMany).mockResolvedValue([
      { productId: "prod-1", quantity: BigInt(40) },
      { productId: "prod-1", quantity: BigInt(25) },
    ] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", quantity: BigInt(100) },
    ] as never);

    const map = await getProductAllocationTotalsMap(["prod-1"]);
    expect(map.get("prod-1")).toEqual({
      allocatedTotal: 65,
      unallocated: 35,
    });
  });
});

describe("enrichWarehouseAllocationRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches cross-warehouse totals for warehouse-scoped rows", async () => {
    vi.mocked(prisma.stockAllocation.findMany).mockResolvedValue([
      { productId: "prod-1", quantity: BigInt(40) },
      { productId: "prod-1", quantity: BigInt(25) },
    ] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", quantity: BigInt(100) },
    ] as never);

    const rows: StockAllocation[] = [
      {
        id: "alloc-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 40,
        reservedQuantity: 0,
        userId: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: null,
        product: { id: "prod-1", name: "Widget", sku: "W-1", quantity: 100 },
      },
    ];

    const result = await enrichWarehouseAllocationRows(rows);
    expect(result[0].product).toMatchObject({
      allocatedTotal: 65,
      unallocated: 35,
    });
  });
});

describe("enrichStockAllocationRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to DB-backed cross-warehouse totals (REQ-0102)", async () => {
    vi.mocked(prisma.stockAllocation.findMany).mockResolvedValue([
      { productId: "prod-1", quantity: BigInt(40) },
    ] as never);
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "prod-1", quantity: BigInt(100) },
    ] as never);

    const rows: StockAllocation[] = [
      {
        id: "alloc-1",
        productId: "prod-1",
        warehouseId: "wh-1",
        quantity: 40,
        reservedQuantity: 0,
        userId: "user-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: null,
        product: { id: "prod-1", name: "Widget", sku: "W-1", quantity: 100 },
      },
    ];

    const result = await enrichStockAllocationRows(rows);
    expect(result[0].product).toMatchObject({
      allocatedTotal: 40,
      unallocated: 60,
    });
  });
});
