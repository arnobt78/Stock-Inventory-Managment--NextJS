"use client";

import React from "react";
import ProductReviewList from "./ProductReviewList";
import { PageContentWrapper } from "@/components/shared";
import type { ProductReview, DashboardStats } from "@/types";

export type AdminProductReviewsContentProps = {
  initialReviews?: ProductReview[];
  initialStats?: DashboardStats;
};

/** Admin Product Reviews — list inside admin layout (REQ-0021 initialData via props). */
export default function AdminProductReviewsContent({
  initialReviews,
  initialStats,
}: AdminProductReviewsContentProps = {}) {
  return (
    <PageContentWrapper>
      <ProductReviewList
        detailHrefBase="/admin/product-reviews"
        initialReviews={initialReviews}
        initialStats={initialStats}
      />
    </PageContentWrapper>
  );
}
