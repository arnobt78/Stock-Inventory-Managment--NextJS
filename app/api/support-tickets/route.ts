/**
 * Support Tickets API Route Handler
 * GET /api/support-tickets — list all (admin)
 * POST /api/support-tickets — create ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  createSupportTicket,
  getSupportTicketsByAssignedTo,
} from "@/prisma/support-ticket";
import { createSupportTicketSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createSupportTicketCreatedNotification } from "@/lib/notifications/in-app";
import { cacheKeys, getCache, scheduleInvalidateSupportTicketCaches, setCache } from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import type { SupportTicket } from "@/types";

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
 * GET /api/support-tickets
 * Admin: all tickets (cached). Non-admin: only tickets created by current user.
 */
export async function GET(request: NextRequest) {
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

    const isAdmin = session.role === "admin";
    if (isAdmin) {
      const { searchParams } = new URL(request.url);
      const view = searchParams.get("view") as "all" | "assigned_to_me" | "created_by_me" | null;
      if (view === "assigned_to_me" || view === "created_by_me") {
        const { getSupportTicketsByUserId, getSupportTicketsByAssignedTo } = await import("@/prisma/support-ticket");
        const records =
          view === "assigned_to_me"
            ? await getSupportTicketsByAssignedTo(session.id)
            : await getSupportTicketsByUserId(session.id);
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
        return NextResponse.json(transformed);
      }
      // Admin "all" = only tickets assigned to this admin (product owner), not every ticket
      const cacheKey = cacheKeys.supportTickets.list({
        assignedToId: session.id,
      });
      const cacheReadStartedAt = Date.now();
      const cached = await getCache<SupportTicket[]>(cacheKey);
      if (cached) return NextResponse.json(cached);
      const records = await getSupportTicketsByAssignedTo(session.id);
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
      return NextResponse.json(transformed);
    }

    const { getSupportTicketsByUserId } = await import("@/prisma/support-ticket");
    const records = await getSupportTicketsByUserId(session.id);
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
    return NextResponse.json(transformed);
  } catch (error) {
    logger.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/support-tickets
 * Create a new support ticket.
 */
export async function POST(request: NextRequest) {
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

    const userId = session.id;
    const body = await request.json();
    const parsed = createSupportTicketSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid support ticket creation data", {
        errors: parsed.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const created = await createSupportTicket(
      {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        assignedToId: data.assignedToId ?? null,
        productId: data.productId,
        orderId: data.orderId,
        supplierId: data.supplierId,
      },
      userId,
    );
    await scheduleInvalidateSupportTicketCaches();
    createAuditLog({
      userId,
      action: "create",
      entityType: "ticket",
      entityId: created.id,
      details: { subject: created.subject },
    }).catch(() => {});

    const creatorDisplay =
      session.name?.trim() || session.email || "A user";
    // Notify the assigned product owner (if set); otherwise notify all admins except creator
    if (created.assignedToId && created.assignedToId !== userId) {
      createSupportTicketCreatedNotification(
        created.assignedToId,
        created.id,
        created.subject,
        creatorDisplay,
      ).catch((err) => {
        logger.warn("Failed to create support ticket notification", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    } else {
      const adminUsers = await prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true },
      });
      const adminIds = adminUsers
        .map((u) => u.id)
        .filter((id) => id !== userId);
      Promise.all(
        adminIds.map((adminId) =>
          createSupportTicketCreatedNotification(
            adminId,
            created.id,
            created.subject,
            creatorDisplay,
          ),
        ),
      ).catch((err) => {
        logger.warn("Failed to create support ticket notifications", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    return NextResponse.json(transform(created), { status: 201 });
  } catch (error) {
    logger.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 },
    );
  }
}
