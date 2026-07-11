/**
 * Stock Transfers API — POST create + complete transfer atomically (REQ-0066).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  createStockTransfer,
  completeStockTransfer,
} from "@/prisma/stock-allocation";
import { createStockTransferSchema } from "@/lib/validations/stock-allocation";
import { scheduleInvalidateStockAllocationCaches } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { isExpectedClientError } from "@/lib/api";

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = createStockTransferSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid stock transfer request", {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    if (data.fromWarehouseId === data.toWarehouseId) {
      return NextResponse.json(
        { error: "Source and destination warehouses must differ" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findFirst({
      where: mergeProductListWhere({
        id: data.productId,
        userId: session.id,
      }),
      select: { id: true },
    });

    const [fromWarehouse, toWarehouse] = await Promise.all([
      prisma.warehouse.findFirst({
        where: { id: data.fromWarehouseId, userId: session.id },
      }),
      prisma.warehouse.findFirst({
        where: { id: data.toWarehouseId, userId: session.id },
      }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (!fromWarehouse || !toWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found or unauthorized" },
        { status: 404 },
      );
    }

    const transfer = await createStockTransfer(data, session.id);
    await completeStockTransfer(transfer.id, session.id);

    await scheduleInvalidateStockAllocationCaches();

    return NextResponse.json({
      id: transfer.id,
      status: "completed",
      productId: transfer.productId,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      quantity: Number(transfer.quantity),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create stock transfer";
    if (isExpectedClientError(error) || message.includes("Insufficient")) {
      logger.warn("Stock transfer rejected:", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
    logger.error("Error creating stock transfer:", error);
    return NextResponse.json(
      { error: "Failed to create stock transfer" },
      { status: 500 },
    );
  }
}
