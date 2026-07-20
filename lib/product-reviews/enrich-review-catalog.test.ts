/**
 * REQ-0180 — pure shape guard for productReviews:list:v2 Redis rows.
 */

import { describe, expect, it } from "vitest";
import { hasReviewListV2Shape } from "@/lib/product-reviews/enrich-review-catalog";
import type { ProductReview } from "@/types";

function baseRow(
  overrides: Partial<ProductReview> = {},
): ProductReview {
  return {
    id: "r1",
    productId: "p1",
    userId: "u1",
    orderId: null,
    orderItemId: null,
    productName: "Widget",
    productSku: "SKU-1",
    rating: 5,
    comment: "Great",
    status: "approved",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}

describe("hasReviewListV2Shape", () => {
  it("rejects null cache", () => {
    expect(hasReviewListV2Shape(null)).toBe(false);
  });

  it("accepts empty list (valid v2 miss shape)", () => {
    expect(hasReviewListV2Shape([])).toBe(true);
  });

  it("accepts row with productImageUrl and reviewerImage", () => {
    expect(
      hasReviewListV2Shape([
        baseRow({
          productImageUrl: "https://example.com/a.png",
          reviewerImage: null,
        }),
      ]),
    ).toBe(true);
  });

  it("rejects stale row missing densify keys", () => {
    const stale = baseRow();
    expect(hasReviewListV2Shape([stale])).toBe(false);
  });

  it("rejects row with only one densify key", () => {
    expect(
      hasReviewListV2Shape([baseRow({ productImageUrl: null })]),
    ).toBe(false);
    expect(
      hasReviewListV2Shape([baseRow({ reviewerImage: null })]),
    ).toBe(false);
  });
});
