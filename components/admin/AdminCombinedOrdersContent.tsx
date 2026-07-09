"use client";

import React from "react";
import OrderList from "@/components/orders/OrderList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { OrderForPage } from "@/lib/server/orders-data";
import type { DashboardStats } from "@/types";

export type AdminCombinedOrdersContentProps = {
  initialOrders?: OrderForPage[];
  initialClientOrders?: OrderForPage[];
  initialStats?: DashboardStats | null;
};

/** Admin combined Orders — personal + client orders with Order type filter (REQ-0025 SSR). */
export default function AdminCombinedOrdersContent({
  initialOrders,
  initialClientOrders,
  initialStats,
}: AdminCombinedOrdersContentProps = {}) {
  return (
    <PageContentWrapper>
      <OrderList
        dataSource="adminCombined"
        detailHrefBase="/admin/orders"
        initialOrders={initialOrders}
        initialClientOrders={initialClientOrders}
        initialStats={initialStats}
      />
      <FloatingActionButtons variant="orders" />
    </PageContentWrapper>
  );
}
