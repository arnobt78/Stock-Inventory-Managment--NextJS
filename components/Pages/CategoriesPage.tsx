/**
 * Categories Page
 * Dedicated page for category management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import CategoryList from "@/components/category/CategoryList";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import { PageContentWrapper } from "@/components/shared";
import type { CategoryForHome } from "@/lib/server/home-data";
import type { DashboardStats } from "@/types";

export type CategoriesPageProps = {
  initialCategories?: CategoryForHome[];
  initialStats?: DashboardStats;
};

/**
 * Categories page client component.
 * REQ-0021 — shell-first; SSR initialData passed to CategoryList.
 */
export default function CategoriesPage({
  initialCategories,
  initialStats,
}: CategoriesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <CategoryList
          initialCategories={initialCategories}
          initialStats={initialStats}
        />
        <FloatingActionButtons variant="categories" />
      </PageContentWrapper>
    </Navbar>
  );
}
