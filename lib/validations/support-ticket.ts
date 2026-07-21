/**
 * Support Ticket validation schemas
 */

import { z } from "zod";

export const createSupportTicketSchema = z.object({
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedToId: z.string().nullable().optional(),
  productId: z.string().optional(),
  orderId: z.string().optional(),
  supplierId: z.string().optional(),
});

export const createSupportTicketReplySchema = z.object({
  body: z.string().min(1, "Reply is required").max(5000),
});

export const updateSupportTicketSchema = z.object({
  // REQ-0185 — edit dialog may update subject/description
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject too long")
    .optional(),
  description: z.string().min(1, "Description is required").optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  // REQ-0190 — admin Reassign only (API ignores for non-admin)
  assignedToId: z.string().nullable().optional(),
  // REQ-0197 — admin clear only (null); non-null productId on PUT ignored by API
  productId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateSupportTicketFormData = z.infer<
  typeof createSupportTicketSchema
>;
export type UpdateSupportTicketFormData = z.infer<
  typeof updateSupportTicketSchema
>;
