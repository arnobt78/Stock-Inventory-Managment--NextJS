/**
 * REQ-0152 / REQ-0209 — Derive order paymentStatus from invoice money fields.
 * unpaid (paid<=0) | partial (0 < paid < total) | paid (paid >= total).
 * Does not invent an invoice "partial" status — money fields carry mid-pay.
 * REQ-0209 — first money (partial or paid) while pending → confirm + fulfill once.
 */

import { prisma } from "@/prisma/client";
import { fulfillPendingOrderLines } from "@/lib/products/order-stock-reservation";
import { logger } from "@/lib/logger";
import type { PaymentStatus } from "@/types";

const EPS = 0.001;

/** Pure: map amountPaid vs total → order paymentStatus (never refunded). */
export function deriveOrderPaymentStatus(
  amountPaid: number,
  total: number,
): Exclude<PaymentStatus, "refunded"> {
  const paid = Number.isFinite(amountPaid) ? amountPaid : 0;
  const tot = Number.isFinite(total) ? total : 0;
  if (paid <= EPS || tot <= EPS) return "unpaid";
  if (paid + EPS >= tot) return "paid";
  return "partial";
}

/**
 * REQ-0209 — When first money lands on a pending order, bump fulfillment to confirmed
 * and fulfill reserved stock once. Partial → paid later must not fulfill again.
 */
export function shouldConfirmAndFulfillOnPaymentSync(args: {
  derived: Exclude<PaymentStatus, "refunded">;
  orderStatus: string | null | undefined;
}): boolean {
  const status = args.orderStatus ?? "pending";
  if (status !== "pending") return false;
  return args.derived === "partial" || args.derived === "paid";
}

export type SyncOrderPaymentFromInvoiceInput = {
  amountPaid: number;
  total: number;
  /** When cancelled, leave order payment untouched. */
  invoiceStatus?: string | null;
};

/**
 * Sync linked order.paymentStatus from invoice money.
 * Skips refunded orders.
 * REQ-0209 — pending + (partial|paid) → status confirmed + fulfillPendingOrderLines once.
 * Returns the payment status written, or null if skipped.
 */
export async function syncOrderPaymentStatusFromInvoice(
  orderId: string | null | undefined,
  input: SyncOrderPaymentFromInvoiceInput,
): Promise<Exclude<PaymentStatus, "refunded"> | null> {
  if (!orderId) return null;
  if (input.invoiceStatus === "cancelled") return null;

  const derived = deriveOrderPaymentStatus(input.amountPaid, input.total);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;
  if (order.paymentStatus === "refunded") return null;

  const shouldConfirmAndFulfill = shouldConfirmAndFulfillOnPaymentSync({
    derived,
    orderStatus: order.status,
  });
  const statusUnchanged =
    order.paymentStatus === derived && !shouldConfirmAndFulfill;

  if (statusUnchanged) return derived;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: derived,
      ...(shouldConfirmAndFulfill ? { status: "confirmed" as const } : {}),
      updatedAt: new Date(),
    },
  });

  // Fulfill reserved lines only when leaving pending on first money (partial or paid)
  if (shouldConfirmAndFulfill) {
    try {
      await fulfillPendingOrderLines(
        order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          warehouseId: item.warehouseId,
        })),
      );
    } catch (allocErr) {
      logger.warn(
        "Failed to fulfill stock for invoice-synced order after first payment",
        {
          orderId,
          derived,
          error: allocErr,
        },
      );
    }
  }

  return derived;
}

/**
 * Apply a Stripe charge amount onto invoice money (incremental).
 * Returns next amountPaid / amountDue / status for prisma update.
 * When not fully paid, caller should clear paidAt (set null).
 */
export function applyIncrementalInvoicePayment(args: {
  priorAmountPaid: number;
  total: number;
  chargeAmount: number;
  priorStatus: string;
}): {
  amountPaid: number;
  amountDue: number;
  status: string;
  fullyPaid: boolean;
} {
  const total = Math.max(0, args.total);
  const newPaid = Math.min(
    total,
    Math.max(0, args.priorAmountPaid) + Math.max(0, args.chargeAmount),
  );
  const amountDue = Math.max(0, total - newPaid);
  const fullyPaid = amountDue <= EPS;
  let status = args.priorStatus;
  if (fullyPaid) {
    status = "paid";
  } else if (args.priorStatus === "paid") {
    status = "sent";
  }
  return { amountPaid: newPaid, amountDue, status, fullyPaid };
}
