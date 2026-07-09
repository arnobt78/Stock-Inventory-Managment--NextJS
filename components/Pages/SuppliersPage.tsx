/**
 * Suppliers Page
 * Dedicated page for supplier management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import SupplierList from "@/components/supplier/SupplierList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { SupplierForHome } from "@/lib/server/home-data";
import type { DashboardStats } from "@/types";

export type SuppliersPageProps = {
  initialSuppliers?: SupplierForHome[];
  initialStats?: DashboardStats;
};

/**
 * Suppliers page client component.
 * REQ-0021 — shell-first; SSR initialData passed to SupplierList.
 */
export default function SuppliersPage({
  initialSuppliers,
  initialStats,
}: SuppliersPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <SupplierList
          initialSuppliers={initialSuppliers}
          initialStats={initialStats}
        />
        <FloatingActionButtons variant="suppliers" />
      </PageContentWrapper>
    </Navbar>
  );
}
