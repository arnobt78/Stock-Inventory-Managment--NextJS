/**
 * Server-side user detail fetch for SSR prefetch.
 * Mirrors GET /api/users/:id auth + response shape (admin-only, includes overview).
 * REQ-0024
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

async function buildUserOverview(id: string): Promise<UserOverview> {
  const ordersForSpent = prisma.order.findMany({
    where: {
      OR: [{ clientId: id }, { userId: id, clientId: null }],
    },
    select: { total: true },
  });
  const invoicesForDue = prisma.invoice.findMany({
    where: {
      OR: [{ clientId: id }, { userId: id, clientId: null }],
    },
    select: { amountDue: true },
  });

  const [
    orderCountAsCreator,
    orderCountAsClient,
    invoiceCountAsCreator,
    invoiceCountAsClient,
    ordersAsCreator,
    ordersForSpentResult,
    invoicesForDueResult,
    productCount,
    supplierCount,
    categoryCount,
    warehouseCount,
    suppliersForUser,
  ] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.order.count({ where: { clientId: id } }),
    prisma.invoice.count({ where: { userId: id } }),
    prisma.invoice.count({ where: { clientId: id } }),
    prisma.order.findMany({
      where: { userId: id },
      select: { total: true },
    }),
    ordersForSpent,
    invoicesForDue,
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

  const revenueFromOrdersCreated = ordersAsCreator.reduce(
    (s, o) => s + (o.total ?? 0),
    0,
  );
  const supplierRevenue = supplierOrderItems.reduce(
    (s, i) => s + (i.subtotal ?? 0),
    0,
  );
  const totalRevenue = revenueFromOrdersCreated + supplierRevenue;
  const totalSpent = ordersForSpentResult.reduce(
    (s, o) => s + (o.total ?? 0),
    0,
  );
  const totalDue = invoicesForDueResult.reduce(
    (s, i) => s + (i.amountDue ?? 0),
    0,
  );

  return {
    orderCount: orderCountAsCreator + orderCountAsClient,
    invoiceCount: invoiceCountAsCreator + invoiceCountAsClient,
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

  const overview = await buildUserOverview(id);
  return { ...transformUserForAdmin(record), overview };
}
