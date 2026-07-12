/**
 * Product Review List Component
 * List view for admin product reviews with filters, table, and create button
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useProductReviews, useDashboard } from "@/hooks/queries";
import { isDataSlotLoading, queryKeys, useSyncSsrQueryData } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { PageSectionHeader } from "@/components/shared";
import { createProductReviewColumns } from "./ProductReviewTableColumns";
import ProductReviewFilters from "./ProductReviewFilters";
import { ProductReviewTable } from "./ProductReviewTable";
import ProductReviewDialog from "./ProductReviewDialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import type { ProductReview } from "@/types";
import type { DashboardStats } from "@/types";

export type ProductReviewListProps = {
  detailHrefBase?: string;
  /** SSR-passed reviews for first-render hydration (REQ-0021) */
  initialReviews?: ProductReview[];
  /** SSR dashboard stats for review stat cards (REQ-0025 P2) */
  initialStats?: DashboardStats;
};

export default function ProductReviewList({
  detailHrefBase,
  initialReviews,
  initialStats,
}: ProductReviewListProps = {}) {
  const { user } = useAuth();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const reviewsQuery = useProductReviews(initialReviews);
  const dashboardQuery = useDashboard(initialStats);
  const dashboard = dashboardQuery.data ?? null;

  useSyncSsrQueryData(queryKeys.productReviews.lists(), initialReviews);
  useSyncSsrQueryData(
    queryKeys.dashboard.overview(user?.id ?? ""),
    user?.id && initialStats !== undefined ? initialStats : undefined,
  );

  const allReviews = reviewsQuery.data ?? initialReviews ?? [];

  const ratingBreakdown = useMemo(() => {
    const r5 = allReviews.filter((r) => r.rating === 5).length;
    const r4 = allReviews.filter((r) => r.rating === 4).length;
    const r3 = allReviews.filter((r) => r.rating === 3).length;
    const r2 = allReviews.filter((r) => r.rating === 2).length;
    const r1 = allReviews.filter((r) => r.rating === 1).length;
    return { r5, r4, r3, r2, r1 };
  }, [allReviews]);

  const avgRating = useMemo(() => {
    if (allReviews.length === 0) return 0;
    const sum = allReviews.reduce((s, r) => s + (r.rating ?? 0), 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews]);

  const avgRatingLabel = useMemo(() => {
    const r = Math.min(5, Math.max(1, Math.round(avgRating)));
    const labels: Record<number, string> = {
      5: "best",
      4: "very good",
      3: "good",
      2: "not good",
      1: "bad",
    };
    return labels[r] ?? "—";
  }, [avgRating]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);

  const columns = useMemo(
    () =>
      createProductReviewColumns(detailHrefBase ?? "/admin/product-reviews"),
    [detailHrefBase],
  );

  // REQ-0021: shell-first — only data slots pulse
  const dashboardCardsLoading = isDataSlotLoading(dashboardQuery, initialStats);
  const reviewsCardsLoading = isDataSlotLoading(reviewsQuery, initialReviews);
  const tableDataLoading = isDataSlotLoading(reviewsQuery, initialReviews);

  return (
    <div className="flex flex-col poppins">
      <PageSectionHeader
        as="h2"
        icon={Star}
        tone="amber"
        title="Store Product Reviews (your products)"
        description="Manage and moderate product reviews. Approve or reject, view by product, rating, and status. Add reviews for products."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 pb-6 items-stretch">
        <StatisticsCard
          title="Reviews"
          value={dashboard?.counts?.reviews ?? allReviews.length}
          description="Product reviews"
          icon={Star}
          variant="violet"
          valueLoading={dashboardCardsLoading}
          badgeValuesLoading={dashboardCardsLoading}
          badges={[
            {
              label: "Pending",
              value: dashboard?.reviewStatusBreakdown?.pending ?? 0,
            },
            {
              label: "Approved",
              value: dashboard?.reviewStatusBreakdown?.approved ?? 0,
            },
            {
              label: "Rejected",
              value: dashboard?.reviewStatusBreakdown?.rejected ?? 0,
            },
          ]}
        />
        <StatisticsCard
          title="Avg. Rating"
          value={avgRating > 0 ? `${avgRating} · ${avgRatingLabel}` : "—"}
          description="Average among your product reviews"
          icon={Star}
          variant="amber"
          valueLoading={reviewsCardsLoading}
          badgeValuesLoading={reviewsCardsLoading}
          badges={[
            { label: "5 best", value: ratingBreakdown.r5 },
            { label: "4 very good", value: ratingBreakdown.r4 },
            { label: "3 good", value: ratingBreakdown.r3 },
            { label: "2 not good", value: ratingBreakdown.r2 },
            { label: "1 bad", value: ratingBreakdown.r1 },
          ]}
        />
      </div>

      <div className="pb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <ProductReviewFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedRatings={selectedRatings}
            setSelectedRatings={setSelectedRatings}
            setPagination={setPagination}
          />
        </div>
        {isMounted && (
          <div className="flex-shrink-0">
            <ProductReviewDialog
              trigger={
                <Button className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Add Review
                </Button>
              }
            />
          </div>
        )}
      </div>

      <ProductReviewTable
        data={allReviews}
        columns={columns}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        selectedStatuses={selectedStatuses}
        selectedRatings={selectedRatings}
      />
    </div>
  );
}
