"use client";

import React from "react";
import OrderList from "@/components/orders/OrderList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { OrderForPage } from "@/lib/server/orders-data";

export type AdminCombinedOrdersContentProps = {
  initialOrders?: OrderForPage[];
};

/**
 * Admin combined Orders — personal + client orders with Order type filter.
 * Single Orders page under My Store; detail links go to /admin/orders/[id].
 */
export default function AdminCombinedOrdersContent({
  initialOrders,
}: AdminCombinedOrdersContentProps = {}) {
  return (
    <PageContentWrapper>
      <OrderList
        dataSource="adminCombined"
        detailHrefBase="/admin/orders"
        initialOrders={initialOrders}
      />
      <FloatingActionButtons variant="orders" />
    </PageContentWrapper>
  );
}
