/**
 * Invoice Validation Schemas
 * Zod schemas for validating invoice-related data
 */

import { z } from "zod";

/**
 * Create Invoice Schema
 * Validates invoice creation from order
 */
export const createInvoiceSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  dueDate: z.string().datetime("Invalid due date format").or(z.string().date("Invalid due date format")),
  tax: z.number().min(0, "Tax cannot be negative").optional(),
  shipping: z.number().min(0, "Shipping cannot be negative").optional(),
  discount: z.number().min(0, "Discount cannot be negative").optional(),
  notes: z.string().optional(),
  paymentLink: z.string().url("Invalid payment link URL").optional().or(z.literal("")),
});

/**
 * Update Invoice Schema
 */
export const updateInvoiceSchema = z.object({
  id: z.string().min(1, "Invoice ID is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  amountPaid: z.number().min(0, "Amount paid cannot be negative").optional(),
  tax: z.number().min(0, "Tax cannot be negative").optional(),
  shipping: z.number().min(0, "Shipping cannot be negative").optional(),
  discount: z.number().min(0, "Discount cannot be negative").optional(),
  total: z.number().min(0, "Total cannot be negative").optional(),
  amountDue: z.number().min(0, "Amount due cannot be negative").optional(),
  dueDate: z.string().datetime().optional().or(z.string().date()).or(z.literal("")),
  // REQ-0151 — DialogDateField writes YYYY-MM-DD; accept date-only like dueDate
  sentAt: z.string().datetime().optional().or(z.string().date()).or(z.literal("")),
  paidAt: z.string().datetime().optional().or(z.string().date()).or(z.literal("")),
  cancelledAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  paymentLink: z.string().url("Invalid payment link URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;
