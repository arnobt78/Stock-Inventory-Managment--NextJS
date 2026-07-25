/**
 * REQ-0210 — Resolve invoice billing JSON from order addresses.
 * Prefer order.billingAddress; fall back to shipping when "use same for billing"
 * was checked but billing was not persisted separately.
 */

import type { Prisma } from "@prisma/client";
import type { BillingAddress } from "@/types";

type OrderAddressSource = {
  billingAddress?: unknown;
  shippingAddress?: unknown;
};

/** Clone address JSON for Prisma Invoice.billingAddress create/update. */
export function resolveInvoiceBillingAddressInput(
  order: OrderAddressSource,
): Prisma.InputJsonValue | null {
  const source = order.billingAddress ?? order.shippingAddress ?? null;
  if (source == null) return null;
  return JSON.parse(JSON.stringify(source)) as Prisma.InputJsonValue;
}

/** Client/SSR display: invoice billing, else order billing, else order shipping. */
export function resolveInvoiceBillingAddressForDisplay(
  invoiceBilling: unknown,
  order?: OrderAddressSource | null,
): BillingAddress | null {
  const fromInvoice = invoiceBilling as BillingAddress | null | undefined;
  if (fromInvoice && typeof fromInvoice === "object") {
    return fromInvoice;
  }
  const fromOrderBilling = order?.billingAddress as BillingAddress | null | undefined;
  if (fromOrderBilling && typeof fromOrderBilling === "object") {
    return fromOrderBilling;
  }
  const fromOrderShipping = order?.shippingAddress as BillingAddress | null | undefined;
  if (fromOrderShipping && typeof fromOrderShipping === "object") {
    return fromOrderShipping;
  }
  return null;
}
