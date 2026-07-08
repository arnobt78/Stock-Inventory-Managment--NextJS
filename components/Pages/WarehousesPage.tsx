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

export type WarehousesPageProps = {
  initialWarehouses?: WarehouseForPage[];
};

/**
 * Warehouses page client component.
 * REQ-0021 — shell-first; SSR initialData passed to WarehouseList.
 */
export default function WarehousesPage({
  initialWarehouses,
}: WarehousesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <WarehouseList initialWarehouses={initialWarehouses} />
        <FloatingActionButtons variant="warehouses" />
      </PageContentWrapper>
    </Navbar>
  );
}
