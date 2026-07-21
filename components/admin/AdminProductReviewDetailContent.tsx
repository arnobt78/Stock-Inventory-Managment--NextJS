"use client";

/**
 * REQ-0180 / REQ-0181 / REQ-0183 — admin product review detail (display-only).
 * Status+Rating | Comment; densified Purchase; opaque status badge; text-sm values.
 * REQ-0196 — single GlassCard body pad (no inner p-2 sm:p-4).
 */

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBackWithRefresh } from "@/hooks/use-back-with-refresh";
import { Button } from "@/components/ui/button";
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
import {
  ArrowLeft,
  Star,
  Package,
  CircleDot,
  User,
  Calendar,
  Tag,
  Truck,
  FileText,
  Pencil,
  Hash,
  Trash2,
  Wallet,
  CircleDollarSign,
  MessageSquare,
} from "lucide-react";
import { useProductReview, useDeleteProductReview } from "@/hooks/queries";
import {
  PageContentWrapper,
  DataSlotPulse,
  PageSectionHeader,
  SectionCardHeader,
  GLASS_GHOST_BUTTON,
  glassDetailBackButtonClass,
  glassDetailFooterButtonClass,
  DETAIL_HEADER_BACK_ICON_CLASS,
  DialogSubmitButton,
  ClientDateTime,
  CopyableText,
  PersonInlineRow,
  PersonNameEmailCell,
  TABLE_CATALOG_LINK_CLASS,
} from "@/components/shared";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import WriteEditReviewDialog from "@/components/product-reviews/WriteEditReviewDialog";
import {
  DETAIL_DATA_VALUE_CLASS,
  TYPO_BODY,
  TYPO_BODY_MUTED,
} from "@/lib/ui/typography-scale";
import {
  getRatingDisplay,
  truncateReviewComment,
} from "@/lib/ui/review-rating-display";
import { formatStableCurrency } from "@/lib/format";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import type { ProductReview } from "@/types";
import { cn } from "@/lib/utils";
import {
  InvoiceStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  ReviewStatusBadge,
} from "@/lib/ui/semantic-badges";
import { GlassCard, DetailInfoRow } from "@/components/orders/detail";
import {
  APP_SHELL_DETAIL_CLASS,
  DETAIL_PAGE_HEADER_SPACING_CLASS,
} from "@/lib/ui/shell-layout-styles";

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

  useSyncSsrQueryData(queryKeys.productReviews.detail(id), initialReview);

  const deleteMutation = useDeleteProductReview();
  const [editOpen, setEditOpen] = useState(false);

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
          <Button
            size="sm"
            onClick={handleBack}
            className={cn("gap-2", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product Reviews
          </Button>
          <GlassCard variant="rose">
            <p className="py-8 text-center text-gray-600 dark:text-white/80">
              {error instanceof Error ? error.message : "Review not found"}
            </p>
          </GlassCard>
        </div>
      </PageContentWrapper>
    );
  }

  if (!dataLoading && !review) {
    return (
      <PageContentWrapper>
        <div className="space-y-4">
          <Button
            size="sm"
            onClick={handleBack}
            className={cn("gap-2", GLASS_GHOST_BUTTON)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product Reviews
          </Button>
          <GlassCard variant="rose">
            <p className="py-8 text-center text-gray-600 dark:text-white/80">
              The review you are looking for does not exist or was removed.
            </p>
          </GlassCard>
        </div>
      </PageContentWrapper>
    );
  }

  const r = review as ProductReview | undefined;
  const isDeleting = deleteMutation.isPending;
  const actionsDisabled = dataLoading || !review;
  const ratingUi = r ? getRatingDisplay(r.rating) : null;
  const reviewerLabel =
    r?.reviewerName?.trim() || r?.reviewerEmail || "Reviewer";
  const deleteDescription = r
    ? truncateReviewComment(r.comment, 80)
      ? `This will permanently delete the review for "${r.productName}": ${truncateReviewComment(r.comment, 80)}`
      : `This will permanently delete the review for "${r.productName}". This action cannot be undone.`
    : "This will permanently delete this review. This action cannot be undone.";

  return (
    <PageContentWrapper>
      <div className={APP_SHELL_DETAIL_CLASS}>
        <PageSectionHeader
          as="h1"
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
          tone="amber"
          icon={Star}
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={DETAIL_HEADER_BACK_ICON_CLASS}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          }
          title="Product Review Details"
          description={
            dataLoading ? (
              <DataSlotPulse variant="text-sm" className="w-48" />
            ) : (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                <ProductThumb
                  name={r!.productName}
                  imageUrl={r!.productImageUrl}
                  size="sm"
                />
                <span>
                  {r!.productName}
                  {r!.productSku ? (
                    <span className={cn("ml-1", TYPO_BODY_MUTED)}>
                      ({r!.productSku})
                    </span>
                  ) : null}
                </span>
              </span>
            )
          }
        />

        {/* REQ-0183 — Status + Rating | Comment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 items-stretch">
          <GlassCard variant="amber">
            <div className="space-y-4">
              <SectionCardHeader
                title="Status & Rating"
                description="Moderation state and stars — edit via Edit Review"
                icon={CircleDot}
                tone="amber"
                className="mb-0"
              />
              <div className="space-y-3">
                {dataLoading ? (
                  <DataSlotPulse
                    variant="badge"
                    className="h-9 w-[140px] rounded-md"
                  />
                ) : (
                  <ReviewStatusBadge
                    status={r!.status}
                    size="detail"
                    contrast="opaque"
                  />
                )}
                <div className="flex items-center gap-1">
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
                              ? ratingUi!.starClass
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                      <span
                        className={cn(
                          "ml-2 text-sm font-medium capitalize",
                          ratingUi!.textClass,
                          TYPO_BODY,
                        )}
                      >
                        {r!.rating}/5 ({ratingUi!.label})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="amber">
            <div className="h-full flex flex-col">
              <SectionCardHeader
                title="Comment"
                description="Submitted review text"
                icon={MessageSquare}
                tone="amber"
                className="mb-4"
              />
              <p
                className={cn(
                  "text-sm whitespace-pre-wrap rounded-lg border border-border/50 bg-muted/30 p-4 flex-1",
                  DETAIL_DATA_VALUE_CLASS,
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
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 items-stretch">
          <GlassCard variant="sky">
<SectionCardHeader
                title="Product"
                description="Live catalog link"
                icon={Package}
                tone="sky"
                className="mb-4"
              />
              {dataLoading ? (
                <DataSlotPulse variant="text-md" className="w-full min-h-16" />
              ) : (
                <div className="flex gap-3 min-w-0">
                  <ProductThumb
                    name={r!.productName}
                    imageUrl={r!.productImageUrl}
                    size="md"
                  />
                  <div className="space-y-2 min-w-0 flex-1">
                    <DetailInfoRow
                      icon={Package}
                      label="Name:"
                      tone="sky"
                      valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                    >
                      <Link
                        href={`/admin/products/${r!.productId}`}
                        className={cn(TABLE_CATALOG_LINK_CLASS, "text-sm")}
                      >
                        <CopyableText value={r!.productName}>
                          {r!.productName}
                        </CopyableText>
                      </Link>
                    </DetailInfoRow>
                    {r!.productSku ? (
                      <DetailInfoRow
                        icon={Hash}
                        label="SKU:"
                        tone="violet"
                        valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                      >
                        <CopyableText
                          value={r!.productSku}
                          className="text-sm"
                        >
                          {r!.productSku}
                        </CopyableText>
                      </DetailInfoRow>
                    ) : null}
                    {r!.categoryId && r!.categoryName ? (
                      <DetailInfoRow
                        icon={Tag}
                        label="Category:"
                        tone="amber"
                        valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                      >
                        <Link
                          href={`/admin/categories/${r!.categoryId}`}
                          className={cn(TABLE_CATALOG_LINK_CLASS, "text-sm")}
                        >
                          {r!.categoryName}
                        </Link>
                      </DetailInfoRow>
                    ) : null}
                    {r!.supplierId && r!.supplierName ? (
                      <DetailInfoRow
                        icon={Truck}
                        label="Supplier:"
                        tone="emerald"
                        valueClassName="min-w-0"
                      >
                        {/* REQ-0191 gap — avatar centered beside name + email (PersonNameEmailCell) */}
                        <PersonNameEmailCell
                          seed={r!.supplierId}
                          image={r!.supplierImage}
                          name={r!.supplierName}
                          email={r!.supplierEmail}
                          href={`/admin/suppliers/${r!.supplierId}`}
                          avatarSize={24}
                          className="max-w-none"
                        />
                      </DetailInfoRow>
                    ) : null}
                    {/* REQ-0191 — Created | Updated same responsive row */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 [&>*]:flex-1 [&>*]:min-w-0">
                      <DetailInfoRow
                        icon={Calendar}
                        label="Created:"
                        tone="orange"
                        valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                      >
                        <ClientDateTime
                          date={new Date(r!.createdAt)}
                          semantic="created"
                        />
                      </DetailInfoRow>
                      {r!.updatedAt ? (
                        <DetailInfoRow
                          icon={Calendar}
                          label="Updated:"
                          tone="amber"
                          valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                        >
                          <ClientDateTime
                            date={new Date(r!.updatedAt)}
                            semantic="updated"
                          />
                        </DetailInfoRow>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
          </GlassCard>

          <GlassCard variant="violet">
<SectionCardHeader
                title="Reviewer"
                description="Account that submitted this review"
                icon={User}
                tone="violet"
                className="mb-4"
              />
              {dataLoading ? (
                <DataSlotPulse variant="text-md" className="w-full min-h-16" />
              ) : (
                <div className="space-y-2">
                  <DetailInfoRow
                    icon={User}
                    label="Reviewer:"
                    tone="violet"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    {/* REQ-0183 — name only; email in dedicated row below */}
                    <PersonInlineRow
                      seed={r!.userId}
                      name={reviewerLabel}
                      image={r!.reviewerImage}
                      href={`/admin/user-management/${r!.userId}`}
                      avatarSize={28}
                    />
                  </DetailInfoRow>
                  {r!.reviewerEmail ? (
                    <DetailInfoRow
                      icon={Hash}
                      label="Email:"
                      tone="sky"
                      valueClassName={cn("text-xs", TYPO_BODY_MUTED)}
                    >
                      <CopyableText
                        value={r!.reviewerEmail}
                        className="text-xs"
                      >
                        {r!.reviewerEmail}
                      </CopyableText>
                    </DetailInfoRow>
                  ) : null}
                  <DetailInfoRow
                    icon={Hash}
                    label="User ID:"
                    tone="violet"
                    valueClassName={cn("font-mono text-xs", TYPO_BODY_MUTED)}
                  >
                    <CopyableText
                      value={r!.userId}
                      className={cn("font-mono text-xs", TYPO_BODY_MUTED)}
                    >
                      {r!.userId}
                    </CopyableText>
                  </DetailInfoRow>
                </div>
              )}
          </GlassCard>
        </div>

        {!dataLoading && r?.orderId ? (
          <GlassCard variant="sky">
<SectionCardHeader
                title="Purchase"
                description="Related order and invoice for this review"
                icon={FileText}
                tone="sky"
                className="mb-4"
              />
              <div className="space-y-2">
                <DetailInfoRow
                  icon={Package}
                  label="Order:"
                  tone="sky"
                  valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                >
                  {r.orderNumber ? (
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className={cn(TABLE_CATALOG_LINK_CLASS, "text-sm")}
                    >
                      <CopyableText value={r.orderNumber}>
                        {r.orderNumber}
                      </CopyableText>
                    </Link>
                  ) : (
                    <span className={TYPO_BODY_MUTED}>—</span>
                  )}
                </DetailInfoRow>
                {r.orderStatus ? (
                  <DetailInfoRow
                    icon={CircleDot}
                    label="Order status:"
                    tone="amber"
                  >
                    <OrderStatusBadge status={r.orderStatus} size="detail" />
                  </DetailInfoRow>
                ) : null}
                {r.orderPaymentStatus ? (
                  <DetailInfoRow
                    icon={Wallet}
                    label="Payment:"
                    tone="emerald"
                  >
                    <PaymentStatusBadge
                      status={r.orderPaymentStatus}
                      size="detail"
                    />
                  </DetailInfoRow>
                ) : null}
                {r.orderTotal != null ? (
                  <DetailInfoRow
                    icon={CircleDollarSign}
                    label="Order total:"
                    tone="emerald"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    {formatStableCurrency(r.orderTotal)}
                  </DetailInfoRow>
                ) : null}
                {r.orderCreatedAt ? (
                  <DetailInfoRow
                    icon={Calendar}
                    label="Order date:"
                    tone="orange"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    <ClientDateTime
                      date={new Date(r.orderCreatedAt)}
                      semantic="created"
                    />
                  </DetailInfoRow>
                ) : null}
                {r.invoiceId && r.invoiceNumber ? (
                  <DetailInfoRow
                    icon={FileText}
                    label="Invoice:"
                    tone="violet"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    <Link
                      href={`/admin/invoices/${r.invoiceId}`}
                      className={cn(TABLE_CATALOG_LINK_CLASS, "text-sm")}
                    >
                      <CopyableText value={r.invoiceNumber}>
                        {r.invoiceNumber}
                      </CopyableText>
                    </Link>
                  </DetailInfoRow>
                ) : null}
                {r.invoiceStatus ? (
                  <DetailInfoRow
                    icon={FileText}
                    label="Invoice status:"
                    tone="violet"
                  >
                    <InvoiceStatusBadge
                      status={r.invoiceStatus}
                      size="detail"
                      contrast="opaque"
                    />
                  </DetailInfoRow>
                ) : null}
                {r.invoiceTotal != null ? (
                  <DetailInfoRow
                    icon={CircleDollarSign}
                    label="Invoice total:"
                    tone="violet"
                    valueClassName={cn("text-sm", DETAIL_DATA_VALUE_CLASS)}
                  >
                    {formatStableCurrency(r.invoiceTotal)}
                  </DetailInfoRow>
                ) : null}
              </div>
          </GlassCard>
        ) : null}

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button
            onClick={handleBack}
            className={glassDetailBackButtonClass(
              "w-full sm:w-auto gap-2 px-8",
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={actionsDisabled}
            className={glassDetailFooterButtonClass(
              "amber",
              "w-full sm:w-auto gap-2 px-8",
            )}
          >
            <Pencil className="h-4 w-4 shrink-0" />
            Edit Review
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DialogSubmitButton
                type="button"
                isPending={isDeleting}
                pendingLabel="Deleting…"
                label="Delete Review"
                icon={Trash2}
                hue="rose"
                disabled={actionsDisabled}
                className="w-full sm:w-auto gap-2 px-8"
              />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product review?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteDescription}
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

        {r ? (
          <WriteEditReviewDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            productId={r.productId}
            productName={r.productName}
            productSku={r.productSku}
            existingReview={r}
            allowStatusEdit
          />
        ) : null}
      </div>
    </PageContentWrapper>
  );
}
