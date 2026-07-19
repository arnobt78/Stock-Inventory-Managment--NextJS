/**
 * REQ-0127/0128 — shared order select for catalog detail + portal/dashboard SSR (statusAt).
 */

/** Invoice paidAt for paid/partial statusAt (Order has no paidAt field). */
export const orderInvoicePaidAtSelect = {
  invoice: { select: { paidAt: true } },
} as const;

export const orderStatusAtSelect = {
  status: true,
  paymentStatus: true,
  cancelledAt: true,
  deliveredAt: true,
  shippedAt: true,
  updatedAt: true,
  ...orderInvoicePaidAtSelect,
} as const;

export const catalogDetailOrderSelect = {
  id: true,
  orderNumber: true,
  subtotal: true,
  total: true,
  createdAt: true,
  userId: true,
  /** REQ-0158 — buyer for placedBy (distinct from store owner userId) */
  clientId: true,
  ...orderStatusAtSelect,
} as const;
