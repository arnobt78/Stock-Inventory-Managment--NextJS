/**
 * Server-side data fetching for Support Tickets pages (admin + user-facing) SSR.
 * Only import from server code (e.g. app/admin/support-tickets/page.tsx, app/support-tickets/page.tsx).
 * REQ-0185 — creator/assignee images + product owner densify (image, productCount).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getSupportTicketsByUserId,
  getSupportTicketsByAssignedTo,
} from "@/prisma/support-ticket";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import {
  hasTicketListV2Shape,
  transformSupportTicketListRow,
  type TicketUserSnap,
} from "@/lib/support-tickets/ticket-list-enrich";
import type { ProductOwnerOption, SupportTicket } from "@/types";

export type { ProductOwnerOption };

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
