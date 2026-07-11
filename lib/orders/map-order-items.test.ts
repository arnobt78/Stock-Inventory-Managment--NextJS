import { describe, expect, it } from "vitest";
import { mapOrderItemsFromRaw } from "@/lib/orders/map-order-items";

describe("mapOrderItemsFromRaw", () => {
  it("maps product imageUrl, categoryId, supplierId onto OrderItem", () => {
    const createdAt = new Date("2026-01-15T10:00:00.000Z");
    const result = mapOrderItemsFromRaw([
      {
        id: "item1",
        orderId: "ord1",
        productId: "prod1",
        productName: "Widget",
        sku: "W-1",
        quantity: 2,
        price: 10,
        subtotal: 20,
        createdAt,
        product: {
          categoryId: "cat1",
          supplierId: "sup1",
          imageUrl: "https://ik.imagekit.io/example/widget.jpg",
        },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "item1",
      productName: "Widget",
      categoryId: "cat1",
      supplierId: "sup1",
      imageUrl: "https://ik.imagekit.io/example/widget.jpg",
      createdAt: createdAt.toISOString(),
    });
  });

  it("returns empty array for undefined items", () => {
    expect(mapOrderItemsFromRaw(undefined)).toEqual([]);
  });

  it("nulls product fields when product relation missing", () => {
    const result = mapOrderItemsFromRaw([
      {
        id: "item2",
        orderId: "ord1",
        productId: "prod2",
        productName: "Legacy",
        sku: null,
        quantity: 1,
        price: 5,
        subtotal: 5,
        createdAt: new Date(),
        product: null,
      },
    ]);

    expect(result[0].imageUrl).toBeNull();
    expect(result[0].categoryId).toBeNull();
    expect(result[0].supplierId).toBeNull();
  });
});
