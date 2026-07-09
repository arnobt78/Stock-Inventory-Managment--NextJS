/**
 * SSR product reviews + eligibility for detail pages (REQ-0026).
 * Mirrors GET /api/product-reviews/by-product and /api/product-reviews/eligibility.
 */
import { prisma } from "@/prisma/client";
import {
  getReviewsByProductId,
  getEligibleReviewSlots,
} from "@/prisma/product-review";
import type { ProductReview, ReviewEligibilitySlot } from "@/types";

function transformReview(
  r: Awaited<ReturnType<typeof getReviewsByProductId>>[number],
  reviewer?: { name: string | null; image: string | null } | null,
): ProductReview {
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
    reviewerName: reviewer?.name ?? undefined,
    reviewerImage: reviewer?.image ?? undefined,
  };
}

export type ReviewEligibilityResult = {
  eligible: boolean;
  slots: ReviewEligibilitySlot[];
};

/** Approved + pending reviews for product detail display. */
export async function getReviewsForProductPage(
  productId: string,
  status: "approved" | "pending" | "all" = "all",
): Promise<ProductReview[]> {
  const options =
    status === "all" || status === "pending"
      ? { status }
      : { status: "approved" as const };
  const reviews = await getReviewsByProductId(productId, options);
  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, image: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  return reviews.map((r) => transformReview(r, userMap.get(r.userId) ?? null));
}

/** Eligibility slots for the current user to review a product. */
export async function getReviewEligibilityForProduct(
  userId: string,
  productId: string,
  orderId?: string,
): Promise<ReviewEligibilityResult> {
  let slots = await getEligibleReviewSlots(userId, productId);
  if (orderId) {
    slots = slots.filter((s) => s.orderId === orderId);
  }
  return {
    eligible: slots.length > 0,
    slots: slots.map((s) => ({
      orderId: s.orderId,
      orderItemId: s.orderItemId,
    })),
  };
}
