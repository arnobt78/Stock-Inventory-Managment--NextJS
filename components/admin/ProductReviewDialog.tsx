"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Star, X } from "lucide-react";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_AMBER,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  DialogFormLabel,
  DialogHeaderBrand,
  DialogSubmitButton,
  GLASS_GHOST_BUTTON,
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

  const renderStars = (count: number) => {
    return (
      <span className="flex items-center ">
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
        <DialogHeaderBrand
          icon={Star}
          tone="amber"
          title="Add Product Review"
          description="Add a review for a product. Select product, rating (1–5), and comment."
        />
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <DialogFormLabel
              htmlFor="product-review-product"
              icon={Package}
              required
            >
              Product
            </DialogFormLabel>
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
                    className={cn(
                      DIALOG_SELECT_CONTENT_CLASS,
                      "z-[100] max-h-[200px]",
                    )}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {products.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className={DIALOG_SELECT_ITEM_CLASS}
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
            <DialogFormLabel
              htmlFor="product-review-rating"
              icon={Star}
              required
            >
              Rating
            </DialogFormLabel>
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
                        <span className="text-muted-foreground text-sm">
                          ({rating} star{rating !== 1 ? "s" : ""})
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    className={cn(DIALOG_SELECT_CONTENT_CLASS, "z-[100]")}
                    position="popper"
                    sideOffset={5}
                    align="start"
                  >
                    {RATINGS.map((r) => (
                      <SelectItem
                        key={r}
                        value={String(r)}
                        className={DIALOG_SELECT_ITEM_CLASS}
                      >
                        <span className="flex items-center gap-2">
                          {renderStars(r)}
                          <span className="text-muted-foreground text-sm">
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
            <DialogFormLabel
              htmlFor="product-review-comment"
              icon={Star}
              required
            >
              Review Comment
            </DialogFormLabel>
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
                className={cn(
                  "h-11 w-full sm:w-auto px-8 gap-2",
                  GLASS_GHOST_BUTTON,
                )}
                disabled={isPending}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancel
              </Button>
            </DialogClose>
            <DialogSubmitButton
              isPending={isPending}
              pendingLabel="Adding review…"
              label="Add Review"
              icon={Star}
              hue="amber"
              disabled={!productId.trim() || !comment.trim()}
              className="h-11 px-8"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
