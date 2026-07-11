/**
 * Product Review Detail API Route Handler
 * GET /api/product-reviews/:id — fetch one
 * PUT /api/product-reviews/:id — update (status, rating, comment)
 * DELETE /api/product-reviews/:id — delete
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import {
  getProductReviewById,
  updateProductReview,
  deleteProductReview,
} from "@/prisma/product-review";
import { updateProductReviewSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createAuditLog } from "@/prisma/audit-log";
import type { UpdateProductReviewInput } from "@/types";
import { getProductReviewDetailForPage } from "@/lib/server/product-review-detail-data";
import { transformProductReviewDetail } from "@/lib/product-reviews/transform-product-review-detail";
import { scheduleInvalidateProductReviewCaches } from "@/lib/cache";

/**
 * GET /api/product-reviews/:id
 * Returns review with reviewer name/email when available. Admin may only access reviews for their own products.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const detail = await getProductReviewDetailForPage(
      { id: session.id, role: session.role },
      id,
    );
    if (!detail) {
      const record = await getProductReviewById(id);
      if (!record) {
        return NextResponse.json(
          { error: "Product review not found" },
          { status: 404 },
        );
      }
      if (session.role === "admin") {
        return NextResponse.json(
          { error: "You can only view reviews for your own products." },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "Product review not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    logger.error("Error fetching product review:", error);
    return NextResponse.json(
      { error: "Failed to fetch product review" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/product-reviews/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const existing = await getProductReviewById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Product review not found" },
        { status: 404 },
      );
    }

    const isAuthor = existing.userId === session.id;
    const product = await prisma.product.findUnique({
      where: { id: existing.productId },
      select: { userId: true },
    });
    const isProductOwner = product?.userId === session.id;
    const isAdmin = session.role === "admin";

    const body = await request.json();
    const parsed = updateProductReviewSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid product review update data", {
        errors: parsed.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updatePayload: UpdateProductReviewInput = {};
    if (data.status != null) {
      if (isAuthor && !isAdmin && !isProductOwner) {
        return NextResponse.json(
          { error: "Only product owner or admin can change status." },
          { status: 403 },
        );
      }
      updatePayload.status = data.status;
    }
    if (data.rating != null) {
      if (!isAuthor && !isAdmin && !isProductOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updatePayload.rating = data.rating;
    }
    if (data.comment != null) {
      if (!isAuthor && !isAdmin && !isProductOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      updatePayload.comment = data.comment;
    }

    const updated = await updateProductReview(id, updatePayload);
    await scheduleInvalidateProductReviewCaches();
    const productForAudit = await prisma.product.findUnique({
      where: { id: updated.productId },
      select: { name: true },
    });
    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "review",
      entityId: id,
      details: { productName: productForAudit?.name },
    }).catch(() => {});

    const reviewer = await prisma.user.findUnique({
      where: { id: updated.userId },
      select: { name: true, email: true },
    });
    return NextResponse.json(transformProductReviewDetail(updated, reviewer));
  } catch (error) {
    logger.error("Error updating product review:", error);
    return NextResponse.json(
      { error: "Failed to update product review" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/product-reviews/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const existing = await getProductReviewById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Product review not found" },
        { status: 404 },
      );
    }
    const isAuthor = existing.userId === session.id;
    const product = await prisma.product.findUnique({
      where: { id: existing.productId },
      select: { userId: true, name: true },
    });
    const isProductOwner = product?.userId === session.id;
    const isAdmin = session.role === "admin";
    if (!isAuthor && !isAdmin && !isProductOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteProductReview(id);
    await scheduleInvalidateProductReviewCaches();
    createAuditLog({
      userId: session.id,
      action: "delete",
      entityType: "review",
      entityId: id,
      details: { productName: product?.name },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting product review:", error);
    return NextResponse.json(
      { error: "Failed to delete product review" },
      { status: 500 },
    );
  }
}
