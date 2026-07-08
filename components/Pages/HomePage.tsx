"use client";

/**
 * Home (store overview) for admin: statistics cards and quick links to products, categories, suppliers.
 * REQ-0021 — shell-first layout; hooks receive SSR initialData directly.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts";
import ProductList from "@/components/products/ProductList";
import SupplierList from "@/components/supplier/SupplierList";
import CategoryList from "@/components/category/CategoryList";
import { StatisticsSection } from "@/components/home/StatisticsSection";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import { useProducts } from "@/hooks/queries";
import type {
  ProductForHome,
  CategoryForHome,
  SupplierForHome,
} from "@/lib/server/home-data";
import type { DashboardStats } from "@/types";

export type HomePageProps = {
  initialProducts?: ProductForHome[];
  initialCategories?: CategoryForHome[];
  initialSuppliers?: SupplierForHome[];
  initialStats?: DashboardStats | null;
  /** From server searchParams — avoids relying on client-only OAuth detection on first paint */
  initialOAuthSuccess?: boolean;
};

/**
 * Home page client component (initialOAuthSuccess from server; useSearchParams for URL fallback).
 * Accepts optional server-fetched data for first-render hydration via hook initialData.
 */
export default function HomePage({
  initialProducts,
  initialCategories,
  initialSuppliers,
  initialStats,
  initialOAuthSuccess = false,
}: HomePageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isCheckingAuth, user, refreshSession } = useAuth();
  const { data: allProducts = [] } = useProducts(initialProducts);

  const [isRefreshingOAuth, setIsRefreshingOAuth] = useState(false);
  const [oauthRefreshComplete, setOauthRefreshComplete] = useState(false);
  const oauthHandledRef = useRef(false);
  const urlCleanedRef = useRef(false);

  useEffect(() => {
    const isOAuthFlow =
      initialOAuthSuccess || searchParams.get("oauth_success") === "true";

    if (isOAuthFlow && !oauthHandledRef.current) {
      oauthHandledRef.current = true;
      queueMicrotask(() => setIsRefreshingOAuth(true));

      refreshSession()
        .then(() => {
          setOauthRefreshComplete(true);
          setIsRefreshingOAuth(false);
          if (
            !urlCleanedRef.current &&
            typeof window !== "undefined" &&
            window.location.search.includes("oauth_success=true")
          ) {
            urlCleanedRef.current = true;
            window.history.replaceState(
              { ...window.history.state, as: "/", url: "/" },
              "",
              "/",
            );
          }
        })
        .catch(() => {
          setOauthRefreshComplete(true);
          setIsRefreshingOAuth(false);
        });
      return;
    }

    if (!isOAuthFlow || oauthRefreshComplete) {
      if (isOAuthFlow && oauthRefreshComplete) {
        if (!isCheckingAuth && !isLoggedIn) {
          router.replace("/login", { scroll: false });
        }
        return;
      }

      if (!isOAuthFlow && !isCheckingAuth && !isLoggedIn) {
        router.replace("/login", { scroll: false });
      }
    }
  }, [
    initialOAuthSuccess,
    searchParams,
    isLoggedIn,
    isCheckingAuth,
    router,
    refreshSession,
    isRefreshingOAuth,
    oauthRefreshComplete,
  ]);

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="pb-6 flex flex-col items-start text-left">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white ">
            Store Overview
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            The cards below show your store-wide metrics as the store owner,
            including your own activity and activity from clients and others.
            Numbers update automatically when you or others make changes. For
            your personal orders, products, and activity only, visit{" "}
            <Link
              href="/admin/my-activity"
              className="font-medium text-sky-600 hover:text-sky-800"
            >
              My Activities
            </Link>
            .
          </p>
        </div>

        <div id="statistics" className="pb-6 scroll-mt-20">
          <StatisticsSection initialStats={initialStats} />
        </div>

        <div id="products" className="pb-6 scroll-mt-20">
          <ProductList initialProducts={initialProducts} />
        </div>

        <div id="suppliers" className="pb-6 scroll-mt-20">
          <SupplierList initialSuppliers={initialSuppliers} />
        </div>

        <div id="categories" className="pb-6 scroll-mt-20">
          <CategoryList initialCategories={initialCategories} />
        </div>

        <FloatingActionButtons
          allProducts={allProducts}
          userId={user?.id || ""}
        />
      </PageContentWrapper>
    </Navbar>
  );
}
