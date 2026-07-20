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
import {
  hasReviewListV2Shape,
  mapProductReviewsWithCatalog,
} from "@/lib/product-reviews/enrich-review-catalog";
import { getProductReviewDetailForPage } from "@/lib/server/product-review-detail-data";
import { transformProductReviewDetail } from "@/lib/product-reviews/transform-product-review-detail";

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
    const cacheReadStartedAt = Date.now();
    const cached = await getCache<ProductReview[]>(cacheKey);
    if (hasReviewListV2Shape(cached)) return NextResponse.json(cached);

    const records = isAdmin
      ? await getProductReviewsForProductOwner(session.id)
      : await getAllProductReviews();
    const transformed = await mapProductReviewsWithCatalog(records);
    await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
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

    // REQ-0180 — return enriched detail shape (catalog + reviewer)
    const detail = await getProductReviewDetailForPage(
      { id: session.id, role: session.role },
      created.id,
    );
    if (detail) {
      return NextResponse.json(detail, { status: 201 });
    }
    return NextResponse.json(transformProductReviewDetail(created), {
      status: 201,
    });
  } catch (error) {
    logger.error("Error creating product review:", error);
    return NextResponse.json(
      { error: "Failed to create product review" },
      { status: 500 },
    );
  }
}
