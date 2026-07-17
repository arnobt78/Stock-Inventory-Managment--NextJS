"use client";

/**
 * REQ-0148 — header Back matches ProductDetailPage: variant="ghost" + DETAIL_HEADER_BACK_ICON_CLASS.
 * Default Button variant paints bg-primary (red) over the light glass token.
 */

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ClientRelativeTime,
  CopyableText,
  DataSlotPulse,
  PageSectionHeader,
  DETAIL_HEADER_BACK_ICON_CLASS,
} from "@/components/shared";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";

export type OrderDetailHeaderProps = {
  orderNumber?: string;
  createdAt: Date;
  dataLoading: boolean;
  backHref?: string;
  onBack?: () => void;
};

export function OrderDetailHeader({
  orderNumber,
  createdAt,
  dataLoading,
  backHref,
  onBack,
}: OrderDetailHeaderProps) {
  const backButton = backHref ? (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={DETAIL_HEADER_BACK_ICON_CLASS}
    >
      <Link href={backHref}>
        <ArrowLeft className="h-5 w-5" />
      </Link>
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      onClick={onBack}
      className={DETAIL_HEADER_BACK_ICON_CLASS}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );

  return (
    <PageSectionHeader
      as="h1"
      className={DETAIL_PAGE_HEADER_SPACING_CLASS}
      leading={backButton}
      icon={ShoppingCart}
      tone="sky"
      title={
        <>
          Order{" "}
          {dataLoading ? (
            <DataSlotPulse
              variant="text-lg"
              className="inline-block w-32 align-middle"
            />
          ) : orderNumber ? (
            <CopyableText value={orderNumber} className="align-middle">
              {orderNumber}
            </CopyableText>
          ) : null}
        </>
      }
      description={
        dataLoading ? (
          <DataSlotPulse variant="date" />
        ) : (
          <ClientRelativeTime
            date={createdAt}
            prefix="Created "
            semantic="created"
          />
        )
      }
    />
  );
}
