/**
 * Server-side support ticket replies for SSR detail pages (REQ-0025 P2).
 * Mirrors GET /api/support-tickets/:id/replies response shape.
 */
import { prisma } from "@/prisma/client";
import { getSupportTicketReplies } from "@/prisma/support-ticket";
import type { SupportTicketReply } from "@/types";

function transformReply(
  r: Awaited<ReturnType<typeof getSupportTicketReplies>>[number],
  user?: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null,
): SupportTicketReply {
  return {
    id: r.id,
    ticketId: r.ticketId,
    userId: r.userId,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    userName: user?.name ?? undefined,
    userEmail: user?.email ?? undefined,
    userImage: user?.image ?? undefined,
  };
}

/** Replies for a ticket — used by admin + user detail page.tsx blocking SSR. */
export async function getSupportTicketRepliesForPage(
  ticketId: string,
): Promise<SupportTicketReply[]> {
  const replies = await getSupportTicketReplies(ticketId);
  const userIds = [...new Set(replies.map((r) => r.userId))];
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
  const userMap = new Map(
    users.map((u) => [
      u.id,
      { name: u.name, email: u.email ?? null, image: u.image },
    ]),
  );
  return replies.map((r) => transformReply(r, userMap.get(r.userId)));
}
