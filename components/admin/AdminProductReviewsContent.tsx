"use client";

import React from "react";
import ProductReviewList from "./ProductReviewList";
import { PageContentWrapper } from "@/components/shared";
import type { ProductReview } from "@/types";

export type AdminProductReviewsContentProps = {
  initialReviews?: ProductReview[];
};

/** Admin Product Reviews — list inside admin layout (REQ-0021 initialData via props). */
export default function AdminProductReviewsContent({
  initialReviews,
}: AdminProductReviewsContentProps = {}) {
  return (
    <PageContentWrapper>
      <ProductReviewList
        detailHrefBase="/admin/product-reviews"
        initialReviews={initialReviews}
      />
    </PageContentWrapper>
  );
}
