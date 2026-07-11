/**
 * Stock Allocations API Route Handler
 * GET /api/stock-allocations — list stock allocations
 * POST /api/stock-allocations — create/upsert stock allocation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getStockAllocations,
  getStockAllocationsByProduct,
  upsertStockAllocation,
  getWarehouseStockSummary,
} from "@/prisma/stock-allocation";
import { prisma } from "@/prisma/client";
import { findAccessibleProduct } from "@/lib/products/stock-product-access";
import { getCache, setCache, cacheKeys, scheduleInvalidateStockAllocationCaches } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createStockAllocationSchema } from "@/lib/validations";
import type { StockAllocation, WarehouseStockSummary } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getStockAllocations>>[number],
  productMap: Map<string, { name: string; sku: string; imageUrl: string | null }>,
  warehouseMap: Map<string, string>,
): StockAllocation {
  return {
    id: r.id,
    productId: r.productId,
    warehouseId: r.warehouseId,
    quantity: Number(r.quantity),
    reservedQuantity: Number(r.reservedQuantity),
    userId: r.userId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    product: productMap.has(r.productId)
      ? { id: r.productId, ...productMap.get(r.productId)! }
      : undefined,
    warehouse: warehouseMap.has(r.warehouseId)
      ? { id: r.warehouseId, name: warehouseMap.get(r.warehouseId)! }
      : undefined,
  };
}

/**
 * GET /api/stock-allocations
 * Query params:
 *   ?summary=true for warehouse summary
 *   ?productId=xxx for stock in specific product
 *   ?warehouseId=xxx for stock in specific warehouse
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

    const { searchParams } = new URL(request.url);
    const summary = searchParams.get("summary") === "true";
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");

    if (summary) {
      // Return warehouse stock summary
      const cacheKey = cacheKeys.stockAllocation.summary(session.id);
      const cached = await getCache<WarehouseStockSummary[]>(cacheKey);
      if (cached) return NextResponse.json(cached);

      const result = await getWarehouseStockSummary(session.id);
      await setCache(cacheKey, result, 300);
      return NextResponse.json(result);
    }

    // Get allocations - by product, warehouse, or all
    let allocations;
    let cacheKey: string;

    if (productId) {
      const product = await findAccessibleProduct(
        { id: session.id, role: session.role },
        productId,
        "read",
      );
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      cacheKey = cacheKeys.stockAllocation.byProduct(productId);
      const cached = await getCache<StockAllocation[]>(cacheKey);
      if (cached) return NextResponse.json(cached);

      allocations = await getStockAllocationsByProduct(productId);
    } else if (warehouseId) {
      // Verify warehouse belongs to user
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: warehouseId, userId: session.id },
      });
      if (!warehouse) {
        return NextResponse.json(
          { error: "Warehouse not found" },
          { status: 404 },
        );
      }

      cacheKey = cacheKeys.stockAllocation.byWarehouse(warehouseId);
      const cached = await getCache<StockAllocation[]>(cacheKey);
      if (cached) return NextResponse.json(cached);

      allocations = await prisma.stockAllocation.findMany({
        where: { warehouseId },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Return all stock allocations
      cacheKey = cacheKeys.stockAllocation.list(session.id);
      const cached = await getCache<StockAllocation[]>(cacheKey);
      if (cached) return NextResponse.json(cached);

      allocations = await getStockAllocations(session.id);
    }

    // Fetch products and warehouses for context
    const productIds = [...new Set(allocations.map((a) => a.productId))];
    const warehouseIds = [...new Set(allocations.map((a) => a.warehouseId))];

    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        // imageUrl → allocation row thumbnails (REQ-0059)
        select: { id: true, name: true, sku: true, imageUrl: true },
      }),
      prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } },
        select: { id: true, name: true },
      }),
    ]);

    const productMap = new Map(
      products.map((p) => [
        p.id,
        { name: p.name, sku: p.sku, imageUrl: p.imageUrl ?? null },
      ]),
    );
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

    const result = allocations.map((a) =>
      transform(a, productMap, warehouseMap),
    );
    await setCache(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching stock allocations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock allocations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/stock-allocations
 * Create or update stock allocation
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

    const body = await request.json();
    const validation = createStockAllocationSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Invalid stock allocation data", {
        errors: validation.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 },
      );
    }

    const data = validation.data;

    if ((session.role ?? "client") === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const product = await findAccessibleProduct(
      { id: session.id, role: session.role },
      data.productId,
      "write",
    );
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify warehouse belongs to user
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, userId: session.id },
    });
    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    const allocation = await upsertStockAllocation(data, session.id);
    await scheduleInvalidateStockAllocationCaches();
    const result: StockAllocation = {
      id: allocation.id,
      productId: allocation.productId,
      warehouseId: allocation.warehouseId,
      quantity: Number(allocation.quantity),
      reservedQuantity: Number(allocation.reservedQuantity),
      userId: allocation.userId,
      createdAt: allocation.createdAt.toISOString(),
      updatedAt: allocation.updatedAt?.toISOString() ?? null,
      product: { id: product.id, name: product.name, sku: product.sku },
      warehouse: { id: warehouse.id, name: warehouse.name },
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error("Error creating stock allocation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create stock allocation",
      },
      { status: 500 },
    );
  }
}
