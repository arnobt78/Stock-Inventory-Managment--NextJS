/**
 * Server-side invoice detail fetch for SSR prefetch.
 * Mirrors GET /api/invoices/:id auth + response shape.
 */

import {
  getInvoiceById,
  getInvoiceByIdForProductOwner,
} from "@/prisma/invoice";
import { prisma } from "@/prisma/client";
import {
  transformInvoiceDetail,
  type InvoiceDetailEnrichment,
} from "@/lib/invoices/transform-invoice-detail";
import type { Invoice } from "@/types";
import type { SessionForDetail } from "@/lib/server/order-detail-data";

async function enrichInvoice(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceById>>>,
): Promise<InvoiceDetailEnrichment> {
  const order = await prisma.order.findUnique({
    where: { id: invoice.orderId },
    include: {
      items: {
        include: {
          product: { select: { userId: true } },
        },
      },
    },
  });

  const partyUserIds = [
    invoice.userId,
    invoice.createdBy,
    invoice.clientId,
    order?.userId,
    ...(order?.items ?? [])
      .map((item: { product?: { userId?: string } }) => item.product?.userId)
      .filter(Boolean),
  ].filter(Boolean) as string[];

  const uniqueIds = [...new Set(partyUserIds)];
  const partyUsers =
    uniqueIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true, name: true, email: true },
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
        name: userMap.get(resolvedIssuerId)!.name ?? null,
        email: userMap.get(resolvedIssuerId)!.email,
      }
    : null;

  const orderedBy =
    order && userMap.get(order.userId)
      ? {
          name: userMap.get(order.userId)!.name ?? null,
          email: userMap.get(order.userId)!.email,
        }
      : null;

  const client =
    invoice.clientId && userMap.get(invoice.clientId)
      ? {
          name: userMap.get(invoice.clientId)!.name ?? null,
          email: userMap.get(invoice.clientId)!.email,
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
      return u ? { userId: u.id, name: u.name ?? null, email: u.email } : null;
    })
    .filter(Boolean) as InvoiceDetailEnrichment["invoiceProductOwners"];

  return {
    invoiceCreatedBy,
    orderedBy,
    client,
    invoiceProductOwners,
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

  let invoice: Awaited<ReturnType<typeof getInvoiceById>> | null;
  if (isAdmin) {
    invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  } else if (isClient) {
    invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, clientId: userId },
    });
  } else {
    invoice = await getInvoiceById(invoiceId, userId);
    if (!invoice) {
      invoice = await getInvoiceByIdForProductOwner(invoiceId, userId);
    }
  }

  if (!invoice) return null;

  const enrichment = await enrichInvoice(invoice);
  return transformInvoiceDetail(invoice, enrichment);
}
