import { describe, expect, it } from "vitest";
import {
  mergeOrderItemsPreservingDensify,
  omitUndefinedFields,
} from "./merge-order-items-densify";
import type { OrderItem } from "@/types";

const dense: OrderItem = {
  id: "li1",
  orderId: "o1",
  productId: "p1",
  productName: "Beats",
  quantity: 1,
  price: 199,
  subtotal: 199,
  createdAt: "2026-07-25T00:00:00.000Z",
  categoryId: "c1",
  categoryName: "Headphone",
  supplierId: "s1",
  supplierName: "Test Supplier",
  imageUrl: "https://example.com/a.jpg",
  proportionalAmount: 178.12,
};

describe("mergeOrderItemsPreservingDensify", () => {
  it("keeps category/supplier when PUT item is thin", () => {
    const thin: OrderItem = {
      ...dense,
      categoryName: null,
      supplierName: null,
      imageUrl: null,
      proportionalAmount: undefined,
      categoryId: "c1",
      supplierId: "s1",
    };
    const merged = mergeOrderItemsPreservingDensify([dense], [thin]);
    expect(merged?.[0]).toMatchObject({
      categoryName: "Headphone",
      supplierName: "Test Supplier",
      imageUrl: "https://example.com/a.jpg",
      proportionalAmount: 178.12,
      price: 199,
    });
  });
});

describe("omitUndefinedFields", () => {
  it("drops undefined keys", () => {
    expect(omitUndefinedFields({ a: 1, b: undefined, c: null })).toEqual({
      a: 1,
      c: null,
    });
  });
});
