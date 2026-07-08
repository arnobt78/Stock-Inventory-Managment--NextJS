/**
 * Orders Page
 * Dedicated page for order management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import OrderList from "@/components/orders/OrderList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { OrderForPage } from "@/lib/server/orders-data";

export type OrdersPageProps = {
  initialOrders?: OrderForPage[];
  userRole?: string;
};

/**
 * Orders page client component.
 * REQ-0021 — shell-first; SSR initialData passed to OrderList.
 */
export default function OrdersPage({
  initialOrders,
  userRole,
}: OrdersPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <OrderList initialOrders={initialOrders} />
        {userRole !== "client" && (
          <FloatingActionButtons variant="orders" />
        )}
      </PageContentWrapper>
    </Navbar>
  );
}
