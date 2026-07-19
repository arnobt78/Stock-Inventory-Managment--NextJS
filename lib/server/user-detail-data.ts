/**
 * Server-side user detail fetch for SSR prefetch.
 * Mirrors GET /api/users/:id auth + response shape (admin-only, includes overview).
 * REQ-0024 · REQ-0158 — party-aware counts / revenue / spent.
 */

import { getUserById } from "@/prisma/user-admin";
import { prisma } from "@/prisma/client";
import type { UserForAdmin, UserOverview } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

type UserRecord = NonNullable<Awaited<ReturnType<typeof getUserById>>>;

/** Transform user record for admin API/SSR responses (without overview). */
export function transformUserForAdmin(r: UserRecord): UserForAdmin {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    username: r.username,
    role: r.role as UserForAdmin["role"],
    image: r.image,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

/**
 * REQ-0158 / REQ-0159 overview (UI copy: REQ-0160 user-overview-copy):
 * - Counts: single OR (userId | clientId) — no double-count
 * - Spent/Due: distinct buyer only (`clientId === id` and `userId !== id`);
 *   self-orders (clientId null/owner) are not counted as spent
 * - Revenue: role-aware (client 0; supplier lines; admin/user = owned store orders)
 */
async function buildUserOverview(
  id: string,
  role: string | null,
): Promise<UserOverview> {
  const normalizedRole = (role || "admin").toLowerCase();

  const [
    orderCount,
    invoiceCount,
    ordersAsOwner,
    buyerOrders,
    buyerInvoices,
    productCount,
    supplierCount,
    categoryCount,
    warehouseCount,
    suppliersForUser,
  ] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ userId: id }, { clientId: id }] },
    }),
    prisma.invoice.count({
      where: { OR: [{ userId: id }, { clientId: id }] },
    }),
    prisma.order.findMany({
      where: { userId: id },
      select: { total: true },
    }),
    // Distinct client buyer (not self-order where clientId === userId)
    prisma.order.findMany({
      where: { clientId: id, userId: { not: id } },
      select: { total: true },
    }),
    prisma.invoice.findMany({
      where: { clientId: id, userId: { not: id } },
      select: { amountDue: true },
    }),
    prisma.product.count({ where: { userId: id } }),
    prisma.supplier.count({ where: { userId: id } }),
    prisma.category.count({ where: { userId: id } }),
    prisma.warehouse.count({ where: { userId: id } }),
    prisma.supplier.findMany({
      where: { userId: id },
      select: { id: true },
    }),
  ]);

  const supplierIds = suppliersForUser.map((s) => s.id);
  const supplierOrderItems =
    supplierIds.length > 0
      ? await prisma.orderItem.findMany({
          where: { product: { supplierId: { in: supplierIds } } },
          select: { subtotal: true },
        })
      : [];

  const revenueFromOrdersOwned = ordersAsOwner.reduce(
    (s, o) => s + (o.total ?? 0),
    0,
  );
  const supplierRevenue = supplierOrderItems.reduce(
    (s, i) => s + (i.subtotal ?? 0),
    0,
  );

  let totalRevenue = 0;
  if (normalizedRole === "client") {
    totalRevenue = 0;
  } else if (normalizedRole === "supplier") {
    totalRevenue = supplierRevenue;
  } else {
    // admin / user — store owner order totals (do not also add supplier lines)
    totalRevenue = revenueFromOrdersOwned;
  }

  const totalSpent = buyerOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalDue = buyerInvoices.reduce((s, i) => s + (i.amountDue ?? 0), 0);

  return {
    orderCount,
    invoiceCount,
    totalRevenue,
    totalSpent,
    totalDue,
    productCount,
    supplierCount,
    categoryCount,
    warehouseCount,
  };
}

/** Admin-only user detail for page SSR — null when not found or unauthorized. */
export async function getUserDetailForPage(
  session: SessionForDetail,
  id: string,
): Promise<(UserForAdmin & { overview: UserOverview }) | null> {
  if (session.role !== "admin") return null;

  const record = await getUserById(id);
  if (!record) return null;

  const overview = await buildUserOverview(id, record.role);
  return { ...transformUserForAdmin(record), overview };
}
