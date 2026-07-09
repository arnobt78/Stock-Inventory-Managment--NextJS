/**
 * Warehouse Detail API Route Handler
 * GET /api/warehouses/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import { getWarehouseDetailForPage } from "@/lib/server/warehouse-detail-data";

/**
 * GET /api/warehouses/:id
 * Get warehouse by ID (must belong to user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const warehouse = await getWarehouseDetailForPage(
      { id: session.id, role: session.role },
      id,
    );

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    logger.error("Error fetching warehouse:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse" },
      { status: 500 },
    );
  }
}
