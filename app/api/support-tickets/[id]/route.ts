/**
 * Support Ticket Detail API Route Handler
 * GET /api/support-tickets/:id — fetch one
 * PUT /api/support-tickets/:id — update
 * DELETE /api/support-tickets/:id — delete
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/utils/auth";
import { logger } from "@/lib/logger";
import {
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
} from "@/prisma/support-ticket";
import { updateSupportTicketSchema } from "@/lib/validations";
import { withRateLimit, defaultRateLimits } from "@/lib/api/rate-limit";
import { createSupportTicketRepliedNotification } from "@/lib/notifications/in-app";
import { createAuditLog } from "@/prisma/audit-log";
import { prisma } from "@/prisma/client";
import type { UpdateSupportTicketInput } from "@/types";
import { getSupportTicketDetailForPage } from "@/lib/server/support-ticket-detail-data";
import { transformSupportTicketDetail } from "@/lib/support-tickets/transform-support-ticket-detail";
import { scheduleInvalidateSupportTicketCaches } from "@/lib/cache";
import {
  canMutateSupportTicket,
  resolveAssignedToUpdate,
  resolveStatusUpdate,
} from "@/lib/support-tickets/ticket-assignee-policy";
import { resolveProductIdAfterAssigneeChange } from "@/lib/support-tickets/ticket-reassign-product";

/**
 * GET /api/support-tickets/:id
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

    const { id } = await params;
    const detail = await getSupportTicketDetailForPage(
      { id: session.id, role: session.role },
      id,
    );
    if (!detail) {
      const record = await getSupportTicketById(id);
      if (!record) {
        return NextResponse.json(
          { error: "Support ticket not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    logger.error("Error fetching support ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch support ticket" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/support-tickets/:id
 */
export async function PUT(
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

    const { id } = await params;
    const existing = await getSupportTicketById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 },
      );
    }
    // REQ-0190 — admin may update any ticket (reassign); others: creator or assignee
    const sessionId = session.id ?? "";
    const sessionRole = session.role ?? "";
    if (
      !sessionId ||
      !canMutateSupportTicket(
        { id: sessionId, role: sessionRole },
        {
          userId: existing.userId,
          assignedToId: existing.assignedToId ?? null,
        },
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSupportTicketSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Invalid support ticket update data", {
        errors: parsed.error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updatePayload: UpdateSupportTicketInput = {};
    // REQ-0185 — edit dialog subject/description
    if (data.subject != null) updatePayload.subject = data.subject;
    if (data.description != null) updatePayload.description = data.description;
    if (data.priority != null) updatePayload.priority = data.priority;
    // REQ-0195 — only admin may change workflow status; non-admin body.status ignored
    const nextStatus = resolveStatusUpdate(
      { id: sessionId, role: sessionRole },
      data.status,
    );
    if (nextStatus !== undefined) {
      updatePayload.status = nextStatus;
    }
    // REQ-0190 — only admin may change Send-to; non-admin body field ignored
    const nextAssignedTo = resolveAssignedToUpdate(
      { id: sessionId, role: sessionRole },
      data.assignedToId,
    );
    if (nextAssignedTo !== undefined) {
      updatePayload.assignedToId = nextAssignedTo;
      // REQ-0197 — clear productId when new Send-to does not own Related product
      let productOwnerUserId: string | null = null;
      if (existing.productId) {
        const linked = await prisma.product.findUnique({
          where: { id: existing.productId },
          select: { userId: true },
        });
        productOwnerUserId = linked?.userId ?? null;
      }
      const nextProductId = resolveProductIdAfterAssigneeChange(
        {
          productId: existing.productId,
          productOwnerUserId,
        },
        nextAssignedTo,
      );
      if (nextProductId === null) {
        updatePayload.productId = null;
      }
    } else if (data.productId === null && sessionRole === "admin") {
      // Explicit admin clear without assignee change
      updatePayload.productId = null;
    }
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const updated = await updateSupportTicket(id, updatePayload);
    await scheduleInvalidateSupportTicketCaches();
    createAuditLog({
      userId: session.id,
      action: "update",
      entityType: "ticket",
      entityId: id,
      details: { subject: updated.subject },
    }).catch(() => {});

    // Notify ticket creator and/or assignee (excluding the updater), non-blocking
    const updaterId = session.id;
    const updaterDisplay =
      session.name?.trim() || session.email || "Someone";
    const toNotify: string[] = [];
    if (existing.userId && existing.userId !== updaterId) {
      toNotify.push(existing.userId);
    }
    if (
      updated.assignedToId &&
      updated.assignedToId !== updaterId &&
      !toNotify.includes(updated.assignedToId)
    ) {
      toNotify.push(updated.assignedToId);
    }
    if (toNotify.length > 0) {
      Promise.all(
        toNotify.map((userId) =>
          createSupportTicketRepliedNotification(
            userId,
            id,
            updated.subject,
            updaterDisplay,
          ),
        ),
      ).catch((err) => {
        logger.warn("Failed to create support ticket replied notifications", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    const [creator, assignedTo] = await Promise.all([
      prisma.user.findUnique({
        where: { id: updated.userId },
        select: { name: true, email: true, image: true },
      }),
      updated.assignedToId
        ? prisma.user.findUnique({
            where: { id: updated.assignedToId },
            select: { name: true, email: true, image: true },
          })
        : null,
    ]);
    return NextResponse.json(
      transformSupportTicketDetail(updated, {
        creator: creator ?? null,
        assignedTo: assignedTo ?? null,
      }),
    );
  } catch (error) {
    logger.error("Error updating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/support-tickets/:id
 */
export async function DELETE(
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

    const { id } = await params;
    const existing = await getSupportTicketById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 },
      );
    }
    // REQ-0191 — admin OR creator OR assignee (parity with PUT)
    const sessionId = session.id ?? "";
    const sessionRole = session.role ?? "";
    if (
      !sessionId ||
      !canMutateSupportTicket(
        { id: sessionId, role: sessionRole },
        {
          userId: existing.userId,
          assignedToId: existing.assignedToId ?? null,
        },
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteSupportTicket(id);
    await scheduleInvalidateSupportTicketCaches();
    createAuditLog({
      userId: session.id,
      action: "delete",
      entityType: "ticket",
      entityId: id,
      details: { subject: existing.subject },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting support ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete support ticket" },
      { status: 500 },
    );
  }
}
