"use client";

import React from "react";
import OrderList from "@/components/orders/OrderList";
import { PageContentWrapper } from "@/components/shared";
import type { OrderForPage } from "@/lib/server/orders-data";

export type AdminClientOrdersContentProps = {
  initialOrders?: OrderForPage[];
};

/**
 * Admin Client Orders — orders placed by others that contain products owned by the current user.
 * Reuses OrderList with dataSource="clientOrders"; detail links go to /admin/client-orders/[id].
 */
export default function AdminClientOrdersContent({
  initialOrders,
}: AdminClientOrdersContentProps = {}) {
  return (
    <PageContentWrapper>
      <OrderList dataSource="clientOrders" initialOrders={initialOrders} />
    </PageContentWrapper>
  );
}
