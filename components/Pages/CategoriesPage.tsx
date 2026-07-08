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

export type CategoriesPageProps = {
  initialCategories?: CategoryForHome[];
};

/**
 * Categories page client component.
 * REQ-0021 — shell-first; SSR initialData passed to CategoryList.
 */
export default function CategoriesPage({
  initialCategories,
}: CategoriesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <CategoryList initialCategories={initialCategories} />
        <FloatingActionButtons variant="categories" />
      </PageContentWrapper>
    </Navbar>
  );
}
