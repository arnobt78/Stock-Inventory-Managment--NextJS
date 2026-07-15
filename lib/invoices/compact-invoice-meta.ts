"use client";

/**
 * REQ-0126 — compact invoice meta for table Invoice # column (order link, items, units).
 */

import type { Invoice } from "@/types";

export function compactInvoiceMeta(invoice: Invoice): string {
  const items = invoice.linkedOrderItems ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemPart =
    items.length > 0
      ? `${items.length} item${items.length === 1 ? "" : "s"} · ${totalQty} unit${totalQty === 1 ? "" : "s"}`
      : null;
  const orderPart = invoice.linkedOrderNumber
    ? `Order ${invoice.linkedOrderNumber}`
    : null;
  return [orderPart, itemPart].filter(Boolean).join(" · ") || "—";
}
