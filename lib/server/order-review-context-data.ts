/**
 * Batch SSR review context for order detail — avoids per-line-item client eligibility calls (REQ-0026).
 */
import {
  getReviewsForProductPage,
  getReviewEligibilityForProduct,
  type ReviewEligibilityResult,
} from "@/lib/server/product-reviews-detail-data";
import type { ProductReview } from "@/types";

export type OrderReviewContext = {
  reviewsByProductId: Record<string, ProductReview[]>;
  eligibilityByProductId: Record<string, ReviewEligibilityResult>;
};

/** Prefetch reviews + eligibility for all unique product IDs on an order (single server round-trip). */
export async function getOrderReviewContextForPage(
  userId: string,
  orderId: string,
  productIds: string[],
): Promise<OrderReviewContext> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return { reviewsByProductId: {}, eligibilityByProductId: {} };
  }

  const entries = await Promise.all(
    uniqueIds.map(async (productId) => {
      const [reviews, eligibility] = await Promise.all([
        getReviewsForProductPage(productId, "all"),
        getReviewEligibilityForProduct(userId, productId, orderId),
      ]);
      return { productId, reviews, eligibility };
    }),
  );

  const reviewsByProductId: Record<string, ProductReview[]> = {};
  const eligibilityByProductId: Record<string, ReviewEligibilityResult> = {};
  for (const { productId, reviews, eligibility } of entries) {
    reviewsByProductId[productId] = reviews;
    eligibilityByProductId[productId] = eligibility;
  }
  return { reviewsByProductId, eligibilityByProductId };
}
