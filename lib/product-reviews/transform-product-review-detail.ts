/**
 * Shared product review detail response transform — used by API GET/PUT and SSR prefetch.
 * REQ-0024 / REQ-0180: single source of truth for product review detail JSON shape.
 */

import type { ProductReview } from "@/types";
import type { getProductReviewById } from "@/prisma/product-review";
import type {
  ReviewCatalogEnrich,
  ReviewPurchaseEnrich,
} from "@/lib/product-reviews/enrich-review-catalog";

type ProductReviewRecord = NonNullable<
  Awaited<ReturnType<typeof getProductReviewById>>
>;

type ReviewerInput = {
  name: string | null;
  email: string;
  image?: string | null;
} | null;

export function transformProductReviewDetail(
  r: ProductReviewRecord,
  reviewer?: ReviewerInput,
  catalog?: Partial<ReviewCatalogEnrich> | null,
  purchase?: Partial<ReviewPurchaseEnrich> | null,
): ProductReview {
  const base: ProductReview = {
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
  };

  return {
    ...base,
    ...(reviewer
      ? {
          reviewerName: reviewer.name,
          reviewerEmail: reviewer.email,
          reviewerImage: reviewer.image ?? null,
        }
      : {}),
    ...(catalog
      ? {
          productImageUrl: catalog.productImageUrl ?? null,
          categoryId: catalog.categoryId ?? null,
          categoryName: catalog.categoryName ?? null,
          supplierId: catalog.supplierId ?? null,
          supplierName: catalog.supplierName ?? null,
          supplierImage: catalog.supplierImage ?? null,
          supplierEmail: catalog.supplierEmail ?? null,
        }
      : {}),
    ...(purchase
      ? {
          orderNumber: purchase.orderNumber ?? null,
          invoiceId: purchase.invoiceId ?? null,
          invoiceNumber: purchase.invoiceNumber ?? null,
          orderStatus: purchase.orderStatus ?? null,
          orderPaymentStatus: purchase.orderPaymentStatus ?? null,
          orderTotal: purchase.orderTotal ?? null,
          orderCreatedAt: purchase.orderCreatedAt ?? null,
          invoiceStatus: purchase.invoiceStatus ?? null,
          invoiceTotal: purchase.invoiceTotal ?? null,
        }
      : {}),
  };
}
