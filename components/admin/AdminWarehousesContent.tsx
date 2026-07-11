"use client";

import React from "react";
import WarehouseList from "@/components/warehouses/WarehouseList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { DashboardStats, WarehouseStockSummary } from "@/types";

export type AdminWarehousesContentProps = {
  initialWarehouses?: WarehouseForPage[];
  initialStats?: DashboardStats;
  initialWarehouseSummary?: WarehouseStockSummary[];
};

/**
 * Admin warehouses section — same content as /warehouses but inside admin layout (no Navbar).
 * REQ-0021 — shell-first; SSR initialData passed to WarehouseList.
 */
export default function AdminWarehousesContent({
  initialWarehouses,
  initialStats,
  initialWarehouseSummary,
}: AdminWarehousesContentProps = {}) {
  return (
    <PageContentWrapper>
      <WarehouseList
        initialWarehouses={initialWarehouses}
        initialStats={initialStats}
        initialWarehouseSummary={initialWarehouseSummary}
      />
      <FloatingActionButtons variant="warehouses" />
    </PageContentWrapper>
  );
}
