/**
 * Server-side data fetching for Support Tickets pages (admin + user-facing) SSR.
 * Only import from server code (e.g. app/admin/support-tickets/page.tsx, app/support-tickets/page.tsx).
 * REQ-0185 — creator/assignee images + product owner densify (image, productCount).
 * REQ-0200 — owner-scoped products for Related product picker (any role).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getSupportTicketsByUserId,
  getSupportTicketsByAssignedTo,
} from "@/prisma/support-ticket";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  loadProductListPartyMaps,
  productListPartyFields,
} from "@/lib/server/product-list-party";
import {
  hasTicketListV2Shape,
  transformSupportTicketListRow,
  type TicketUserSnap,
} from "@/lib/support-tickets/ticket-list-enrich";
import type {
  ProductOwnerOption,
  SupportTicket,
  SupportTicketOwnerProduct,
} from "@/types";

export type { ProductOwnerOption, SupportTicketOwnerProduct };

async function getUsersMap(
  userIds: string[],
): Promise<Map<string, TicketUserSnap>> {
  if (userIds.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
  });
  return new Map(
    users.map((u) => [
      u.id,
      { name: u.name, email: u.email ?? "", image: u.image ?? null },
    ]),
  );
}

async function mapTicketsWithUsers(
  records: Awaited<ReturnType<typeof getSupportTicketsByAssignedTo>>,
): Promise<SupportTicket[]> {
  const ticketIds = records.map((r) => r.id);
  const replyCounts =
    ticketIds.length > 0
      ? await prisma.supportTicketReply.groupBy({
          by: ["ticketId"],
          where: { ticketId: { in: ticketIds } },
          _count: { id: true },
        })
      : [];
  const replyCountMap = new Map(
    replyCounts.map((c) => [c.ticketId, c._count.id]),
  );
  const userIds = [
    ...new Set(
      records.flatMap((r) =>
        [r.userId, r.assignedToId].filter(Boolean) as string[],
      ),
    ),
  ];
  const usersMap = await getUsersMap(userIds);
  return records.map((r) =>
    transformSupportTicketListRow(
      r,
      usersMap.get(r.userId),
      r.assignedToId ? usersMap.get(r.assignedToId) : null,
      replyCountMap.get(r.id) ?? 0,
    ),
  );
}

/**
 * Fetch support tickets assigned to the given admin (product owner).
 * Admin only sees tickets that were "sent to" them.
 */
export async function getSupportTicketsForAdmin(
  adminUserId: string,
): Promise<SupportTicket[]> {
  const cacheKey = cacheKeys.supportTickets.list({
    assignedToId: adminUserId,
  });
  const cacheReadStartedAt = Date.now();
  const cached = await getCache<SupportTicket[]>(cacheKey);
  if (hasTicketListV2Shape(cached)) return cached;

  const records = await getSupportTicketsByAssignedTo(adminUserId);
  const transformed = await mapTicketsWithUsers(records);
  await setCache(cacheKey, transformed, 300, { fetchedAt: cacheReadStartedAt });
  return transformed;
}

/**
 * Fetch support tickets created by the given user (for user-facing /support-tickets page).
 */
export async function getSupportTicketsForUser(
  userId: string,
): Promise<SupportTicket[]> {
  const records = await getSupportTicketsByUserId(userId);
  return mapTicketsWithUsers(records);
}

/**
 * Fetch users who have at least one product (for "Send to" / product owner dropdown).
 */
export async function getProductOwnersForSupport(): Promise<
  ProductOwnerOption[]
> {
  const products = await prisma.product.findMany({
    where: mergeProductListWhere({}),
    select: { userId: true },
  });
  const countByUser = new Map<string, number>();
  for (const p of products) {
    countByUser.set(p.userId, (countByUser.get(p.userId) ?? 0) + 1);
  }
  const userIds = [...countByUser.keys()];
  if (userIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email ?? "",
    image: u.image ?? null,
    productCount: countByUser.get(u.id) ?? 0,
  }));
}

/**
 * REQ-0200 — Non-deleted products owned by `ownerId` for ticket Related product picker.
 * Same ownership scope as POST create validation (`product.userId === assignedToId`).
 * Not role-scoped — client/supplier/admin all see the selected Send-to catalog.
 */
export async function getOwnerProductsForSupport(
  ownerId: string,
): Promise<SupportTicketOwnerProduct[]> {
  const trimmed = ownerId.trim();
  if (!trimmed) return [];

  const products = await prisma.product.findMany({
    where: mergeProductListWhere({ userId: trimmed }),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      quantity: true,
      userId: true,
      imageUrl: true,
      categoryId: true,
      supplierId: true,
    },
  });

  const partyMaps = await loadProductListPartyMaps(products);
  // REQ-0201 — pass owner/supplier avatars for DialogProductOptionRow densify
  return products.map((product) => {
    const party = productListPartyFields(product, partyMaps);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: Number(product.quantity),
      userId: product.userId,
      imageUrl: product.imageUrl ?? null,
      category: party.category,
      supplier: party.supplier,
      supplierId: product.supplierId,
      productOwnerName: party.productOwnerName,
      productOwnerImage: party.productOwnerImage,
      supplierImage: party.supplierImage,
    };
  });
}
