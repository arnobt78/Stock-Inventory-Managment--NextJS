"use client";

import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Star, Package, Trash2, CircleDot } from "lucide-react";
import {
  useProductReview,
  useUpdateProductReview,
  useDeleteProductReview,
} from "@/hooks/queries";
import {
  DeferredSelectGate,
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { TYPO_BODY, TYPO_BODY_MUTED } from "@/lib/ui/typography-scale";
import { isDataSlotLoading } from "@/lib/react-query";
import { format } from "date-fns";
import type { ProductReview, ProductReviewStatus } from "@/types";
import { cn } from "@/lib/utils";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";

const STATUS_OPTIONS: { value: ProductReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

export type AdminProductReviewDetailContentProps = {
  initialReview?: ProductReview;
};

export default function AdminProductReviewDetailContent({
  initialReview,
}: AdminProductReviewDetailContentProps = {}) {
  const params = useParams();
  const { navigateTo, handleBack } = useBackWithRefresh("product-review");
  const id = params?.id as string;
  const reviewQuery = useProductReview(id, initialReview);
  const review = reviewQuery.data;
  const dataLoading = isDataSlotLoading(reviewQuery, initialReview);
  const { isError, error } = reviewQuery;
  const updateMutation = useUpdateProductReview();
  const deleteMutation = useDeleteProductReview();

  const [comment, setComment] = useState("");
  const [commentTouched, setCommentTouched] = useState(false);

  useEffect(() => {
    if (!review || commentTouched) return;
    queueMicrotask(() => setComment((review as ProductReview).comment ?? ""));
  }, [review, commentTouched]);

  const handleStatusChange = useCallback(
    (newStatus: ProductReviewStatus) => {
      if (!id || newStatus === review?.status) return;
      updateMutation.mutate({ id, data: { status: newStatus } });
    },
    [id, review?.status, updateMutation],
  );

  const handleRatingChange = useCallback(
    (newRating: number) => {
      if (!id || newRating === review?.rating) return;
      updateMutation.mutate({ id, data: { rating: newRating } });
    },
    [id, review?.rating, updateMutation],
  );

  const handleSaveComment = useCallback(() => {
    if (!id) return;
    updateMutation.mutate(
      { id, data: { comment: comment.trim() } },
      {
        onSuccess: () => {
          setCommentTouched(false);
        },
      },
    );
  }, [id, comment, updateMutation]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigateTo("/admin/product-reviews");
      },
    });
  }, [id, deleteMutation, navigateTo]);

  if (isError) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Product Reviews
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Review not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !review) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Product Reviews
          </Button>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                The review you are looking for does not exist or was removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    );
  }

  const r = review as ProductReview | undefined;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const commentValue = commentTouched ? comment : (r?.comment ?? "");
  const actionsDisabled = dataLoading || !review;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <PageSectionHeader
          as="h1"
          tone="amber"
          icon={Star}
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 shrink-0 self-center rounded-xl border border-gray-300/30 bg-white/50 dark:bg-white/5 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          title="Product Review Details"
          description={
            dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-48" />
            ) : (
              <>
                {r!.productName}
                {r!.productSku ? ` (${r!.productSku})` : ""}
              </>
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-5">
              <SectionCardHeader
                title="Status"
                description="Changes apply immediately"
                icon={CircleDot}
                tone="amber"
                className="mb-4"
              />
              <div className="flex flex-wrap items-center gap-2">
                {dataLoading ? (
                  <DataSlotPulse
                    variant="badge"
                    className="h-9 w-[140px] rounded-md"
                  />
                ) : (
                  <>
                    <ReviewStatusBadge status={r!.status} size="detail" />
                    <DeferredSelectGate
                      placeholder={
                        <div
                          className="w-[140px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                          aria-hidden
                        >
                          {STATUS_OPTIONS.find((o) => o.value === r!.status)
                            ?.label ?? r!.status}
                        </div>
                      }
                    >
                      {({ selectRemountKey }) => (
                        <Select
                          key={selectRemountKey}
                          value={r!.status}
                          onValueChange={(v) =>
                            handleStatusChange(v as ProductReviewStatus)
                          }
                          disabled={isUpdating || actionsDisabled}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <ReviewStatusBadge
                                  status={opt.value}
                                  label={opt.label}
                                  size="detail"
                                />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </DeferredSelectGate>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5">
              <SectionCardHeader
                title="Rating"
                description="Changes apply immediately"
                icon={Star}
                tone="amber"
                className="mb-4"
              />
              {dataLoading ? (
                <DataSlotPulse
                  variant="badge"
                  className="h-9 w-[120px] rounded-md"
                />
              ) : (
                <DeferredSelectGate
                  placeholder={
                    <div
                      className="w-[120px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                      aria-hidden
                    >
                      {r!.rating} star{r!.rating !== 1 ? "s" : ""}
                    </div>
                  }
                >
                  {({ selectRemountKey }) => (
                    <Select
                      key={selectRemountKey}
                      value={String(r!.rating)}
                      onValueChange={(v) => handleRatingChange(Number(v))}
                      disabled={isUpdating || actionsDisabled}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RATINGS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} star{n !== 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <SectionCardHeader
                  title="Product & Reviewer"
                  description="Linked product and reviewer account"
                  icon={Package}
                  tone="sky"
                  className="mb-4"
                />
                <dl className={cn("space-y-2 text-sm", TYPO_BODY)}>
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Product</dt>
                    <dd>
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-40" />
                      ) : (
                        <>
                          <Link
                            href={`/admin/products/${r!.productId}`}
                            className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                          >
                            {r!.productName}
                          </Link>
                          {r!.productSku ? (
                            <span className={cn("ml-1", TYPO_BODY_MUTED)}>
                              ({r!.productSku})
                            </span>
                          ) : null}
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Reviewer</dt>
                    <dd className="space-y-0.5">
                      {dataLoading ? (
                        <DataSlotPulse variant="text-md" className="w-36" />
                      ) : (
                        <>
                          <Link
                            href={`/admin/user-management/${r!.userId}`}
                            className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                          >
                            {r!.reviewerName?.trim() ||
                              r!.reviewerEmail ||
                              "View user"}
                          </Link>
                          {r!.reviewerEmail && (
                            <span className={cn("block text-xs", TYPO_BODY_MUTED)}>
                              {r!.reviewerEmail}
                            </span>
                          )}
                          <span
                            className={cn(
                              "block font-mono text-xs break-all",
                              TYPO_BODY_MUTED,
                            )}
                          >
                            {r!.userId}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className={TYPO_BODY_MUTED}>Created</dt>
                    <dd>
                      {dataLoading ? (
                        <DataSlotPulse variant="date" />
                      ) : (
                        format(
                          new Date(r!.createdAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )
                      )}
                    </dd>
                  </div>
                  {!dataLoading && r!.updatedAt && (
                    <div>
                      <dt className={TYPO_BODY_MUTED}>Updated</dt>
                      <dd>
                        {format(
                          new Date(r!.updatedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <SectionCardHeader
                  title="Rating & Comment"
                  description="Submitted review content"
                  icon={Star}
                  tone="amber"
                  className="mb-4"
                />
                <div className="flex items-center gap-1 mb-3">
                  {dataLoading ? (
                    <DataSlotPulse variant="text-md" className="w-32" />
                  ) : (
                    <>
                      {RATINGS.map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "h-6 w-6",
                            n <= r!.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                      <span className={cn("ml-2 text-sm font-medium", TYPO_BODY)}>
                        {r!.rating}/5
                      </span>
                    </>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4",
                    TYPO_BODY_MUTED,
                  )}
                >
                  {dataLoading ? (
                    <DataSlotPulse
                      variant="text-md"
                      className="w-full min-h-[4rem]"
                    />
                  ) : (
                    r!.comment
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 space-y-2">
            <SectionCardHeader
              title="Edit Comment"
              description="Update the review comment. Changes apply after Save."
              icon={Star}
              tone="neutral"
              className="mb-2"
            />
            <Textarea
              placeholder="Review comment..."
              value={commentValue}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentTouched(true);
              }}
              disabled={isUpdating || actionsDisabled}
              className="min-h-[100px] rounded-2xl resize-none"
              maxLength={2000}
            />
            {commentTouched && (
              <Button
                size="sm"
                onClick={handleSaveComment}
                disabled={isUpdating || actionsDisabled}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Comment
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className={cn("w-full sm:w-auto gap-2 px-8", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={isDeleting || actionsDisabled}
                className={cn(
                  "w-full sm:w-auto gap-2 px-8",
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_PRIMARY_BUTTON.rose,
                )}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {isDeleting ? "Deleting..." : "Delete Review"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product review?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this review. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting || actionsDisabled}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </PageContentWrapper>
  );
}
