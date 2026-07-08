"use client";

import React from "react";
import OrderList from "@/components/orders/OrderList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { OrderForPage } from "@/lib/server/orders-data";

export type AdminOrdersContentProps = {
  initialOrders?: OrderForPage[];
  /** Base path for order detail links (e.g. /admin/orders or /admin/personal-orders). Default /admin/orders */
  detailHrefBase?: string;
};

/**
 * Admin orders section — same content as /orders but inside admin layout (no Navbar).
 */
export default function AdminOrdersContent({
  initialOrders,
  detailHrefBase = "/admin/orders",
}: AdminOrdersContentProps = {}) {
  return (
    <PageContentWrapper>
      <OrderList
        detailHrefBase={detailHrefBase}
        initialOrders={initialOrders}
      />
      <FloatingActionButtons variant="orders" />
    </PageContentWrapper>
  );
}
