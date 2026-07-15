/**
 * REQ-0127 — shared order select for catalog detail SSR (recent orders + statusAt).
 */

export const catalogDetailOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  subtotal: true,
  total: true,
  createdAt: true,
  userId: true,
  paidAt: true,
  cancelledAt: true,
  deliveredAt: true,
  shippedAt: true,
  updatedAt: true,
} as const;
