/**
 * Support Ticket Prisma Utilities
 * Helper functions for support ticket database operations
 */

import { prisma } from "@/prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
} from "@/types";

/**
 * Create a new support ticket
 */
export async function createSupportTicket(
  data: CreateSupportTicketInput,
  userId: string,
) {
  const now = new Date();
  return prisma.supportTicket.create({
    data: {
      subject: data.subject,
      description: data.description,
      priority: data.priority ?? "medium",
      status: "open",
      userId,
      assignedToId: data.assignedToId ?? null,
      productId: data.productId ?? null,
      orderId: data.orderId ?? null,
      supplierId: data.supplierId ?? null,
      updatedAt: now,
    },
  });
}

/**
 * Get support tickets created by a user (for user-facing list).
 */
export async function getSupportTicketsByUserId(userId: string, limit = 100) {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get all support tickets (admin list). Ordered by createdAt desc.
 */
export async function getAllSupportTickets(limit = 100) {
  return prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get support tickets assigned to a user (admin "Assigned to me").
 */
export async function getSupportTicketsByAssignedTo(
  assignedToId: string,
  limit = 100,
) {
  return prisma.supportTicket.findMany({
    where: { assignedToId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get a single support ticket by ID
 */
export async function getSupportTicketById(id: string) {
  return prisma.supportTicket.findUnique({
    where: { id },
  });
}

/**
 * Update a support ticket
 */
export async function updateSupportTicket(
  id: string,
  data: UpdateSupportTicketInput,
) {
  const updateData: Prisma.SupportTicketUpdateInput = {
    updatedAt: new Date(),
  };
  if (data.subject != null) updateData.subject = data.subject;
  if (data.description != null) updateData.description = data.description;
  if (data.status != null) updateData.status = data.status;
  if (data.priority != null) updateData.priority = data.priority;
  if (data.assignedToId !== undefined)
    updateData.assignedToId = data.assignedToId;
  // REQ-0197 — clear (or keep) Related product when reassigning
  if (data.productId !== undefined) updateData.productId = data.productId;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.supportTicket.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a support ticket
 */
export async function deleteSupportTicket(id: string) {
  return prisma.supportTicket.delete({
    where: { id },
  });
}

/**
 * Get replies for a support ticket, ordered by createdAt asc.
 */
export async function getSupportTicketReplies(ticketId: string) {
  return prisma.supportTicketReply.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Create a reply on a support ticket.
 */
export async function createSupportTicketReply(
  ticketId: string,
  userId: string,
  body: string,
) {
  return prisma.supportTicketReply.create({
    data: { ticketId, userId, body },
  });
}
