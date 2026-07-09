/**
 * Warehouses Page
 * Dedicated page for warehouse management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import WarehouseList from "@/components/warehouses/WarehouseList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { WarehouseForPage } from "@/lib/server/warehouses-data";
import type { DashboardStats } from "@/types";

export type WarehousesPageProps = {
  initialWarehouses?: WarehouseForPage[];
  initialStats?: DashboardStats;
};

/**
 * Warehouses page client component.
 * REQ-0021 — shell-first; SSR initialData passed to WarehouseList.
 */
export default function WarehousesPage({
  initialWarehouses,
  initialStats,
}: WarehousesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <WarehouseList
          initialWarehouses={initialWarehouses}
          initialStats={initialStats}
        />
        <FloatingActionButtons variant="warehouses" />
      </PageContentWrapper>
    </Navbar>
  );
}
