/**
 * Stock allocation by id — update quantity or delete row (REQ-0101).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  deleteStockAllocation,
  getStockAllocationById,
  updateStockAllocation,
} from "@/prisma/stock-allocation";
import { prisma } from "@/prisma/client";
import { findAccessibleProduct } from "@/lib/products/stock-product-access";
import { scheduleInvalidateStockAllocationCaches } from "@/lib/cache";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { validateAllocationUpsert } from "@/lib/stock-allocation/validate-allocation-quantity";
import { updateStockAllocationSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

async function assertAllocationAccess(
  session: { id: string; role?: string | null },
  allocationId: string,
) {
  if ((session.role ?? "client") === "client") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const allocation = await getStockAllocationById(allocationId);
  if (!allocation) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const product = await findAccessibleProduct(
    { id: session.id, role: session.role ?? null },
    allocation.productId,
    "write",
  );
  if (!product) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: allocation.warehouseId, userId: session.id },
  });
  if (!warehouse) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { allocation, product, warehouse };
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;
    const access = await assertAllocationAccess(session, id);
    if ("error" in access) return access.error;

    const body = await request.json();
    const validation = updateStockAllocationSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Invalid stock allocation update", {
        errors: validation.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 },
      );
    }

    if (validation.data.quantity === undefined) {
      return NextResponse.json(
        { error: "Quantity is required" },
        { status: 400 },
      );
    }

    const productRow = await prisma.product.findFirst({
      where: { id: access.allocation.productId },
      select: { quantity: true },
    });
    if (!productRow) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const siblingRows = await prisma.stockAllocation.findMany({
      where: { productId: access.allocation.productId },
      select: { warehouseId: true, quantity: true, reservedQuantity: true },
    });

    const quantityValidation = validateAllocationUpsert({
      catalogQty: Number(productRow.quantity),
      allocations: siblingRows.map((row) => ({
        warehouseId: row.warehouseId,
        quantity: Number(row.quantity),
      })),
      targetWarehouseId: access.allocation.warehouseId,
      newAbsoluteQty: validation.data.quantity,
      rowReserved: Number(access.allocation.reservedQuantity ?? 0),
    });
    if (!quantityValidation.ok) {
      return NextResponse.json(
        { error: quantityValidation.error },
        { status: 409 },
      );
    }

    const updated = await updateStockAllocation(id, validation.data);
    await scheduleInvalidateStockAllocationCaches();

    return NextResponse.json({
      id: updated.id,
      productId: updated.productId,
      warehouseId: updated.warehouseId,
      quantity: Number(updated.quantity),
      reservedQuantity: Number(updated.reservedQuantity),
    });
  } catch (error) {
    logger.error("Error updating stock allocation:", error);
    return NextResponse.json(
      { error: "Failed to update stock allocation" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;
    const access = await assertAllocationAccess(session, id);
    if ("error" in access) return access.error;

    if (access.allocation.reservedQuantity > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot remove allocation while units are reserved for active orders.",
        },
        { status: 409 },
      );
    }

    await deleteStockAllocation(id);
    await scheduleInvalidateStockAllocationCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting stock allocation:", error);
    return NextResponse.json(
      { error: "Failed to delete stock allocation" },
      { status: 500 },
    );
  }
}
