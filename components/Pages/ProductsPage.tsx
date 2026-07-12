/**
 * Products Page
 * Dedicated page for product management
 * Client role: browse products by owner with stat cards
 * Admin/Supplier: manage own products
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layouts/Navbar";
import ProductList from "@/components/products/ProductList";
import ClientProductList from "@/components/products/ClientProductList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import { useProducts } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import { replaceShallowSearchParam } from "@/lib/navigation/shallow-search-param";
import type { ProductForHome } from "@/lib/server/home-data";
import type { DashboardStats, SupplierPortalDashboard } from "@/types";
import type {
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
} from "@/types";

export type ProductsPageProps = {
  initialProducts?: ProductForHome[];
  userRole?: string;
  /** Pre-select product owner when client lands from catalog link /products?ownerId= */
  initialOwnerId?: string;
  /** SSR dashboard stats for admin/user stat cards (REQ-0025 P2) */
  initialStats?: DashboardStats;
  /** SSR supplier portal stats for supplier /products cards */
  initialSupplierPortal?: SupplierPortalDashboard | null;
  /** REQ-0026 — SSR client browse meta + products */
  initialBrowseMeta?: ClientBrowseMeta;
  initialBrowseProducts?: ClientBrowseProductsResponse;
};

/**
 * Products page client component.
 * REQ-0021 — shell-first; SSR initialData passed to hooks and ProductList.
 */
export default function ProductsPage({
  initialProducts,
  userRole,
  initialOwnerId = "",
  initialStats,
  initialSupplierPortal,
  initialBrowseMeta,
  initialBrowseProducts,
}: ProductsPageProps = {}) {
  const { user } = useAuth();
  const role = userRole ?? user?.role ?? "user";
  const isClient = role === "client";
  const { data: allProducts = [] } = useProducts(
    isClient ? undefined : initialProducts,
    { enabled: !isClient },
  );
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(initialOwnerId);

  // Full navigation from catalog link updates SSR initialOwnerId.
  useEffect(() => {
    setSelectedOwnerId(initialOwnerId);
  }, [initialOwnerId]);

  /** Shallow URL sync — shareable deep link without RSC refetch (REQ-0027). */
  const handleOwnerChange = useCallback((ownerId: string) => {
    setSelectedOwnerId(ownerId);
    replaceShallowSearchParam("ownerId", ownerId);
  }, []);

  return (
    <Navbar>
      <PageContentWrapper>
        {isClient ? (
          <ClientProductList
            selectedOwnerId={selectedOwnerId}
            onOwnerChange={handleOwnerChange}
            initialBrowseMeta={initialBrowseMeta}
            initialBrowseProducts={initialBrowseProducts}
            initialOwnerId={initialOwnerId}
          />
        ) : (
          <ProductList
            initialProducts={initialProducts}
            initialStats={initialStats}
            initialSupplierPortal={initialSupplierPortal}
          />
        )}
        {!isClient && user?.role !== "supplier" && (
          <FloatingActionButtons
            variant="products"
            allProducts={allProducts}
            userId={user?.id || ""}
          />
        )}
        {isClient && (
          <FloatingActionButtons
            variant="products-client"
            selectedOwnerId={selectedOwnerId}
          />
        )}
      </PageContentWrapper>
    </Navbar>
  );
}
