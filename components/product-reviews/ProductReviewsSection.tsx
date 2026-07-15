"use client";

import React, { useState } from "react";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import { SectionTitleRow } from "@/lib/ui/section-title-row";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts";
import {
  useReviewsByProduct,
  useReviewEligibility,
  useDeleteProductReview,
} from "@/hooks/queries";
import { ClientCompactDateTime } from "@/components/shared";
import { cn } from "@/lib/utils";
import { queryKeys, useSyncSsrQueryDataMany } from "@/lib/react-query";
import type { ProductReview, ReviewEligibilitySlot } from "@/types";
import WriteEditReviewDialog from "./WriteEditReviewDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MessageSquare, Pencil, Star, Trash2 } from "lucide-react";

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={cn(
            "h-4 w-4",
            value >= v
              ? "text-amber-500 fill-amber-500"
              : "text-gray-300 dark:text-gray-600",
          )}
        />
      ))}
    </div>
  );
}

export type ProductReviewsSectionProps = {
  productId: string;
  productName: string;
  /** When on order detail, pass orderId to only show eligibility for this order */
  orderId?: string;
  /** Optional: show compact (e.g. inside order item row) */
  compact?: boolean;
  variant?: "amber" | "violet" | "sky";
  /** REQ-0026 — SSR-passed reviews; skips client fetch on first paint */
  initialReviews?: ProductReview[];
  /** REQ-0026 — SSR-passed eligibility for this product/order */
  initialEligibility?: {
    eligible: boolean;
    slots: ReviewEligibilitySlot[];
  };
};

const variantConfig = {
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    iconBg:
      "border-amber-300/30 bg-amber-100/50 dark:border-amber-400/30 dark:bg-amber-500/20",
    button: "border-amber-400/30 from-amber-500/50 to-amber-500/30 text-white",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent",
    shadow: "shadow-[0_15px_40px_rgba(139,92,246,0.12)]",
    iconBg:
      "border-violet-300/30 bg-violet-100/50 dark:border-violet-400/30 dark:bg-violet-500/20",
    button:
      "border-violet-400/30 from-violet-500/50 to-violet-500/30 text-white",
  },
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent",
    shadow: "shadow-[0_15px_40px_rgba(2,132,199,0.12)]",
    iconBg:
      "border-sky-300/30 bg-sky-100/50 dark:border-sky-400/30 dark:bg-sky-500/20",
    button: "border-sky-400/30 from-sky-500/50 to-sky-500/30 text-white",
  },
};

export default function ProductReviewsSection({
  productId,
  productName,
  orderId,
  compact = false,
  variant = "amber",
  initialReviews,
  initialEligibility,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(
    null,
  );

  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByProduct(
    productId,
    {
      status: "all",
      initialData: initialReviews,
    },
  );
  const { data: eligibility, isLoading: eligibilityLoading } =
    useReviewEligibility(productId, orderId, {
      initialData: initialEligibility,
    });

  useSyncSsrQueryDataMany([
    {
      queryKey: queryKeys.productReviews.byProduct(productId, "all"),
      serverData: initialReviews,
    },
    {
      queryKey: queryKeys.productReviews.eligibility(productId, orderId),
      serverData: initialEligibility,
    },
  ]);

  const deleteReview = useDeleteProductReview();

  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const myReviews = user ? reviews.filter((r) => r.userId === user.id) : [];
  const myPendingReviews = user
    ? reviews.filter((r) => r.userId === user.id && r.status === "pending")
    : [];
  // Show approved + current user's pending so their new review appears immediately after submit
  const reviewsToShow = [...approvedReviews, ...myPendingReviews];
  const eligible = eligibility?.eligible ?? false;
  const firstSlot = eligibility?.slots?.[0];

  const handleEdit = (review: ProductReview) => {
    setEditingReview(review);
    setDialogOpen(true);
  };
  const handleWriteNew = () => {
    setEditingReview(null);
    setDialogOpen(true);
  };
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingReview(null);
  };

  const config = variantConfig[variant];

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 flex-wrap">
          {eligibilityLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : eligible ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleWriteNew}
              className={cn(
                "rounded-lg h-8 text-amber-600 dark:text-amber-400",
                "border border-amber-400/30 bg-amber-500/5 hover:bg-amber-500/10",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Write review
            </Button>
          ) : null}
          {myReviews.map((r) => (
            <span key={r.id} className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(r)}
                className="h-8 rounded-lg text-gray-600 dark:text-gray-400"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  deleteReview.mutate(r.id, {
                    onSuccess: () => setEditingReview(null),
                  })
                }
                disabled={deleteReview.isPending}
                className="h-8 rounded-lg text-rose-600 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </span>
          ))}
        </div>
        <WriteEditReviewDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          productId={productId}
          productName={productName}
          orderId={firstSlot?.orderId}
          orderItemId={firstSlot?.orderItemId}
          existingReview={editingReview}
          onSuccess={() => {}}
        />
      </>
    );
  }

  return (
    <article
      className={cn(
        "rounded-[20px] border p-2 sm:p-4 backdrop-blur-md",
        "bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-xl border", config.iconBg)}>
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <SectionTitleRow
            as="h3"
            title="Reviews"
            count={!reviewsLoading ? reviewsToShow.length : undefined}
          />
        </div>
        {user && (
          <div className="flex items-center gap-2">
            {eligibilityLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : eligible ? (
              <Button
                type="button"
                onClick={handleWriteNew}
                size="sm"
                className={cn(
                  "rounded-xl border bg-gradient-to-r shadow-sm",
                  config.button,
                )}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a review
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {reviewsLoading ? (
        <div className="space-y-2 py-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-gray-200/50 dark:bg-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : reviewsToShow.length === 0 ? (
        <p className={CARD_EMPTY_MESSAGE_CLASS}>
          No reviews yet.
          {user && eligible && " Click “Write a review” above."}
        </p>
      ) : (
        <ul className="space-y-4">
          {reviewsToShow.map((review) => {
            const displayName =
              review.reviewerName?.trim() ||
              review.reviewerEmail ||
              (review.userId === user?.id ? "You" : "User");
            const avatar = resolveAvatarSourcesFromSeed(
              review.userId,
              review.reviewerImage,
            );
            return (
              <li
                key={review.id}
                className={cn(
                  "rounded-xl border border-amber-200/30 dark:border-white/10 p-4",
                  "bg-white/40 dark:bg-white/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating value={review.rating} />
                      {review.status === "pending" && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Pending approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 mt-2 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <SafeAvatarImage
                        src={avatar.src}
                        fallbackSrc={avatar.fallbackSrc}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover border border-amber-200/90 dark:border-white/30 flex-shrink-0"
                      />
                      <span className="text-xs font-medium text-gray-500 dark:text-white/80 ">
                        {displayName}
                      </span>
                      <ClientCompactDateTime
                        date={review.createdAt}
                        semantic="created"
                      />
                    </div>
                  </div>
                  {user && review.userId === user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                        >
                          <span className="sr-only">Actions</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => handleEdit(review)}
                          className="cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit review
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            deleteReview.mutate(review.id, {
                              onSuccess: () => setEditingReview(null),
                            })
                          }
                          disabled={deleteReview.isPending}
                          className="cursor-pointer text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <WriteEditReviewDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        productId={productId}
        productName={productName}
        orderId={editingReview ? undefined : firstSlot?.orderId}
        orderItemId={editingReview ? undefined : firstSlot?.orderItemId}
        existingReview={editingReview}
        onSuccess={() => {}}
      />
    </article>
  );
}
