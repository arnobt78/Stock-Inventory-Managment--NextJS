/**
 * Server-side data fetching for admin Product Reviews page SSR
 * Fetches only reviews for products owned by the given admin (product owner).
 * Uses same cache key as GET /api/product-reviews when admin (productOwnerId).
 * Only import from server code (e.g. app/admin/product-reviews/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import { getProductReviewsForProductOwner } from "@/prisma/product-review";
import { prisma } from "@/prisma/client";
import type { ProductReview } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getProductReviewsForProductOwner>>[number],
  userMap?: Map<string, { name: string | null; email: string }>,
): ProductReview {
  const reviewer = userMap?.get(r.userId);
  return {
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
    reviewerName: reviewer?.name ?? null,
    reviewerEmail: reviewer?.email,
  };
}

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
  const first = cached?.[0];
  const hasReviewerInfo =
    cached != null &&
    (cached.length === 0 || (first != null && ("reviewerName" in first || "reviewerEmail" in first)));
  if (cached && hasReviewerInfo) return cached;

  const records = await getProductReviewsForProductOwner(productOwnerId);
  const userIds = [...new Set(records.map((r) => r.userId))];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]));
  const transformed = records.map((r) => transform(r, userMap));
  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}
