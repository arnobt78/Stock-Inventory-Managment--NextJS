"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Loader2 } from "lucide-react";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_AMBER,
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_GHOST_BUTTON,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { useCreateProductReview, useProducts } from "@/hooks/queries";

const RATINGS = [1, 2, 3, 4, 5] as const;

interface ProductReviewDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function ProductReviewDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ProductReviewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const createMutation = useCreateProductReview();
  const { data: products = [] } = useProducts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId.trim() || !comment.trim()) return;
    createMutation.mutate(
      { productId, rating, comment: comment.trim() },
      {
        onSuccess: () => {
          setProductId("");
          setRating(5);
          setComment("");
          setOpen(false);
        },
      },
    );
  };

  const isPending = createMutation.isPending;

  // Render star icons for visual rating display
  const renderStars = (count: number) => {
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < count
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-400/50"
            }`}
          />
        ))}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto border-amber-400/30 dark:border-amber-400/30 shadow-[0_30px_80px_rgba(245,158,11,0.35)] dark:shadow-[0_30px_80px_rgba(245,158,11,0.25)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-[22px] text-white flex items-center gap-2">
            <div className="p-2 rounded-xl border border-amber-300/30 bg-amber-100/50 dark:border-amber-400/30 dark:bg-amber-500/20">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-amber-500/50" />
            </div>
            Add Product Review
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Add a review for a product. Select product, rating (1–5), and
            comment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label
              htmlFor="product-review-product"
              className="text-sm font-medium text-white/80"
            >
              Product *
            </Label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-amber-400/30 bg-white/10 px-2 text-sm text-white/60"
                  aria-hidden
                >
                  {products.find((p) => p.id === productId)?.name ??
                    "Select product to review"}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={productId}
                  onValueChange={setProductId}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="product-review-product"
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_AMBER)}
                  >
                    <SelectValue placeholder="Select product to review" />
                  </SelectTrigger>
                  <SelectContent
                    className="border-amber-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100] max-h-[200px]"
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {products.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="cursor-pointer text-gray-700 dark:text-white focus:bg-amber-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                      >
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="product-review-rating"
              className="text-sm font-medium text-white/80"
            >
              Rating
            </Label>
            <DeferredSelectGate
              enabled={open}
              placeholder={
                <div
                  className="flex h-11 w-full items-center rounded-md border border-amber-400/30 bg-white/10 px-2 text-sm text-white/60"
                  aria-hidden
                >
                  {rating} star{rating !== 1 ? "s" : ""}
                </div>
              }
            >
              {({ selectRemountKey }) => (
                <Select
                  key={selectRemountKey}
                  value={String(rating)}
                  onValueChange={(v) => setRating(Number(v))}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="product-review-rating"
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_AMBER)}
                  >
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        {renderStars(rating)}
                        <span className="text-white/60 text-sm">
                          ({rating} star{rating !== 1 ? "s" : ""})
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className="border-amber-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {RATINGS.map((r) => (
                      <SelectItem
                        key={r}
                        value={String(r)}
                        className="cursor-pointer focus:bg-amber-100 dark:focus:bg-white/10"
                      >
                        <span className="flex items-center gap-2">
                          {renderStars(r)}
                          <span className="text-gray-600 dark:text-white/60 text-sm">
                            ({r} star{r !== 1 ? "s" : ""})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </DeferredSelectGate>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="product-review-comment"
              className="text-sm font-medium text-white/80"
            >
              Review Comment *
            </Label>
            <Textarea
              id="product-review-comment"
              placeholder="Write your review about the product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
              className={cn(
                "min-h-[120px] resize-none",
                DIALOG_FORM_FIELD_AMBER,
              )}
              maxLength={2000}
            />
            <p className="text-xs text-white/50 text-right">
              {comment.length}/2000
            </p>
          </div>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className={cn("h-11 w-full sm:w-auto px-8", GLASS_GHOST_BUTTON)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="ghost"
              disabled={isPending || !productId.trim() || !comment.trim()}
              className={cn(
                GLASS_BUTTON_ICON_HOVER,
                GLASS_BUTTON_SHELL_RESET,
                GLASS_BUTTON_DISABLED,
                "h-11 w-full sm:w-auto px-8",
                GLASS_PRIMARY_BUTTON.amber,
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
