/**
 * Server-side data fetching for warehouses page SSR
 * Only import this from server code (e.g. app/warehouses/page.tsx).
 */

import { prisma } from "@/prisma/client";

/** Warehouse shape for list page (dates as ISO strings for hydration) */
export type WarehouseForPage = {
  id: string;
  name: string;
  address: string | null;
  type: string | null;
  status: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
  /** REQ-0096 — audit user snapshots */
  creator?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  } | null;
  updater?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  } | null;
};

/**
 * Fetch warehouses for the given user
 */
export async function getWarehousesForUser(
  userId: string,
): Promise<WarehouseForPage[]> {
  const warehouses = await prisma.warehouse.findMany({
    where: { userId },
  });

  return warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    address: w.address ?? null,
    type: w.type ?? null,
    status: w.status,
    userId: w.userId,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt?.toISOString() ?? null,
    createdBy: w.createdBy,
    updatedBy: w.updatedBy ?? null,
  }));
}
