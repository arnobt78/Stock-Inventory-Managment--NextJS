/**
 * REQ-0180 — batch catalog enrich for product review list/detail
 * (product image, category, supplier avatar; optional order/invoice on detail).
 */

import { prisma } from "@/prisma/client";
import {
  loadProductListPartyMaps,
  productListPartyFields,
} from "@/lib/server/product-list-party";
import type { ProductReview } from "@/types";

export type ReviewCatalogEnrich = {
  productImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  supplierImage: string | null;
  supplierEmail: string | null;
};

export type ReviewPurchaseEnrich = {
  orderNumber: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  /** REQ-0183 — densify purchase card on detail */
  orderStatus: string | null;
  orderPaymentStatus: string | null;
  orderTotal: number | null;
  orderCreatedAt: string | null;
  invoiceStatus: string | null;
  invoiceTotal: number | null;
};

type ReviewerRow = {
  name: string | null;
  email: string;
  image: string | null;
};

const EMPTY_CATALOG: ReviewCatalogEnrich = {
  productImageUrl: null,
  categoryId: null,
  categoryName: null,
  supplierId: null,
  supplierName: null,
  supplierImage: null,
  supplierEmail: null,
};

/** List/API row shape before catalog enrich (Prisma review record). */
export type ReviewListRecord = {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  orderItemId: string | null;
  productName: string;
  productSku: string | null;
  rating: number;
  comment: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
};

/** Batch product + party maps keyed by productId. */
export async function loadReviewCatalogByProductId(
  productIds: string[],
): Promise<Map<string, ReviewCatalogEnrich>> {
  const map = new Map<string, ReviewCatalogEnrich>();
  const ids = [...new Set(productIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      userId: true,
      imageUrl: true,
      categoryId: true,
      supplierId: true,
    },
  });

  const partyMaps = await loadProductListPartyMaps(products);
  const supplierUserIds = [
    ...new Set(
      [...partyMaps.supplierMap.values()]
        .map((s) => s.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const supplierEmails = new Map<string, string | null>();
  if (supplierUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: supplierUserIds } },
      select: { id: true, email: true },
    });
    users.forEach((u) => supplierEmails.set(u.id, u.email));
  }

  for (const p of products) {
    const party = productListPartyFields(p, partyMaps);
    const supplierMeta = partyMaps.supplierMap.get(p.supplierId);
    const supplierEmail = supplierMeta?.userId
      ? (supplierEmails.get(supplierMeta.userId) ?? null)
      : null;
    map.set(p.id, {
      productImageUrl: p.imageUrl ?? null,
      categoryId: p.categoryId ?? null,
      categoryName: party.category === "Unknown" ? null : party.category,
      supplierId: p.supplierId ?? null,
      supplierName: party.supplier === "Unknown" ? null : party.supplier,
      supplierImage: party.supplierImage,
      supplierEmail,
    });
  }
  return map;
}

/** Batch reviewers with avatar. */
export async function loadReviewerMap(
  userIds: string[],
): Promise<Map<string, ReviewerRow>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, ReviewerRow>();
  if (ids.length === 0) return map;
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, image: true },
  });
  users.forEach((u) =>
    map.set(u.id, {
      name: u.name,
      email: u.email,
      image: u.image ?? null,
    }),
  );
  return map;
}

/** Order + linked invoice densify for a single review detail. */
export async function loadReviewPurchaseEnrich(
  orderId: string | null | undefined,
): Promise<ReviewPurchaseEnrich> {
  const empty: ReviewPurchaseEnrich = {
    orderNumber: null,
    invoiceId: null,
    invoiceNumber: null,
    orderStatus: null,
    orderPaymentStatus: null,
    orderTotal: null,
    orderCreatedAt: null,
    invoiceStatus: null,
    invoiceTotal: null,
  };
  if (!orderId) return empty;
  const [order, invoice] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.invoice.findUnique({
      where: { orderId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
      },
    }),
  ]);
  return {
    orderNumber: order?.orderNumber ?? null,
    invoiceId: invoice?.id ?? null,
    invoiceNumber: invoice?.invoiceNumber ?? null,
    orderStatus: order?.status ?? null,
    orderPaymentStatus: order?.paymentStatus ?? null,
    orderTotal: order?.total ?? null,
    orderCreatedAt: order?.createdAt?.toISOString() ?? null,
    invoiceStatus: invoice?.status ?? null,
    invoiceTotal: invoice?.total ?? null,
  };
}

/** Map Prisma review records → list DTOs with reviewer + catalog densify. */
export async function mapProductReviewsWithCatalog(
  records: ReviewListRecord[],
): Promise<ProductReview[]> {
  const [reviewerMap, catalogMap] = await Promise.all([
    loadReviewerMap(records.map((r) => r.userId)),
    loadReviewCatalogByProductId(records.map((r) => r.productId)),
  ]);

  return records.map((r) => {
    const reviewer = reviewerMap.get(r.userId);
    const catalog = catalogMap.get(r.productId) ?? EMPTY_CATALOG;
    return {
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      orderId: r.orderId,
      orderItemId: r.orderItemId ?? null,
      productName: r.productName,
      productSku: r.productSku,
      rating: r.rating,
      comment: r.comment,
      status: r.status as ProductReview["status"],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? null,
      reviewerName: reviewer?.name ?? null,
      reviewerEmail: reviewer?.email,
      reviewerImage: reviewer?.image ?? null,
      ...catalog,
    };
  });
}

/** True when cached list rows include REQ-0180 densify fields. */
export function hasReviewListV2Shape(
  cached: ProductReview[] | null,
): cached is ProductReview[] {
  if (cached == null) return false;
  if (cached.length === 0) return true;
  const first = cached[0];
  return (
    first != null &&
    "productImageUrl" in first &&
    "reviewerImage" in first
  );
}
