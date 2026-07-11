/**
 * Product Reviews API Route Handler
 * GET /api/product-reviews — list all (admin)
 * POST /api/product-reviews — create review
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  createProductReview,
  getAllProductReviews,
  getProductReviewsForProductOwner,
  hasExistingReview,
  getEligibleReviewSlots,
} from "@/prisma/product-review";
import { createProductReviewSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createProductReviewSubmittedNotification } from "@/lib/notifications/in-app";
import { cacheKeys, getCache, scheduleInvalidateProductReviewCaches, setCache } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import type { ProductReview } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getAllProductReviews>>[number],
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
 * GET /api/product-reviews
 * Fetch product reviews. For admins: only reviews for products they own (product owner). Uses cache.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.role === "admin";
    const cacheFilter = isAdmin
      ? { productOwnerId: session.id }
      : {};
    const cacheKey = cacheKeys.productReviews.list(cacheFilter);
    const cached = await getCache<ProductReview[]>(cacheKey);
    const first = cached?.[0];
    const hasReviewerInfo =
      cached != null &&
      (cached.length === 0 || (first != null && ("reviewerName" in first || "reviewerEmail" in first)));
    if (cached && hasReviewerInfo) return NextResponse.json(cached);

    const records = isAdmin
      ? await getProductReviewsForProductOwner(session.id)
      : await getAllProductReviews();
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
    await setCache(cacheKey, transformed, 300);
    return NextResponse.json(transformed);
  } catch (error) {
    logger.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch product reviews" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/product-reviews
 * Create a new product review.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();
    const parsed = createProductReviewSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid product review creation data", {
        errors: parsed.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.orderId) {
      const existing = await hasExistingReview(
        data.orderId,
        data.productId,
        userId,
      );
      if (existing) {
        return NextResponse.json(
          { error: "You have already submitted a review for this purchase." },
          { status: 409 },
        );
      }
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { paymentStatus: true, clientId: true, userId: true },
      });
      if (!order) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 },
        );
      }
      if (order.paymentStatus !== "paid") {
        return NextResponse.json(
          { error: "You can only review after the order is paid." },
          { status: 400 },
        );
      }
      const isBuyer =
        order.clientId === userId || (order.userId === userId && !order.clientId);
      if (!isBuyer) {
        return NextResponse.json(
          { error: "You can only review your own purchases." },
          { status: 403 },
        );
      }
    }

    const created = await createProductReview(
      {
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        orderId: data.orderId,
        orderItemId: data.orderItemId,
      },
      userId,
    );
    await scheduleInvalidateProductReviewCaches();
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { userId: true, name: true },
    });
    createAuditLog({
      userId,
      action: "create",
      entityType: "review",
      entityId: created.id,
      details: { productName: product?.name, rating: created.rating },
    }).catch(() => {});

    // Notify product owner when someone else reviews their product (non-blocking)
    if (product && product.userId && product.userId !== userId) {
      const reviewerDisplay =
        session.name?.trim() || session.email || "A customer";
      createProductReviewSubmittedNotification(
        product.userId,
        created.id,
        product.name,
        reviewerDisplay,
      ).catch((err) => {
        logger.warn("Failed to create product review notification", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    return NextResponse.json(transform(created), { status: 201 });
  } catch (error) {
    logger.error("Error creating product review:", error);
    return NextResponse.json(
      { error: "Failed to create product review" },
      { status: 500 },
    );
  }
}
