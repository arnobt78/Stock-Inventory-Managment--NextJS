/**
 * Product Review type definitions
 */

export type ProductReviewStatus = "pending" | "approved" | "rejected";

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  orderItemId: string | null;
  productName: string;
  productSku: string | null;
  rating: number;
  comment: string;
  status: ProductReviewStatus;
  createdAt: string;
  updatedAt: string | null;
  /** Present when API returns detail or by-product list (reviewer display). */
  reviewerName?: string | null;
  /** Present when API returns detail or by-product list. */
  reviewerEmail?: string;
  /** Present when API returns by-product list (avatar in review card). */
  reviewerImage?: string | null;
  /** REQ-0180 — live product catalog enrich for list/detail densify */
  productImageUrl?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierImage?: string | null;
  supplierEmail?: string | null;
  /** REQ-0180 — purchase link on detail when orderId set */
  orderNumber?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  /** REQ-0183 — purchase densify on detail */
  orderStatus?: string | null;
  orderPaymentStatus?: string | null;
  orderTotal?: number | null;
  orderCreatedAt?: string | null;
  invoiceStatus?: string | null;
  invoiceTotal?: number | null;
}

export interface CreateProductReviewInput {
  productId: string;
  rating: number;
  comment: string;
  /** Required for user-submitted reviews: order this purchase relates to (one review per purchase). */
  orderId?: string;
  /** Optional: specific order line when order has multiple lines of same product. */
  orderItemId?: string;
}

/** One eligible "slot" to write a review (paid purchase with no review yet). */
export interface ReviewEligibilitySlot {
  orderId: string;
  orderItemId?: string;
}

export interface UpdateProductReviewInput {
  status?: ProductReviewStatus;
  rating?: number;
  comment?: string;
}

export interface ProductReviewFilters {
  status?: ProductReviewStatus | ProductReviewStatus[];
  productId?: string;
  userId?: string;
  minRating?: number;
  maxRating?: number;
  search?: string;
}
