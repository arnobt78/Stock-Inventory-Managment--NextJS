"use client";

/**
 * REQ-0182 — Product review table Actions (MoreVertical).
 * View Details · Edit Review (dialog + allowStatusEdit) · Delete (confirm).
 * Invalidation/toasts via useDeleteProductReview / WriteEditReviewDialog update hook.
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialogWrapper } from "@/components/dialogs";
import WriteEditReviewDialog from "@/components/product-reviews/WriteEditReviewDialog";
import { useDeleteProductReview } from "@/hooks/queries";
import { truncateReviewComment } from "@/lib/ui/review-rating-display";
import { logger } from "@/lib/logger";
import { MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import type { ProductReview } from "@/types";

export type ProductReviewActionsProps = {
  review: ProductReview;
  /** Base path for detail (e.g. /admin/product-reviews) */
  detailHrefBase?: string;
};

export default function ProductReviewActions({
  review,
  detailHrefBase = "/admin/product-reviews",
}: ProductReviewActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteProductReview();
  const isDeleting = deleteMutation.isPending;
  const detailHref = `${detailHrefBase}/${review.id}`;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(review.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error("Error deleting product review:", error);
    }
  };

  const commentPreview = truncateReviewComment(review.comment, 80);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/5 backdrop-blur-md shadow-lg"
        >
          <DropdownMenuItem asChild>
            <Link href={detailHref} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Review
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Review"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WriteEditReviewDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        productId={review.productId}
        productName={review.productName}
        productSku={review.productSku}
        existingReview={review}
        allowStatusEdit
      />

      <AlertDialogWrapper
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete product review?"
        description={
          commentPreview
            ? `This will permanently delete the review for "${review.productName}": ${commentPreview}`
            : `This will permanently delete the review for "${review.productName}". This action cannot be undone.`
        }
        actionLabel="Delete"
        actionLoadingLabel="Deleting..."
        isLoading={isDeleting}
        onAction={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        actionVariant="destructive"
      />
    </>
  );
}
