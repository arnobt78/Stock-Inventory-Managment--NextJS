/**
 * Server-side data fetching for Support Tickets pages (admin + user-facing) SSR.
 * Only import from server code (e.g. app/admin/support-tickets/page.tsx, app/support-tickets/page.tsx).
 */

import { getCache, setCache, cacheKeys } from "@/lib/cache";
import {
  getSupportTicketsByUserId,
  getSupportTicketsByAssignedTo,
} from "@/prisma/support-ticket";
import { prisma } from "@/prisma/client";
import { mergeProductListWhere } from "@/lib/products/product-query";
import type { SupportTicket } from "@/types";

export type ProductOwnerOption = { id: string; name: string; email: string };

function transform(
  r: Awaited<ReturnType<typeof getSupportTicketsByAssignedTo>>[number],
  creator?: { name: string | null; email: string } | null,
  assignedTo?: { name: string | null; email: string } | null,
  replyCount?: number,
): SupportTicket {
  return {
    id: r.id,
    subject: r.subject,
    description: r.description,
    status: r.status as SupportTicket["status"],
    priority: r.priority as SupportTicket["priority"],
    userId: r.userId,
    assignedToId: r.assignedToId,
    productId: r.productId,
    orderId: r.orderId,
    supplierId: r.supplierId,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    creatorName: creator?.name ?? undefined,
    creatorEmail: creator?.email ?? undefined,
    assignedToName: assignedTo?.name ?? undefined,
    assignedToEmail: assignedTo?.email ?? undefined,
    replyCount: replyCount ?? 0,
  };
}

async function getUsersMap(
  userIds: string[],
): Promise<Map<string, { name: string | null; email: string }>> {
  if (userIds.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  return new Map(
    users.map((u) => [u.id, { name: u.name, email: u.email ?? "" }]),
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
  if (cached) return cached;

  const records = await getSupportTicketsByAssignedTo(adminUserId);
  const ticketIds = records.map((r) => r.id);
  const replyCounts =
    ticketIds.length > 0
      ? await prisma.supportTicketReply.groupBy({
          by: ["ticketId"],
          where: { ticketId: { in: ticketIds } },
          _count: { id: true },
        })
      : [];
  const replyCountMap = new Map(replyCounts.map((c) => [c.ticketId, c._count.id]));
  const userIds = [...new Set(records.flatMap((r) => [r.userId, r.assignedToId].filter(Boolean) as string[]))];
  const usersMap = await getUsersMap(userIds);
  const transformed = records.map((r) =>
    transform(
      r,
      usersMap.get(r.userId),
      r.assignedToId ? usersMap.get(r.assignedToId) : null,
      replyCountMap.get(r.id) ?? 0,
    ),
  );
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
  const ticketIds = records.map((r) => r.id);
  const replyCounts =
    ticketIds.length > 0
      ? await prisma.supportTicketReply.groupBy({
          by: ["ticketId"],
          where: { ticketId: { in: ticketIds } },
          _count: { id: true },
        })
      : [];
  const replyCountMap = new Map(replyCounts.map((c) => [c.ticketId, c._count.id]));
  const userIds = [...new Set(records.flatMap((r) => [r.userId, r.assignedToId].filter(Boolean) as string[]))];
  const usersMap = await getUsersMap(userIds);
  return records.map((r) =>
    transform(
      r,
      usersMap.get(r.userId),
      r.assignedToId ? usersMap.get(r.assignedToId) : null,
      replyCountMap.get(r.id) ?? 0,
    ),
  );
}

/**
 * Fetch users who have at least one product (for "Send to" / product owner dropdown).
 */
export async function getProductOwnersForSupport(): Promise<
  ProductOwnerOption[]
> {
  const productOwnerIds = await prisma.product.findMany({
    where: mergeProductListWhere({}),
    select: { userId: true },
    distinct: ["userId"],
  });
  const userIds = [...new Set(productOwnerIds.map((p) => p.userId))];
  if (userIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email ?? "",
  }));
}
