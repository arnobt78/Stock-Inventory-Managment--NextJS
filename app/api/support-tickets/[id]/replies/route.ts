/**
 * Support Ticket Replies
 * GET /api/support-tickets/:id/replies — list replies
 * POST /api/support-tickets/:id/replies — add reply (notifies other party)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getSupportTicketById,
  getSupportTicketReplies,
  createSupportTicketReply,
} from "@/prisma/support-ticket";
import { createSupportTicketReplySchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createSupportTicketRepliedNotification } from "@/lib/notifications/in-app";
import { scheduleInvalidateSupportTicketCaches } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import type { SupportTicketReply } from "@/types";

function transform(
  r: Awaited<ReturnType<typeof getSupportTicketReplies>>[number],
  user?: { name: string | null; email: string | null; image: string | null } | null,
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

/**
 * GET /api/support-tickets/:id/replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 },
      );
    }
    const isCreator = ticket.userId === session.id;
    const isAssignee = ticket.assignedToId === session.id;
    if (!isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      users.map((u) => [u.id, { name: u.name, email: u.email ?? null, image: u.image }]),
    );
    const transformed = replies.map((r) =>
      transform(r, userMap.get(r.userId) ?? null),
    );
    return NextResponse.json(transformed);
  } catch (error) {
    logger.error("Error fetching support ticket replies:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/support-tickets/:id/replies
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimitResponse = await withRateLimit(
      request,
      defaultRateLimits.standard,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const ticket = await getSupportTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 },
      );
    }
    const isCreator = ticket.userId === session.id;
    const isAssignee = ticket.assignedToId === session.id;
    if (!isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSupportTicketReplySchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid support ticket reply data", {
        errors: parsed.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const reply = await createSupportTicketReply(
      ticketId,
      session.id,
      parsed.data.body,
    );
    await scheduleInvalidateSupportTicketCaches();
    const updaterDisplay =
      session.name?.trim() || session.email || "Someone";
    const toNotify: string[] = [];
    if (ticket.userId !== session.id) toNotify.push(ticket.userId);
    if (
      ticket.assignedToId &&
      ticket.assignedToId !== session.id &&
      !toNotify.includes(ticket.assignedToId)
    ) {
      toNotify.push(ticket.assignedToId);
    }
    toNotify.forEach((userId) => {
      createSupportTicketRepliedNotification(
        userId,
        ticketId,
        ticket.subject,
        updaterDisplay,
      ).catch((err) => {
        logger.warn("Failed to create reply notification", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    });

    const replyWithUser = transform(reply, {
      name: session.name,
      email: session.email ?? null,
      image: session.image ?? null,
    });
    return NextResponse.json(replyWithUser, { status: 201 });
  } catch (error) {
    logger.error("Error creating support ticket reply:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 },
    );
  }
}
