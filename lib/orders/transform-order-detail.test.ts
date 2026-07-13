import { describe, expect, it } from "vitest";
import { transformOrderDetail } from "@/lib/orders/transform-order-detail";

describe("transformOrderDetail", () => {
  const baseOrder = {
    id: "ord1",
    orderNumber: "ORD-001",
    userId: "user1",
    clientId: null,
    status: "confirmed",
    paymentStatus: "paid",
    subtotal: 100,
    tax: 10,
    shipping: 5,
    discount: 0,
    total: 115,
    shippingAddress: { name: "Test" },
    billingAddress: null,
    notes: null,
    trackingNumber: null,
    trackingCarrier: null,
    trackingUrl: null,
    labelUrl: null,
    estimatedDelivery: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: null,
    createdBy: "user1",
    updatedBy: null,
    items: [
      {
        id: "item1",
        orderId: "ord1",
        productId: "prod1",
        productName: "Widget",
        sku: "W-1",
        quantity: 2,
        price: 50,
        subtotal: 100,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        product: { categoryId: "cat1", supplierId: "sup1" },
      },
    ],
  };

  it("maps order fields and enrichment to API shape", () => {
    const result = transformOrderDetail(baseOrder, {
      placedByName: "Alice",
      placedByEmail: "alice@test.com",
      orderProductOwners: [
        { userId: "owner1", name: "Owner", email: "owner@test.com" },
      ],
      invoiceForOrder: {
        id: "inv1",
        invoiceNumber: "INV-001",
        paidAt: "2026-01-02T12:00:00.000Z",
      },
    });

    expect(result.orderNumber).toBe("ORD-001");
    expect(result.placedByName).toBe("Alice");
    expect(result.invoiceForOrder?.invoiceNumber).toBe("INV-001");
    expect(result.paidAt).toBe("2026-01-02T12:00:00.000Z");
    expect(result.items[0]?.categoryId).toBe("cat1");
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("includes creator and updater from enrichment (REQ-0096)", () => {
    const result = transformOrderDetail(baseOrder, {
      placedByName: "Alice",
      placedByEmail: "alice@test.com",
      orderProductOwners: [],
      invoiceForOrder: null,
      creator: {
        id: "creator-1",
        name: "Creator",
        email: "creator@test.com",
        image: null,
      },
      updater: {
        id: "updater-1",
        name: "Updater",
        email: "updater@test.com",
        image: null,
      },
    });

    expect(result.creator?.email).toBe("creator@test.com");
    expect(result.updater?.name).toBe("Updater");
  });

  it("omits paidAt when order is not paid", () => {
    const result = transformOrderDetail(
      { ...baseOrder, paymentStatus: "unpaid" },
      {
        placedByName: null,
        placedByEmail: null,
        orderProductOwners: [],
        invoiceForOrder: {
          id: "inv1",
          invoiceNumber: "INV-001",
          paidAt: "2026-01-02T12:00:00.000Z",
        },
      },
    );

    expect(result.paidAt).toBeNull();
  });
});
