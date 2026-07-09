"use client";

import React from "react";
import ProductList from "@/components/products/ProductList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import { useProducts } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import type { ProductForHome } from "@/lib/server/home-data";
import type { DashboardStats, SupplierPortalDashboard } from "@/types";

export type AdminProductsContentProps = {
  initialProducts?: ProductForHome[];
  initialStats?: DashboardStats;
  initialSupplierPortal?: SupplierPortalDashboard | null;
};

/**
 * Admin products section — same content as /products but inside admin layout (no Navbar).
 * REQ-0021 — shell-first; SSR initialData passed to ProductList.
 */
export default function AdminProductsContent({
  initialProducts,
  initialStats,
  initialSupplierPortal,
}: AdminProductsContentProps = {}) {
  const { data: allProducts = [] } = useProducts(initialProducts);
  const { user } = useAuth();

  return (
    <PageContentWrapper>
      <ProductList
        initialProducts={initialProducts}
        initialStats={initialStats}
        initialSupplierPortal={initialSupplierPortal}
      />
      <FloatingActionButtons
        variant="products"
        allProducts={allProducts}
        userId={user?.id || ""}
      />
    </PageContentWrapper>
  );
}
