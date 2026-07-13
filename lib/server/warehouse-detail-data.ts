/**
 * Server-side warehouse detail fetch for SSR prefetch.
 * Mirrors GET /api/warehouses/:id auth + response shape.
 * REQ-0024, REQ-0096 — creator/updater audit snapshots.
 */

import { prisma } from "@/prisma/client";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { SessionForDetail } from "@/lib/server/order-detail-data";
import { toParty } from "@/lib/server/catalog-party-snapshot";

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

  const auditIds = [warehouse.createdBy, warehouse.updatedBy].filter(
    Boolean,
  ) as string[];
  const uniqueIds = [...new Set(auditIds)];
  const users =
    uniqueIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

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
    creator: toParty(
      warehouse.createdBy ? userMap.get(warehouse.createdBy) ?? null : null,
    ),
    updater: toParty(
      warehouse.updatedBy ? userMap.get(warehouse.updatedBy) ?? null : null,
    ),
  };
}
