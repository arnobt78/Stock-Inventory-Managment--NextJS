/**
 * Client Browse Products API
 * GET /api/portal/client/browse-products — products for selected owner/supplier/category
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import { enrichProductsWithCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";

/**
 * GET /api/portal/client/browse-products
 * Query: ownerId (required), supplierId (optional), categoryId (optional)
 * Returns products owned by ownerId, optionally filtered by supplier/category
 * Also returns categories and suppliers for that owner (for filter dropdowns)
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
    if (session.role !== "client") {
      return NextResponse.json(
        { error: "Access denied. Client role required." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const supplierId = searchParams.get("supplierId");
    const categoryId = searchParams.get("categoryId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "ownerId is required" },
        { status: 400 },
      );
    }

    const productWhere: {
      userId: string;
      supplierId?: string;
      categoryId?: string;
    } = { userId: ownerId };
    if (supplierId && supplierId !== "all") productWhere.supplierId = supplierId;
    if (categoryId && categoryId !== "all") productWhere.categoryId = categoryId;

    const [products, allOwnerProducts, ownerUser] = await Promise.all([
      prisma.product.findMany({
        where: mergeProductListWhere(productWhere),
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: mergeProductListWhere({ userId: ownerId }),
        select: { categoryId: true, supplierId: true },
      }),
      prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const categoryIds = [...new Set(allOwnerProducts.map((p) => p.categoryId))];
    const supplierIds = [...new Set(allOwnerProducts.map((p) => p.supplierId))];

    const [categories, suppliers] = await Promise.all([
      prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      }),
      prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

    const transformed = await enrichProductsWithCommittedQuantity(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        quantity: Number(p.quantity),
        reservedQuantity: Number(p.reservedQuantity ?? 0),
        status: p.status,
        categoryId: p.categoryId,
        supplierId: p.supplierId,
        category: categoryMap.get(p.categoryId) || "Unknown",
        supplier: supplierMap.get(p.supplierId) || "Unknown",
        userId: p.userId,
        createdBy: p.createdBy,
        updatedBy: p.updatedBy || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt?.toISOString() || null,
        qrCodeUrl: p.qrCodeUrl || null,
        imageUrl: p.imageUrl || null,
        imageFileId: p.imageFileId || null,
        expirationDate: p.expirationDate?.toISOString() || null,
      })),
    );

    return NextResponse.json({
      products: transformed,
      categories,
      suppliers,
      owner: ownerUser
        ? { id: ownerUser.id, name: ownerUser.name, email: ownerUser.email }
        : undefined,
    });
  } catch (error) {
    logger.error("Error fetching client browse products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
