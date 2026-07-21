/**
 * GET /api/product-reviews/by-product/:productId
 * List reviews for a product (approved by default; optional status=all for pending too).
 * REQ-0202 — reviewerEmail densify (parity with SSR getReviewsForProductPage).
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { getReviewsByProductId } from "@/prisma/product-review";
import { prisma } from "@/prisma/client";
import type { ProductReview } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getReviewsByProductId>>[number],
  reviewer?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null,
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
    reviewerEmail: reviewer?.email ?? undefined,
    reviewerImage: reviewer?.image ?? undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "approved" | "pending" | "all" | null;
    const options =
      status === "all" || status === "pending"
        ? { status: status ?? "approved" }
        : {};

    const reviews = await getReviewsByProductId(productId, options);
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, image: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const transformed = reviews.map((r) =>
      transform(r, userMap.get(r.userId) ?? null),
    );
    return NextResponse.json(transformed);
  } catch (error) {
    logger.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
