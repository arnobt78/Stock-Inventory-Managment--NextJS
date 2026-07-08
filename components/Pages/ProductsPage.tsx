/**
 * Products Page
 * Dedicated page for product management
 * Client role: browse products by owner with stat cards
 * Admin/Supplier: manage own products
 */

"use client";

import React, { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import ProductList from "@/components/products/ProductList";
import ClientProductList from "@/components/products/ClientProductList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import { useProducts } from "@/hooks/queries";
import { useAuth } from "@/contexts";
import type { ProductForHome } from "@/lib/server/home-data";

export type ProductsPageProps = {
  initialProducts?: ProductForHome[];
  userRole?: string;
  /** Pre-select product owner when client lands from catalog link /products?ownerId= */
  initialOwnerId?: string;
};

/**
 * Products page client component.
 * REQ-0021 — shell-first; SSR initialData passed to hooks and ProductList.
 */
export default function ProductsPage({
  initialProducts,
  userRole,
  initialOwnerId = "",
}: ProductsPageProps = {}) {
  const { data: allProducts = [] } = useProducts(
    !userRole || userRole === "client" ? undefined : initialProducts,
  );
  const { user } = useAuth();
  const role = userRole ?? user?.role ?? "user";
  const isClient = role === "client";
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(initialOwnerId);

  return (
    <Navbar>
      <PageContentWrapper>
        {isClient ? (
          <ClientProductList
            selectedOwnerId={selectedOwnerId}
            onOwnerChange={setSelectedOwnerId}
          />
        ) : (
          <ProductList initialProducts={initialProducts} />
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
