/**
 * Shared invoice detail response transform — used by API GET and SSR prefetch.
 */

import type { Invoice } from "@/types";
import type { OrderItem } from "@/types";

type InvoiceRaw = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  clientId: string | null;
  status: string;
  subtotal: number;
  tax: number | null;
  shipping: number | null;
  discount: number | null;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: Date;
  issuedAt: Date;
  sentAt?: Date | null;
  paidAt?: Date | null;
  cancelledAt?: Date | null;
  paymentLink: string | null;
  stripePaymentIntentId?: string | null;
  notes: string | null;
  billingAddress: unknown;
  createdAt: Date;
  updatedAt?: Date | null;
  createdBy: string;
  updatedBy: string | null;
};

export type InvoiceDetailEnrichment = {
  invoiceCreatedBy: { name: string | null; email: string } | null;
  orderedBy: { name: string | null; email: string } | null;
  client: { name: string | null; email: string } | null;
  invoiceProductOwners: {
    userId: string;
    name: string | null;
    email: string;
  }[];
  /** REQ-0063 — from linked order (same query as party enrichment) */
  linkedOrderNumber: string | null;
  linkedOrderItems: OrderItem[];
};

export function transformInvoiceDetail(
  invoice: InvoiceRaw,
  enrichment: InvoiceDetailEnrichment,
): Invoice {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    userId: invoice.userId,
    clientId: invoice.clientId,
    status: invoice.status as Invoice["status"],
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    shipping: invoice.shipping ?? null,
    discount: invoice.discount,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    amountDue: invoice.amountDue,
    dueDate: invoice.dueDate.toISOString(),
    issuedAt: invoice.issuedAt.toISOString(),
    sentAt: invoice.sentAt?.toISOString() || null,
    paidAt: invoice.paidAt?.toISOString() || null,
    cancelledAt: invoice.cancelledAt?.toISOString() || null,
    paymentLink: invoice.paymentLink,
    stripePaymentIntentId: invoice.stripePaymentIntentId ?? null,
    notes: invoice.notes,
    billingAddress: invoice.billingAddress,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString() || null,
    createdBy: invoice.createdBy,
    updatedBy: invoice.updatedBy,
    invoiceCreatedBy: enrichment.invoiceCreatedBy,
    orderedBy: enrichment.orderedBy,
    client: enrichment.client,
    invoiceProductOwners: enrichment.invoiceProductOwners,
    linkedOrderNumber: enrichment.linkedOrderNumber,
    linkedOrderItems: enrichment.linkedOrderItems,
  } as unknown as Invoice;
}
