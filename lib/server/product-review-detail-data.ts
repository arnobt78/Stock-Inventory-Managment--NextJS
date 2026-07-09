/**
 * Server-side product review detail fetch for SSR prefetch.
 * Mirrors GET /api/product-reviews/:id auth + response shape.
 * REQ-0024
 */

import { prisma } from "@/prisma/client";
import { getProductReviewById } from "@/prisma/product-review";
import { transformProductReviewDetail } from "@/lib/product-reviews/transform-product-review-detail";
import type { ProductReview } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

export type ProductReviewDetailForPage = ProductReview & {
  reviewerName?: string | null;
  reviewerEmail?: string;
};

/** Role-scoped product review detail for page SSR — null when not found or unauthorized. */
export async function getProductReviewDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<ProductReviewDetailForPage | null> {
  const record = await getProductReviewById(id);
  if (!record) return null;

  if (session.role === "admin") {
    const product = await prisma.product.findUnique({
      where: { id: record.productId },
      select: { userId: true },
    });
    if (product?.userId !== session.id) return null;
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { name: true, email: true },
  });

  return transformProductReviewDetail(record, reviewer);
}
