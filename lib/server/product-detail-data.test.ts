/**
 * REQ-0077 — product detail SSR shape: recentOrders.placedBy enrichment.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache", () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  cacheKeys: {
    products: { detail: (id: string) => `products:detail:${id}` },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/products/product-query", () => ({
  mergeProductListWhere: vi.fn((where: object) => where),
}));

vi.mock("@/prisma/product", () => ({
  getProductById: vi.fn(),
}));

vi.mock("@/prisma/supplier", () => ({
  getSupplierByUserId: vi.fn(),
}));

vi.mock("@/prisma/client", () => ({
  prisma: {
    product: { findFirst: vi.fn() },
    category: { findUnique: vi.fn() },
    supplier: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/prisma/client";
import { getProductDetailForPage } from "./product-detail-data";

const session = { id: "admin-1", role: "admin" as const };

describe("getProductDetailForPage recentOrders (REQ-0077)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes placedBy on recentOrders from order.userId lookup", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({
      id: "prod-1",
      name: "Widget",
      sku: "W-1",
      price: 10,
      quantity: 5,
      reservedQuantity: 0,
      status: "Available",
      categoryId: "cat-1",
      supplierId: "sup-1",
      userId: "owner-1",
      createdBy: "owner-1",
      updatedBy: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: null,
      qrCodeUrl: null,
      qrCodeFileId: null,
      imageUrl: null,
      imageFileId: null,
      expirationDate: null,
      orderItems: [
        {
          id: "oi-1",
          orderId: "ord-1",
          quantity: 2,
          price: 10,
          subtotal: 20,
          order: {
            id: "ord-1",
            orderNumber: "ORD-001",
            status: "confirmed",
            subtotal: 20,
            total: 22,
            createdAt: new Date("2026-02-01"),
            userId: "buyer-1",
          },
        },
      ],
    } as never);

    vi.mocked(prisma.category.findUnique).mockResolvedValue({
      id: "cat-1",
      name: "Gadgets",
      description: null,
      status: true,
    } as never);

    vi.mocked(prisma.supplier.findUnique).mockResolvedValue({
      id: "sup-1",
      name: "Acme",
      description: null,
      status: true,
    } as never);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "owner-1",
      email: "owner@test.com",
      name: "Owner",
      image: null,
    } as never);

    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: "buyer-1",
        email: "buyer@test.com",
        name: "Buyer",
        image: "https://example.com/b.jpg",
      },
    ] as never);

    const result = await getProductDetailForPage(session, "prod-1");

    expect(result).not.toBeNull();
    expect(result!.recentOrders).toHaveLength(1);
    expect(result!.recentOrders![0].placedBy).toEqual({
      id: "buyer-1",
      name: "Buyer",
      email: "buyer@test.com",
      image: "https://example.com/b.jpg",
    });
  });
});
