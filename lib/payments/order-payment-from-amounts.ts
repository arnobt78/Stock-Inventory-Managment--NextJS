/**
 * REQ-0152 / REQ-0209 — Derive order paymentStatus from invoice money fields.
 * unpaid (paid<=0) | partial (0 < paid < total) | paid (paid >= total).
 * Does not invent an invoice "partial" status — money fields carry mid-pay.
 * REQ-0209 — first money (partial or paid) while pending → confirm + fulfill once.
 * REQ-0215 — cent-safe compare so partial→remainder settle promotes paid (no float stuck sent/partial).
 */

import { prisma } from "@/prisma/client";
import { fulfillPendingOrderLines } from "@/lib/products/order-stock-reservation";
import { logger } from "@/lib/logger";
import type { PaymentStatus } from "@/types";

/** Dollar → integer cents for settle comparisons (avoids 1880.06 float noise). */
export function toCents(amount: number): number {
  const n = Number.isFinite(amount) ? amount : 0;
  return Math.round(n * 100);
}

/** Pure: map amountPaid vs total → order paymentStatus (never refunded). */
export function deriveOrderPaymentStatus(
  amountPaid: number,
  total: number,
): Exclude<PaymentStatus, "refunded"> {
  const paidCents = toCents(amountPaid);
  const totalCents = toCents(total);
  if (paidCents <= 0 || totalCents <= 0) return "unpaid";
  if (paidCents >= totalCents) return "paid";
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
 * REQ-0215 — cent-safe fullyPaid; clamp amountDue to 0 when settled.
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
  const priorPaid = Math.max(0, args.priorAmountPaid);
  const charge = Math.max(0, args.chargeAmount);
  const totalCents = toCents(total);
  const newPaidCents = Math.min(
    totalCents,
    toCents(priorPaid) + toCents(charge),
  );
  const fullyPaid = totalCents > 0 && newPaidCents >= totalCents;
  // Prefer exact total dollars when settled so UI matches invoice.total
  const amountPaid = fullyPaid ? total : newPaidCents / 100;
  const amountDue = fullyPaid ? 0 : Math.max(0, (totalCents - newPaidCents) / 100);
  let status = args.priorStatus;
  if (fullyPaid) {
    status = "paid";
  } else if (newPaidCents > 0) {
    // REQ-0211 — any money: draft→sent; keep overdue; never revive cancelled
    if (args.priorStatus === "cancelled") {
      status = "cancelled";
    } else if (args.priorStatus === "overdue") {
      status = "overdue";
    } else {
      status = "sent";
    }
  }
  return { amountPaid, amountDue, status, fullyPaid };
}

/**
 * REQ-0211 / REQ-0215 — Recompute invoice status from current money (chargeAmount 0).
 * Promotes draft→sent on mid-pay; sent/overdue/draft → paid when fully settled.
 */
export function resolveInvoiceStatusAfterMoney(args: {
  status: string;
  amountPaid: number;
  total: number;
}): string {
  return applyIncrementalInvoicePayment({
    priorAmountPaid: args.amountPaid,
    total: args.total,
    chargeAmount: 0,
    priorStatus: args.status,
  }).status;
}
