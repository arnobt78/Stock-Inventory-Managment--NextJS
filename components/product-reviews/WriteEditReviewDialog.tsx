"use client";

/**
 * REQ-0165 / REQ-0167 — Write/Edit review dialog.
 * DialogHeaderBrand, FormLabels + icons, Cancel secondary+GLASS_GHOST (OrderDialog),
 * dialogTextClass for readable rating on always-dark shell.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Hash, MessageSquare, Package, Star, X } from "lucide-react";
import { DIALOG_FORM_FIELD_AMBER } from "@/components/shared/dialog-form-field";
import {
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { getRatingDisplay } from "@/lib/ui/review-rating-display";
import { cn } from "@/lib/utils";
import {
  useCreateProductReview,
  useUpdateProductReview,
} from "@/hooks/queries";
import type { ProductReview } from "@/types";

export type WriteEditReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  /** Optional SKU shown in header subtitle */
  productSku?: string | null;
  /** For create: first eligible slot to use */
  orderId?: string;
  orderItemId?: string;
  /** For edit: existing review to update */
  existingReview?: ProductReview | null;
  onSuccess?: () => void;
};

export default function WriteEditReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
  productSku,
  orderId,
  orderItemId,
  existingReview,
  onSuccess,
}: WriteEditReviewDialogProps) {
  const isEdit = !!existingReview;
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setRating(existingReview?.rating ?? 5);
        setComment(existingReview?.comment ?? "");
      });
    }
  }, [open, existingReview?.rating, existingReview?.comment]);

  const createMutation = useCreateProductReview();
  const updateMutation = useUpdateProductReview();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const ratingDisplay = getRatingDisplay(rating);
  const sku = productSku ?? existingReview?.productSku ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (isEdit && existingReview) {
      updateMutation.mutate(
        { id: existingReview.id, data: { rating, comment } },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          productId,
          rating,
          comment,
          orderId,
          orderItemId,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto",
          "bg-gradient-to-br from-slate-800/98 to-slate-900/98 dark:from-slate-800/98 dark:to-slate-900/98",
          "border-amber-400/30 dark:border-amber-400/30",
          "shadow-[0_25px_60px_rgba(245,158,11,0.25)] dark:shadow-[0_25px_60px_rgba(245,158,11,0.2)]",
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const first = document.getElementById("review-comment");
          if (first && first instanceof HTMLElement) first.focus();
        }}
      >
        <DialogHeaderBrand
          icon={Star}
          tone="amber"
          title={isEdit ? "Edit review" : "Write a review"}
          description={
            isEdit
              ? "Update your rating and comment"
              : "Share your experience"
          }
        />
        {/* REQ-0167 — product meta with icons (description is action-only) */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Package className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
            <span className="truncate">{productName}</span>
          </span>
          {sku ? (
            <span className="inline-flex items-center gap-1 text-white/50">
              <Hash className="h-3 w-3 shrink-0" />
              <span className="font-mono text-xs">{sku}</span>
            </span>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <DialogFormLabel icon={Star} required>
                Rating
              </DialogFormLabel>
              <span
                className={cn(
                  "text-xs font-normal tabular-nums",
                  ratingDisplay.dialogTextClass,
                )}
              >
                {rating}/5 · {ratingDisplay.label}
              </span>
            </div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  aria-label={`${v} star${v === 1 ? "" : "s"}`}
                  className={cn(
                    "p-1 rounded-lg transition-colors",
                    rating >= v
                      ? ratingDisplay.starClass
                      : "text-white/40 hover:text-amber-400",
                  )}
                >
                  <Star
                    className="h-7 w-7"
                    fill={rating >= v ? "currentColor" : "none"}
                    stroke="currentColor"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="review-comment"
              icon={MessageSquare}
              required
            >
              Comment
            </DialogFormLabel>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
              placeholder="Share your experience..."
              className={cn(
                "min-h-[100px] rounded-xl mt-1",
                DIALOG_FORM_FIELD_AMBER,
              )}
            />
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            {/* REQ-0167 — same Cancel as OrderDialog (secondary + glass ghost) */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className={cn(
                "h-11 rounded-xl gap-2",
                GLASS_GHOST_BUTTON,
                GLASS_BUTTON_SHELL_RESET,
              )}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Cancel
            </Button>
            <DialogSubmitButton
              isPending={isPending}
              pendingLabel={isEdit ? "Saving review…" : "Submitting review…"}
              label={isEdit ? "Save" : "Submit review"}
              hue="amber"
              icon={Star}
              disabled={!comment.trim()}
              className="h-11 rounded-xl"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
