"use client";

/**
 * REQ-0127 — shared urgent reorder forecast table (category/supplier/warehouse detail).
 * REQ-0223 — DenseCatalogProductCell densify + overflow-visible Urgent glow (no extra pad).
 */

import { AlertTriangle } from "lucide-react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionTitleRow } from "@/lib/ui/section-title-row";
import { GlassCard } from "@/lib/ui/glass-card";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { DenseCatalogProductCell } from "@/components/shared/DenseCatalogProductCell";
import { ForecastUrgencyBadge } from "@/lib/ui/semantic-badges";
import { cn } from "@/lib/utils";
import type { CategoryForecastUrgentRow } from "@/types/category";

export type UrgentReorderForecastTableProps = {
  rows?: CategoryForecastUrgentRow[];
  loading?: boolean;
  productHref: (productId: string) => string;
  /** Optional; derived from productHref base when omitted (admin vs store). */
  categoryHref?: (categoryId: string) => string;
  supplierHref?: (supplierId: string) => string;
  className?: string;
};

/** Infer category/supplier bases from product path (`/admin/...` vs store). */
function defaultCatalogHrefs(productHref: (id: string) => string): {
  categoryHref: (id: string) => string;
  supplierHref: (id: string) => string;
} {
  const sample = productHref("__id__");
  const isAdmin = sample.includes("/admin/");
  return {
    categoryHref: (id) =>
      isAdmin ? `/admin/categories/${id}` : `/categories/${id}`,
    supplierHref: (id) =>
      isAdmin ? `/admin/suppliers/${id}` : `/suppliers/${id}`,
  };
}

export function UrgentReorderForecastTable({
  rows,
  loading = false,
  productHref,
  categoryHref: categoryHrefProp,
  supplierHref: supplierHrefProp,
  className,
}: UrgentReorderForecastTableProps) {
  const defaults = defaultCatalogHrefs(productHref);
  const categoryHref = categoryHrefProp ?? defaults.categoryHref;
  const supplierHref = supplierHrefProp ?? defaults.supplierHref;

  return (
    <GlassCard
      padding="body"
      variant="rose"
      className={cn("overflow-visible", className)}
    >
      <SectionTitleRow
        as="h3"
        icon={AlertTriangle}
        iconClassName="text-rose-600 dark:text-rose-400"
        title="Urgent Reorder Forecast"
        count={!loading ? rows?.length : undefined}
      />
      {/* No overflow wrapper — badge glow must not clip (REQ-0223); page scrolls if needed */}
      <div className="mt-4">
        <table className="w-full caption-bottom text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Days left</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBodyPulseRows rows={5} columnCount={4} />
          ) : (
            <TableBody>
              {rows?.map((row) => (
                <TableRow key={row.productId}>
                  <TableCell>
                    <DenseCatalogProductCell
                      productId={row.productId}
                      productName={row.productName}
                      sku={row.sku}
                      imageUrl={row.imageUrl}
                      categoryId={row.categoryId}
                      categoryName={row.categoryName}
                      supplierId={row.supplierId}
                      supplierName={row.supplierName}
                      supplierImage={row.supplierImage}
                      productHref={productHref}
                      categoryHref={categoryHref}
                      supplierHref={supplierHref}
                    />
                  </TableCell>
                  <TableCell>{row.availableStock}</TableCell>
                  <TableCell>{row.daysUntilStockout ?? "∞"}</TableCell>
                  <TableCell>
                    <ForecastUrgencyBadge
                      urgency={row.reorderRecommendation}
                      size="detail"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </table>
      </div>
    </GlassCard>
  );
}
