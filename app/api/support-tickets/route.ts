/**
 * Support Tickets API Route Handler
 * GET /api/support-tickets — list (admin assigned / user created)
 * POST /api/support-tickets — create ticket
 * REQ-0185 — list densify images; client/supplier must set assignedToId
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
import {
  cacheKeys,
  getCache,
  scheduleInvalidateSupportTicketCaches,
  setCache,
} from "@/lib/cache";
import { prisma } from "@/prisma/client";
import { createAuditLog } from "@/prisma/audit-log";
import {
  hasTicketListV2Shape,
  transformSupportTicketListRow,
  type TicketUserSnap,
} from "@/lib/support-tickets/ticket-list-enrich";
import type { SupportTicket } from "@/types";

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

async function mapTicketRecords(
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
 * GET /api/support-tickets
 * Admin: tickets assigned to this admin (cached). Non-admin: tickets created by current user.
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
      const view = searchParams.get("view") as
        | "all"
        | "assigned_to_me"
        | "created_by_me"
        | null;
      if (view === "assigned_to_me" || view === "created_by_me") {
        const {
          getSupportTicketsByUserId,
          getSupportTicketsByAssignedTo: getByAssigned,
        } = await import("@/prisma/support-ticket");
        const records =
          view === "assigned_to_me"
            ? await getByAssigned(session.id)
            : await getSupportTicketsByUserId(session.id);
        return NextResponse.json(await mapTicketRecords(records));
      }
      const cacheKey = cacheKeys.supportTickets.list({
        assignedToId: session.id,
      });
      const cacheReadStartedAt = Date.now();
      const cached = await getCache<SupportTicket[]>(cacheKey);
      if (hasTicketListV2Shape(cached)) return NextResponse.json(cached);
      const records = await getSupportTicketsByAssignedTo(session.id);
      const transformed = await mapTicketRecords(records);
      await setCache(cacheKey, transformed, 300, {
        fetchedAt: cacheReadStartedAt,
      });
      return NextResponse.json(transformed);
    }

    const { getSupportTicketsByUserId } = await import(
      "@/prisma/support-ticket"
    );
    const records = await getSupportTicketsByUserId(session.id);
    return NextResponse.json(await mapTicketRecords(records));
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
    // REQ-0185 — client/supplier must send to a product owner
    const requiresAssignee =
      session.role === "client" || session.role === "supplier";
    if (requiresAssignee && !data.assignedToId) {
      logger.warn("Support ticket create missing assignedToId for role", {
        role: session.role,
      });
      return NextResponse.json(
        { error: "Please select a product owner to send the ticket to." },
        { status: 400 },
      );
    }

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

    const creatorDisplay = session.name?.trim() || session.email || "A user";
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

    return NextResponse.json(transformSupportTicketListRow(created), {
      status: 201,
    });
  } catch (error) {
    logger.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 },
    );
  }
}
