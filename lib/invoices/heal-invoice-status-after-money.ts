/**
 * REQ-0211 — Promote draft→sent (or →paid) when money is already on the invoice.
 * Prod webhook / older confirm can write amountPaid while leaving status draft;
 * call on confirm alreadyApplied + invoice detail SSR so UI catches up without re-pay.
 */

import { prisma } from "@/prisma/client";
import { resolveInvoiceStatusAfterMoney } from "@/lib/payments/order-payment-from-amounts";
import { logger } from "@/lib/logger";

export async function healInvoiceStatusAfterMoney(invoiceId: string): Promise<{
  amountPaid: number;
  total: number;
  status: string;
  orderId: string;
} | null> {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return null;

  const nextStatus = resolveInvoiceStatusAfterMoney({
    status: inv.status,
    amountPaid: inv.amountPaid,
    total: inv.total,
  });

  if (nextStatus === inv.status) {
    return {
      amountPaid: inv.amountPaid,
      total: inv.total,
      status: inv.status,
      orderId: inv.orderId,
    };
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: nextStatus,
      sentAt:
        nextStatus === "sent" || nextStatus === "paid"
          ? (inv.sentAt ?? new Date())
          : inv.sentAt,
      paidAt: nextStatus === "paid" ? (inv.paidAt ?? new Date()) : inv.paidAt,
      updatedAt: new Date(),
    },
  });

  logger.info("Healed invoice status after money", {
    invoiceId,
    from: inv.status,
    to: nextStatus,
  });

  return {
    amountPaid: updated.amountPaid,
    total: updated.total,
    status: updated.status,
    orderId: updated.orderId,
  };
}
