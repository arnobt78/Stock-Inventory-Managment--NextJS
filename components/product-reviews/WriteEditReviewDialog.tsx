"use client";

/**
 * REQ-0165 / REQ-0167 / REQ-0181 / REQ-0183 / REQ-0184 — Write/Edit review dialog.
 * Admin: allowStatusEdit + solid/opaque Status badges (REQ-0183).
 * REQ-0184 — edit stacks like create (Status → Rating → Comment, w-full); no 2-col grid.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CircleDot,
  Hash,
  MessageSquare,
  Package,
  Star,
  X,
} from "lucide-react";
import { DIALOG_FORM_FIELD_AMBER } from "@/components/shared/dialog-form-field";
import {
  DeferredSelectGate,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
} from "@/components/shared";
import { getRatingDisplay } from "@/lib/ui/review-rating-display";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";
import { cn } from "@/lib/utils";
import {
  useCreateProductReview,
  useUpdateProductReview,
} from "@/hooks/queries";
import type { ProductReview, ProductReviewStatus } from "@/types";

const STATUS_OPTIONS: { value: ProductReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

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
  /**
   * REQ-0181 — when true (admin/product-owner moderation), show Status Select
   * and include status in PUT. Client/author edit must leave this false.
   */
  allowStatusEdit?: boolean;
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
  allowStatusEdit = false,
  onSuccess,
}: WriteEditReviewDialogProps) {
  const isEdit = !!existingReview;
  const showStatus = isEdit && allowStatusEdit;
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [status, setStatus] = useState<ProductReviewStatus>(
    existingReview?.status ?? "pending",
  );

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setRating(existingReview?.rating ?? 5);
        setComment(existingReview?.comment ?? "");
        setStatus(existingReview?.status ?? "pending");
      });
    }
  }, [
    open,
    existingReview?.rating,
    existingReview?.comment,
    existingReview?.status,
  ]);

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
        {
          id: existingReview.id,
          data: {
            rating,
            comment: comment.trim(),
            ...(showStatus ? { status } : {}),
          },
        },
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
          comment: comment.trim(),
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

  const description = showStatus
    ? "Update status, rating, and comment"
    : isEdit
      ? "Update your rating and comment"
      : "Share your experience";

  const statusSelect = showStatus ? (
    <div className="space-y-2">
      <DialogFormLabel htmlFor="review-status" icon={CircleDot} required>
        Status
      </DialogFormLabel>
      <DeferredSelectGate
        enabled={open}
        placeholder={
          <div
            className="flex h-11 w-full min-w-0 items-center rounded-md border border-amber-400/30 bg-white/10 px-2 text-sm text-white/60"
            aria-hidden
          >
            {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
          </div>
        }
      >
        {({ selectRemountKey }) => (
          <Select
            key={selectRemountKey}
            value={status}
            onValueChange={(v) => setStatus(v as ProductReviewStatus)}
            disabled={isPending}
          >
            <SelectTrigger
              id="review-status"
              className={cn("h-11 w-full min-w-0", DIALOG_FORM_FIELD_AMBER)}
            >
              <SelectValue>
                <ReviewStatusBadge
                  status={status}
                  label={
                    STATUS_OPTIONS.find((o) => o.value === status)?.label
                  }
                  size="detail"
                  contrast="solid"
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
              position="popper"
              sideOffset={5}
              align="start"
            >
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={DIALOG_SELECT_ITEM_CLASS}
                >
                  <ReviewStatusBadge
                    status={opt.value}
                    label={opt.label}
                    size="detail"
                    contrast="opaque"
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </DeferredSelectGate>
    </div>
  ) : null;

  const ratingBlock = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <DialogFormLabel icon={Star} required>
          Rating
        </DialogFormLabel>
        <span
          className={cn(
            "text-xs font-medium tabular-nums capitalize",
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
  );

  const commentBlock = (
    <div className="space-y-2">
      <DialogFormLabel htmlFor="review-comment" icon={MessageSquare} required>
        Comment
      </DialogFormLabel>
      <Textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isPending}
        placeholder="Share your experience..."
        className={cn(
          "min-h-[120px] w-full rounded-xl mt-1",
          DIALOG_FORM_FIELD_AMBER,
        )}
      />
    </div>
  );

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
          description={description}
        />
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
        {/* REQ-0184 — stack Status → Rating → Comment (w-full); same create/edit */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {statusSelect}
          {ratingBlock}
          {commentBlock}
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
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
