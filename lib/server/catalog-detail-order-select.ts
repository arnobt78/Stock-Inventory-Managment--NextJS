/**
 * REQ-0127/0128 — shared order select for catalog detail + portal/dashboard SSR (statusAt).
 */

export const orderStatusAtSelect = {
  status: true,
  paymentStatus: true,
  cancelledAt: true,
  deliveredAt: true,
  shippedAt: true,
  updatedAt: true,
} as const;

export const catalogDetailOrderSelect = {
  id: true,
  orderNumber: true,
  subtotal: true,
  total: true,
  createdAt: true,
  userId: true,
  ...orderStatusAtSelect,
} as const;
