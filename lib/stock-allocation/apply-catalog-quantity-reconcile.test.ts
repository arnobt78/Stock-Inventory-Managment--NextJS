import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyCatalogQuantityReconcile } from "./apply-catalog-quantity-reconcile";

const mockProductUpdate = vi.fn();
const mockAllocationUpdate = vi.fn();
const mockAllocationDelete = vi.fn();

vi.mock("@/prisma/client", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        product: { update: mockProductUpdate },
        stockAllocation: {
          update: mockAllocationUpdate,
          delete: mockAllocationDelete,
        },
      }),
    ),
  },
}));

describe("applyCatalogQuantityReconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllocationUpdate.mockResolvedValue({ quantity: BigInt(5) });
  });

  it("updates catalog qty and applies shrink steps", async () => {
    const result = await applyCatalogQuantityReconcile({
      productId: "prod-1",
      newCatalog: 70,
      shrinkSteps: [{ id: "alloc-a", deduct: 10 }],
      productUpdate: { updatedBy: "user-1" },
    });

    expect(result.unitsRemovedFromWarehouses).toBe(10);
    expect(mockProductUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: expect.objectContaining({
        updatedBy: "user-1",
        quantity: BigInt(70),
      }),
    });
    expect(mockAllocationUpdate).toHaveBeenCalledWith({
      where: { id: "alloc-a" },
      data: {
        quantity: { decrement: 10 },
        updatedAt: expect.any(Date),
      },
      select: { quantity: true },
    });
    expect(mockAllocationDelete).not.toHaveBeenCalled();
  });

  it("deletes allocation rows that reach zero quantity", async () => {
    mockAllocationUpdate.mockResolvedValueOnce({ quantity: BigInt(0) });

    await applyCatalogQuantityReconcile({
      productId: "prod-1",
      newCatalog: 50,
      shrinkSteps: [{ id: "alloc-b", deduct: 5 }],
      productUpdate: {},
    });

    expect(mockAllocationDelete).toHaveBeenCalledWith({
      where: { id: "alloc-b" },
    });
  });
});
