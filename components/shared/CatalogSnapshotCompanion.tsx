/**
 * REQ-0141 — compact KPI card beside category/supplier stock pie
 * (avoids lg:col-span-2 when stockChartCompanion is omitted).
 * REQ-0221 — pass dataLoading=false when snapshot densify is already on the entity.
 */

import {
  AlertTriangle,
  DollarSign,
  Package,
  PackageX,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { DetailInfoRow } from "@/components/orders/detail";
import { GlassCard, GlassCardBody } from "@/lib/ui/glass-card";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";
import { cn } from "@/lib/utils";

export type CatalogSnapshotStats = {
  totalProducts: number;
  totalQuantitySold: number;
  uniqueOrders: number;
  totalValue: number;
};

export type CatalogSnapshotStockSignals = {
  lowStockCount: number;
  outOfStockCount: number;
};

export type CatalogSnapshotCompanionProps = {
  stats: CatalogSnapshotStats;
  stockSignals: CatalogSnapshotStockSignals;
  dataLoading?: boolean;
  className?: string;
};

export function CatalogSnapshotCompanion({
  stats,
  stockSignals,
  dataLoading = false,
  className,
}: CatalogSnapshotCompanionProps) {
  return (
    <GlassCard
      variant="amber"
      className={cn("h-full flex flex-col", className)}
    >
      <GlassCardBody className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-100/50 dark:border-white/15 dark:bg-white/10">
            <Package className="h-4 w-4 text-gray-700 dark:text-white" />
          </div>
          <div>
            <h3 className={TYPO_CARD_TITLE}>Catalog Snapshot</h3>
            <p className={TYPO_SUBTITLE}>Products, sales, and stock signals</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <DetailInfoRow
            icon={Package}
            label="Total products:"
            tone="sky"
            loading={dataLoading}
          >
            {!dataLoading && stats.totalProducts}
          </DetailInfoRow>
          <DetailInfoRow
            icon={ShoppingCart}
            label="Qty sold:"
            tone="violet"
            loading={dataLoading}
          >
            {!dataLoading && stats.totalQuantitySold}
          </DetailInfoRow>
          <DetailInfoRow
            icon={DollarSign}
            label="Orders:"
            tone="emerald"
            loading={dataLoading}
          >
            {!dataLoading && stats.uniqueOrders}
          </DetailInfoRow>
          <DetailInfoRow
            icon={Wallet}
            label="Inventory value:"
            tone="blue"
            loading={dataLoading}
          >
            {!dataLoading && (
              <span className="text-sky-600 dark:text-sky-400">
                ${stats.totalValue.toFixed(2)}
              </span>
            )}
          </DetailInfoRow>
          <DetailInfoRow
            icon={AlertTriangle}
            label="Low stock:"
            tone="amber"
            loading={dataLoading}
          >
            {!dataLoading && stockSignals.lowStockCount}
          </DetailInfoRow>
          <DetailInfoRow
            icon={PackageX}
            label="Out of stock:"
            tone="rose"
            loading={dataLoading}
          >
            {!dataLoading && stockSignals.outOfStockCount}
          </DetailInfoRow>
        </div>
      </GlassCardBody>
    </GlassCard>
  );
}
