/**
 * Server-side invoice detail fetch for SSR prefetch.
 * Mirrors GET /api/invoices/:id auth + response shape.
 */

import {
  getInvoiceById,
  getInvoiceByIdForClient,
  getInvoiceByIdForProductOwner,
  getInvoiceByIdForSupplier,
} from "@/prisma/invoice";
import { prisma } from "@/prisma/client";
import { getSupplierByUserId } from "@/prisma/supplier";
import {
  transformInvoiceDetail,
  type InvoiceDetailEnrichment,
} from "@/lib/invoices/transform-invoice-detail";
import { mapOrderItemsFromRaw } from "@/lib/orders/map-order-items";
import { enrichOrderItemsCatalogNames } from "@/lib/orders/enrich-order-items-catalog";
import { toParty } from "@/lib/server/catalog-party-snapshot";
import { resolveBuyerUserId } from "@/lib/orders/order-party";
import { resolveInvoiceBillingAddressForDisplay } from "@/lib/invoices/resolve-invoice-billing-address";
import { healInvoiceStatusAfterMoney } from "@/lib/invoices/heal-invoice-status-after-money";
import type { BillingAddress, Invoice } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

async function enrichInvoice(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceById>>>,
): Promise<InvoiceDetailEnrichment> {
  const order = await prisma.order.findUnique({
    where: { id: invoice.orderId },
    include: {
      items: {
        include: {
          // REQ-0063: widen select for line-item thumbs + party owners (single order query)
          product: {
            select: {
              userId: true,
              categoryId: true,
              supplierId: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  // Include buyer id for Ordered by (REQ-0159 — not store owner)
  const orderBuyerId = order
    ? resolveBuyerUserId({
        userId: order.userId,
        clientId: order.clientId,
      })
    : null;

  const partyUserIds = [
    invoice.userId,
    invoice.createdBy,
    invoice.updatedBy,
    invoice.clientId,
    order?.userId,
    order?.clientId,
    orderBuyerId,
    ...(order?.items ?? [])
      .map((item: { product?: { userId?: string } }) => item.product?.userId)
      .filter(Boolean),
  ].filter(Boolean) as string[];

  const uniqueIds = [...new Set(partyUserIds)];
  const partyUsers =
    uniqueIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true, name: true, email: true, image: true },
        })
      : [];
  const userMap = new Map(partyUsers.map((u) => [u.id, u]));

  const issuerProductOwnerIds = [
    ...new Set(
      (order?.items ?? [])
        .map((item: { product?: { userId?: string } }) => item.product?.userId)
        .filter(Boolean),
    ),
  ] as string[];
  const resolvedIssuerId =
    issuerProductOwnerIds[0] ?? invoice.createdBy ?? invoice.userId;

  const invoiceCreatedBy = userMap.get(resolvedIssuerId)
    ? {
        userId: resolvedIssuerId,
        name: userMap.get(resolvedIssuerId)!.name ?? null,
        email: userMap.get(resolvedIssuerId)!.email,
        image: userMap.get(resolvedIssuerId)!.image ?? null,
      }
    : null;

  // REQ-0159 — Ordered by = buyer (clientId when Client order)
  const orderedBy =
    order && orderBuyerId && userMap.get(orderBuyerId)
      ? {
          userId: orderBuyerId,
          name: userMap.get(orderBuyerId)!.name ?? null,
          email: userMap.get(orderBuyerId)!.email,
          image: userMap.get(orderBuyerId)!.image ?? null,
        }
      : null;

  const client =
    invoice.clientId && userMap.get(invoice.clientId)
      ? {
          userId: invoice.clientId,
          name: userMap.get(invoice.clientId)!.name ?? null,
          email: userMap.get(invoice.clientId)!.email,
          image: userMap.get(invoice.clientId)!.image ?? null,
        }
      : null;

  const productOwnerIds = [
    ...new Set(
      (order?.items ?? [])
        .map((item: { product?: { userId?: string } }) => item.product?.userId)
        .filter(Boolean),
    ),
  ] as string[];

  const invoiceProductOwners = productOwnerIds
    .map((id) => {
      const u = userMap.get(id);
      return u
        ? {
            userId: u.id,
            name: u.name ?? null,
            email: u.email,
            image: u.image ?? null,
          }
        : null;
    })
    .filter(Boolean) as InvoiceDetailEnrichment["invoiceProductOwners"];

  // REQ-0210 — billing fallback + shipping from linked order for detail cards
  const resolvedBillingAddress = resolveInvoiceBillingAddressForDisplay(
    invoice.billingAddress,
    order
      ? {
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
        }
      : null,
  );
  const shippingAddress = (order?.shippingAddress as BillingAddress | null) ?? null;

  return {
    invoiceCreatedBy,
    orderedBy,
    client,
    invoiceProductOwners,
    linkedOrderNumber: order?.orderNumber ?? null,
    linkedOrderItems: await enrichOrderItemsCatalogNames(
      mapOrderItemsFromRaw(order?.items, order
        ? { subtotal: order.subtotal, total: order.total }
        : undefined),
    ),
    linkedOrderStatus: order?.status ?? null,
    linkedOrderPaymentStatus: order?.paymentStatus ?? null,
    resolvedBillingAddress,
    shippingAddress,
    creator: toParty(
      invoice.createdBy ? userMap.get(invoice.createdBy) ?? null : null,
    ),
    updater: toParty(
      invoice.updatedBy ? userMap.get(invoice.updatedBy) ?? null : null,
    ),
  };
}

/** Role-scoped invoice detail for page SSR — null when not found or unauthorized. */
export async function getInvoiceDetailForPage(
  session: SessionForDetail,
  invoiceId: string,
): Promise<Invoice | null> {
  const userId = session.id;
  const isAdmin = session.role === "admin";
  const isClient = session.role === "client";
  const isSupplier = session.role === "supplier";

  let invoice: Awaited<ReturnType<typeof getInvoiceById>> | null;
  if (isAdmin) {
    invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  } else if (isClient) {
    // REQ-0214 — buyer invoices + catalog recent-order INV chips (read-only; Pay gated in UI)
    invoice = await getInvoiceByIdForClient(invoiceId, userId);
  } else if (isSupplier) {
    // REQ-0204 — view invoices for orders that include this supplier's products
    const supplier = await getSupplierByUserId(userId);
    invoice = supplier
      ? await getInvoiceByIdForSupplier(invoiceId, supplier.id)
      : null;
  } else {
    invoice = await getInvoiceById(invoiceId, userId);
    if (!invoice) {
      invoice = await getInvoiceByIdForProductOwner(invoiceId, userId);
    }
  }

  if (!invoice) return null;

  // REQ-0211 / REQ-0215 — heal draft→sent mid-pay; sent/overdue→paid when settled; sync order
  if (invoice.status !== "cancelled" && invoice.amountPaid > 0) {
    const healed = await healInvoiceStatusAfterMoney(invoice.id);
    if (healed?.changed) {
      const refreshed = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      });
      if (refreshed) invoice = refreshed;
    }
  }

  const enrichment = await enrichInvoice(invoice);
  return transformInvoiceDetail(invoice, enrichment);
}
