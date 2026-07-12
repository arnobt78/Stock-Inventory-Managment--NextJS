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
import type {
  DashboardStats,
  ClientPortalDashboard,
  SupplierPortalDashboard,
} from "@/types";

export type OrdersPageProps = {
  initialOrders?: OrderForPage[];
  userRole?: string;
  /** SSR dashboard stats for admin/user /orders cards (REQ-0025) */
  initialStats?: DashboardStats;
  /** SSR client portal for client /orders cards */
  initialClientPortal?: ClientPortalDashboard;
  /** SSR supplier portal for supplier /orders cards */
  initialSupplierPortal?: SupplierPortalDashboard | null;
};

/**
 * Orders page client component.
 * REQ-0021 — shell-first; SSR initialData passed to OrderList.
 */
export default function OrdersPage({
  initialOrders,
  userRole,
  initialStats,
  initialClientPortal,
  initialSupplierPortal,
}: OrdersPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <OrderList
          initialOrders={initialOrders}
          initialStats={initialStats}
          initialClientPortal={initialClientPortal}
          initialSupplierPortal={initialSupplierPortal}
        />
        {userRole !== "client" && userRole !== "supplier" && (
          <FloatingActionButtons variant="orders" />
        )}
      </PageContentWrapper>
    </Navbar>
  );
}
