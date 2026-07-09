/**
 * Server-side warehouse detail fetch for SSR prefetch.
 * Mirrors GET /api/warehouses/:id auth + response shape.
 * REQ-0024
 */

import { prisma } from "@/prisma/client";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

/** Role-scoped warehouse detail for page SSR — null when not found or unauthorized. */
export async function getWarehouseDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<WarehouseForPage | null> {
  const isAdmin = session.role === "admin";
  const warehouse = await prisma.warehouse.findFirst({
    where: isAdmin ? { id } : { id, userId: session.id },
  });

  if (!warehouse) return null;

  return {
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address ?? null,
    type: warehouse.type ?? null,
    status: warehouse.status,
    userId: warehouse.userId,
    createdAt: warehouse.createdAt.toISOString(),
    updatedAt: warehouse.updatedAt?.toISOString() ?? null,
    createdBy: warehouse.createdBy,
    updatedBy: warehouse.updatedBy ?? null,
  };
}
