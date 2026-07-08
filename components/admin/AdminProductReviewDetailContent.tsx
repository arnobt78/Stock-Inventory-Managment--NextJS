"use client";

import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Loader2, Star, Package, Trash2 } from "lucide-react";
import {
  useProductReview,
  useUpdateProductReview,
  useDeleteProductReview,
} from "@/hooks/queries";
import { DeferredSelectGate, PageContentWrapper } from "@/components/shared";
import { format } from "date-fns";
import type { ProductReview, ProductReviewStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ProductReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const RATINGS = [1, 2, 3, 4, 5] as const;

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export default function AdminProductReviewDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: review, isLoading, isError, error } = useProductReview(id);
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
        router.push("/admin/product-reviews");
      },
    });
  }, [id, deleteMutation, router]);

  if (isError || (!isLoading && !review)) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/product-reviews" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Product Reviews
            </Link>
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

  if (isLoading || !review) {
    return (
      <PageContentWrapper>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContentWrapper>
    );
  }

  const r = review as ProductReview;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const commentValue = commentTouched ? comment : r.comment;

  return (
    <PageContentWrapper>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/product-reviews" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              Product Review Details
            </h1>
            <p className="text-sm text-muted-foreground">
              {r.productName}
              {r.productSku ? ` (${r.productSku})` : ""}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product &amp; Reviewer
                </h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Product</dt>
                    <dd>
                      <Link
                        href={`/admin/products/${r.productId}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {r.productName}
                      </Link>
                      {r.productSku ? (
                        <span className="text-muted-foreground ml-1">
                          ({r.productSku})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Reviewer</dt>
                    <dd className="space-y-0.5">
                      <Link
                        href={`/admin/user-management/${r.userId}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                      >
                        {r.reviewerName?.trim() ||
                          r.reviewerEmail ||
                          "View user"}
                      </Link>
                      {r.reviewerEmail && (
                        <span className="block text-muted-foreground text-xs">
                          {r.reviewerEmail}
                        </span>
                      )}
                      <span className="block font-mono text-xs text-muted-foreground break-all">
                        {r.userId}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>
                      {format(
                        new Date(r.createdAt),
                        "MMMM d, yyyy 'at' h:mm a",
                      )}
                    </dd>
                  </div>
                  {r.updatedAt && (
                    <div>
                      <dt className="text-muted-foreground">Updated</dt>
                      <dd>
                        {format(
                          new Date(r.updatedAt),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <DeferredSelectGate
                        placeholder={
                          <div
                            className="w-[140px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                            aria-hidden
                          >
                            {STATUS_OPTIONS.find((o) => o.value === r.status)
                              ?.label ?? r.status}
                          </div>
                        }
                      >
                        {({ selectRemountKey }) => (
                          <Select
                            key={selectRemountKey}
                            value={r.status}
                            onValueChange={(v) =>
                              handleStatusChange(v as ProductReviewStatus)
                            }
                            disabled={isUpdating}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-[140px]",
                                getStatusVariant(r.status) === "destructive" &&
                                  "border-destructive text-destructive",
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </DeferredSelectGate>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rating</dt>
                    <dd className="mt-1">
                      <DeferredSelectGate
                        placeholder={
                          <div
                            className="w-[120px] h-9 rounded-md border border-border flex items-center px-2 text-sm"
                            aria-hidden
                          >
                            {r.rating} star{r.rating !== 1 ? "s" : ""}
                          </div>
                        }
                      >
                        {({ selectRemountKey }) => (
                          <Select
                            key={selectRemountKey}
                            value={String(r.rating)}
                            onValueChange={(v) => handleRatingChange(Number(v))}
                            disabled={isUpdating}
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
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Rating &amp; Comment
                </h2>
                <div className="flex items-center gap-1 mb-3">
                  {RATINGS.map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "h-6 w-6",
                        n <= r.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">{r.rating}/5</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4">
                  {r.comment}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Comment</CardTitle>
            <CardDescription>
              Update the review comment. Changes apply after Save.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Review comment..."
              value={commentValue}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentTouched(true);
              }}
              disabled={isUpdating}
              className="min-h-[100px] rounded-2xl resize-none"
              maxLength={2000}
            />
            {commentTouched && (
              <Button
                size="sm"
                onClick={handleSaveComment}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Comment
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this product review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
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
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </PageContentWrapper>
  );
}
