"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { DIALOG_FORM_FIELD_AMBER } from "@/components/shared/dialog-form-field";
import {
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
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
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white flex items-center gap-2">
            <div className="p-2 rounded-xl border border-amber-300/30 bg-amber-100/50 dark:border-amber-400/30 dark:bg-amber-500/20">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            {isEdit ? "Edit review" : "Write a review"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Product: {productName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium text-white/80">Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  className={cn(
                    "p-1 rounded-lg transition-colors",
                    rating >= v
                      ? "text-amber-400 hover:text-amber-300"
                      : "text-white/50 hover:text-amber-400",
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
          <div>
            <Label
              htmlFor="review-comment"
              className="text-sm font-medium text-white/80"
            >
              Comment *
            </Label>
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-11 rounded-xl border border-white/20 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="ghost"
              disabled={isPending || !comment.trim()}
              className={cn(
                GLASS_BUTTON_ICON_HOVER,
                GLASS_BUTTON_SHELL_RESET,
                GLASS_BUTTON_DISABLED,
                "h-11 rounded-xl",
                GLASS_PRIMARY_BUTTON.amber,
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                "Save"
              ) : (
                "Submit review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
