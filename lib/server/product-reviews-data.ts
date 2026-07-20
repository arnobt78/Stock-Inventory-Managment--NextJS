/**
 * Server-side data fetching for admin Product Reviews page SSR
 * Fetches only reviews for products owned by the given admin (product owner).
 * Uses same cache key as GET /api/product-reviews when admin (productOwnerId).
 * Only import from server code (e.g. app/admin/product-reviews/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { getProductReviewsForProductOwner } from "@/prisma/product-review";
import {
  hasReviewListV2Shape,
  mapProductReviewsWithCatalog,
} from "@/lib/product-reviews/enrich-review-catalog";
import type { ProductReview } from "@/types";

/**
 * Fetch product reviews for admin list — only reviews for products owned by this admin.
 * @param productOwnerId - Current admin user id (product owner). Only their products' reviews are returned.
 */
export async function getProductReviewsForAdmin(
  productOwnerId: string,
): Promise<ProductReview[]> {
  const cacheKey = cacheKeys.productReviews.list({ productOwnerId });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<ProductReview[]>(cacheKey);
  if (hasReviewListV2Shape(cached)) return cached;

  const records = await getProductReviewsForProductOwner(productOwnerId);
  const transformed = await mapProductReviewsWithCatalog(records);
  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}
