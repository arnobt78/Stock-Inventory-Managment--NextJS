/**
 * REQ-0211 / REQ-0215 — Promote invoice status from money already on the row.
 * - draft + mid-pay → sent
 * - draft/sent/overdue + fully settled → paid (clamp amountDue)
 * Also syncs linked order.paymentStatus (partial→paid) when money/status change.
 */

import { prisma } from "@/prisma/client";
import {
  applyIncrementalInvoicePayment,
  syncOrderPaymentStatusFromInvoice,
} from "@/lib/payments/order-payment-from-amounts";
import { invalidateOnOrderChange } from "@/lib/cache";
import { logger } from "@/lib/logger";

export type HealInvoiceAfterMoneyResult = {
  amountPaid: number;
  total: number;
  status: string;
  orderId: string;
  /** True when invoice row and/or order paymentStatus were written */
  changed: boolean;
};

/**
 * Heal invoice status (+ amountDue clamp) from current money, then sync order pay status.
 * Idempotent no-op when already consistent. Invalidates order-graph Redis only when changed.
 */
export async function healInvoiceStatusAfterMoney(
  invoiceId: string,
): Promise<HealInvoiceAfterMoneyResult | null> {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return null;
  if (inv.status === "cancelled") {
    return {
      amountPaid: inv.amountPaid,
      total: inv.total,
      status: inv.status,
      orderId: inv.orderId,
      changed: false,
    };
  }

  const next = applyIncrementalInvoicePayment({
    priorAmountPaid: inv.amountPaid,
    total: inv.total,
    chargeAmount: 0,
    priorStatus: inv.status,
  });

  const statusNeedsWrite = next.status !== inv.status;
  const dueNeedsClamp =
    next.fullyPaid && Number(inv.amountDue) !== 0;
  const paidNeedsClamp =
    next.fullyPaid && Number(inv.amountPaid) !== next.amountPaid;

  let amountPaid = inv.amountPaid;
  let status = inv.status;
  let invoiceChanged = false;

  if (statusNeedsWrite || dueNeedsClamp || paidNeedsClamp) {
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: next.status,
        amountPaid: next.amountPaid,
        amountDue: next.amountDue,
        sentAt:
          next.status === "sent" || next.status === "paid"
            ? (inv.sentAt ?? new Date())
            : inv.sentAt,
        paidAt:
          next.status === "paid" ? (inv.paidAt ?? new Date()) : inv.paidAt,
        updatedAt: new Date(),
      },
    });
    amountPaid = updated.amountPaid;
    status = updated.status;
    invoiceChanged = true;
    logger.info("Healed invoice status after money", {
      invoiceId,
      from: inv.status,
      to: next.status,
      fullyPaid: next.fullyPaid,
    });
  }

  // REQ-0215 — always re-derive order payment from settled/mid money (fixes stuck partial)
  const priorOrderPay =
    inv.orderId
      ? (
          await prisma.order.findUnique({
            where: { id: inv.orderId },
            select: { paymentStatus: true },
          })
        )?.paymentStatus
      : null;

  const syncedPay = await syncOrderPaymentStatusFromInvoice(inv.orderId, {
    amountPaid,
    total: inv.total,
    invoiceStatus: status,
  });

  const orderChanged =
    syncedPay != null &&
    priorOrderPay != null &&
    priorOrderPay !== syncedPay;

  const changed = invoiceChanged || orderChanged;
  if (changed) {
    await invalidateOnOrderChange();
  }

  return {
    amountPaid,
    total: inv.total,
    status,
    orderId: inv.orderId,
    changed,
  };
}
