/**
 * Invoice-related type definitions
 */

import type { BillingAddress, OrderItem } from "./order";

/**
 * Invoice status types
 */
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

/**
 * Invoice interface matching Prisma schema
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  clientId?: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax?: number | null;
  shipping?: number | null;
  discount?: number | null;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: Date;
  issuedAt: Date;
  sentAt?: Date | null;
  paidAt?: Date | null;
  cancelledAt?: Date | null;
  paymentLink?: string | null;
  /** Stripe PaymentIntent ID for refunds (REQ-0071 detail card) */
  stripePaymentIntentId?: string | null;
  notes?: string | null;
  billingAddress?: BillingAddress | null;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string;
  updatedBy?: string | null;
  /** Client/customer display name (for admin combined list; from order) */
  customerDisplay?: string | null;
  /** Client name the invoice is billed to (for admin personal invoices) */
  clientName?: string | null;
  /** Client email the invoice is billed to (for admin personal invoices) */
  clientEmail?: string | null;
  /** Invoice issuer/creator name (for client list table) */
  issuedByName?: string | null;
  /** Invoice issuer/creator email (for client list table) */
  issuedByEmail?: string | null;
  /** User who placed the linked order (for admin self/client source tagging) */
  orderUserId?: string | null;
  /** Who created the invoice (for detail Parties section) */
  invoiceCreatedBy?: { name: string | null; email: string } | null;
  /** Who placed the order (for detail Parties section) */
  orderedBy?: { name: string | null; email: string } | null;
  /** Client the invoice is for (for detail Parties section) */
  client?: { name: string | null; email: string } | null;
  /** Product owner(s) for items in the order (for detail Parties section) */
  invoiceProductOwners?: { userId: string; name: string | null; email: string }[];
  /** REQ-0063 — linked order number for Related Order row + copy */
  linkedOrderNumber?: string | null;
  /** REQ-0063 — line items from linked order (thumbnails on invoice detail) */
  linkedOrderItems?: OrderItem[];
}

/**
 * Invoice creation input (generate from order)
 */
export interface CreateInvoiceInput {
  orderId: string;
  dueDate: string; // ISO string for date
  tax?: number;
  shipping?: number;
  discount?: number;
  notes?: string;
  paymentLink?: string;
}

/**
 * Invoice update input (all fields optional except id)
 */
export interface UpdateInvoiceInput {
  id: string;
  status?: InvoiceStatus;
  amountPaid?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  amountDue?: number;
  dueDate?: string; // ISO string for date
  sentAt?: string; // ISO string for date
  paidAt?: string; // ISO string for date
  cancelledAt?: string; // ISO string for date
  paymentLink?: string;
  notes?: string;
}

/**
 * Invoice filters for fetching multiple invoices
 */
export interface InvoiceFilters {
  searchTerm?: string;
  status?: InvoiceStatus[];
  orderId?: string;
  clientId?: string;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  dueDateStart?: string; // ISO string
  dueDateEnd?: string; // ISO string
  /** API-only: `store` = all invoices for store orders (admin /invoices); default `issuer` */
  scope?: "issuer" | "store";
}
