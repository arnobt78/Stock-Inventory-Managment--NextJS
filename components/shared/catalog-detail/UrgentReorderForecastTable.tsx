"use client";

/**
 * REQ-0127 — shared urgent reorder forecast table (category/supplier/warehouse detail).
 */

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SectionTitleRow } from "@/lib/ui/section-title-row";
import { GlassCard } from "@/lib/ui/glass-card";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import { ForecastUrgencyBadge } from "@/lib/ui/semantic-badges";
import type { CategoryForecastUrgentRow } from "@/types/category";

export type UrgentReorderForecastTableProps = {
  rows?: CategoryForecastUrgentRow[];
  loading?: boolean;
  productHref: (productId: string) => string;
  className?: string;
};

export function UrgentReorderForecastTable({
  rows,
  loading = false,
  productHref,
  className,
}: UrgentReorderForecastTableProps) {
  return (
    <GlassCard padding="body" variant="rose" className={className}>
      <SectionTitleRow
        as="h3"
        icon={AlertTriangle}
        iconClassName="text-rose-600 dark:text-rose-400"
        title="Urgent reorder forecast"
        count={!loading ? rows?.length : undefined}
      />
      <div className="mt-4 overflow-x-auto">
        <Table>
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
                    <div className="flex items-start gap-2 min-w-0">
                      <ProductThumb
                        name={row.productName}
                        size="sm"
                        className="rounded-lg shrink-0"
                      />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Link
                          href={productHref(row.productId)}
                          prefetch
                          className="text-sm font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 truncate"
                        >
                          {row.productName}
                        </Link>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate">
                          {row.sku}
                        </span>
                      </div>
                    </div>
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
        </Table>
      </div>
    </GlassCard>
  );
}
