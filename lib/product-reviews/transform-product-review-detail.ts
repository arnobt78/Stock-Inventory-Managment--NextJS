/**
 * Shared product review detail response transform — used by API GET/PUT and SSR prefetch.
 * REQ-0024: single source of truth for product review detail JSON shape.
 */

import type { ProductReview } from "@/types";
import type { getProductReviewById } from "@/prisma/product-review";

type ProductReviewRecord = NonNullable<
  Awaited<ReturnType<typeof getProductReviewById>>
>;

export function transformProductReviewDetail(
  r: ProductReviewRecord,
  reviewer?: { name: string | null; email: string } | null,
): ProductReview & { reviewerName?: string | null; reviewerEmail?: string } {
  const base: ProductReview = {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    orderId: r.orderId,
    orderItemId: r.orderItemId ?? null,
    productName: r.productName,
    productSku: r.productSku,
    rating: r.rating,
    comment: r.comment,
    status: r.status as ProductReview["status"],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
  if (reviewer) {
    return {
      ...base,
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
    };
  }
  return base;
}
