"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  OrderStatusBadge,
  ProductStockStatusBadge,
} from "@/lib/ui/semantic-badges";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_ROW_CLASS,
  CARD_LIST_META_CLASS,
} from "@/lib/ui/card-list-styles";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import {
  CopyableText,
  PageContentWrapper,
  PageSectionHeader,
  DataSlotPulse,
  GlassCard,
  SectionCountBadge,
  AvatarInlineLink,
  GLASS_CARD_VARIANT_CONFIG as variantConfig,
} from "@/components/shared";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import { CARD_EMPTY_MESSAGE_CLASS } from "@/lib/ui/card-empty-styles";
import {
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
} from "@/lib/ui/glass-button-styles";
import { useSupplierPortal } from "@/hooks/queries";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import {
  Truck,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SupplierPortalStats } from "@/types";

export type AdminSupplierPortalContentProps = {
  initialStats?: SupplierPortalStats | null;
};

export default function AdminSupplierPortalContent({
  initialStats,
}: AdminSupplierPortalContentProps = {}) {
  const portalQuery = useSupplierPortal(initialStats ?? undefined);
  const stats = portalQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotLoading(portalQuery, initialStats);

  useSyncSsrQueryData(
    queryKeys.supplierPortal.overview(),
    initialStats ?? undefined,
  );

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h1"
          icon={Truck}
          tone="teal"
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              Supplier Portal
              <SectionCountBadge>
                {stats?.counts?.suppliers ?? 0}
              </SectionCountBadge>
            </span>
          }
          description="Overview of supplier entities, their products, orders, and activity."
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch">
          <AnalyticsCard
            title="Suppliers"
            value={stats?.counts?.suppliers ?? 0}
            icon={Truck}
            description="Supplier entities"
            variant="violet"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Products"
            value={stats?.counts?.products ?? 0}
            icon={Package}
            description="From all suppliers"
            variant="sky"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Orders"
            value={stats?.counts?.orders ?? 0}
            icon={ShoppingCart}
            description="Containing supplier products"
            variant="emerald"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Inventory Value"
            value={`$${(stats?.counts?.totalValue ?? 0).toLocaleString()}`}
            icon={DollarSign}
            description="Total product value"
            variant="amber"
            valueLoading={dataLoading}
          />
        </div>

        {/* Recent products & orders — glassmorphic cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {/* Recent products */}
          <GlassCard padding="body" variant="sky">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.sky.iconBg,
                  "dark:border-sky-400/30 dark:bg-sky-500/20",
                )}
              >
                <Package className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Recent Supplier Products
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 10 products from suppliers
                </p>
              </div>
            </div>
            {dataLoading ? (
              <ul className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <DataSlotPulse variant="text-sm" className="w-32" />
                    <DataSlotPulse variant="badge" />
                  </li>
                ))}
              </ul>
            ) : (stats?.recentProducts?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>No supplier products yet.</p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentProducts ?? []).map((p) => (
                  <li key={p.id} className={CARD_LIST_ROW_CLASS}>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${p.id}`}
                        prefetch
                        className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                      >
                        {p.name}
                      </Link>
                      <span className={CARD_LIST_META_CLASS}>
                        {p.supplierName} · {p.sku ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ProductStockStatusBadge status={p.status} />
                      <span className="text-xs font-normal text-gray-700 dark:text-white">
                        ${p.price.toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "group w-full gap-2",
                  GLASS_BUTTON_ICON_HOVER,
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_ACTION_BUTTON.sky,
                )}
              >
                <Link href="/admin/products">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Products
                </Link>
              </Button>
            </div>
          </GlassCard>

          {/* Recent orders */}
          <GlassCard padding="body" variant="emerald">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.emerald.iconBg,
                  "dark:border-emerald-400/30 dark:bg-emerald-500/20",
                )}
              >
                <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Recent Supplier Orders
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 10 orders containing supplier products
                </p>
              </div>
            </div>
            {dataLoading ? (
              <ul className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <DataSlotPulse variant="text-sm" className="w-32" />
                    <DataSlotPulse variant="currency" />
                  </li>
                ))}
              </ul>
            ) : (stats?.recentOrders?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>No supplier orders yet.</p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentOrders ?? []).map((o) => (
                  <li key={o.id} className={CARD_LIST_ROW_CLASS}>
                    <div className="min-w-0">
                      <CopyableText
                        value={o.orderNumber}
                        className="max-w-full"
                      >
                        <Link
                          href={`/admin/orders/${o.id}`}
                          prefetch
                          className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                        >
                          {o.orderNumber}
                        </Link>
                      </CopyableText>
                      <span className={CARD_LIST_META_CLASS}>
                        {o.supplierName} ·{" "}
                        {format(new Date(o.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <OrderStatusBadge status={o.status} />
                      <span className="text-xs font-normal text-gray-700 dark:text-white">
                        ${o.total.toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "group w-full gap-2",
                  GLASS_BUTTON_ICON_HOVER,
                  GLASS_BUTTON_SHELL_RESET,
                  GLASS_ACTION_BUTTON.emerald,
                )}
              >
                <Link href="/admin/orders">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Orders
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Suppliers table — glassmorphic card */}
        <GlassCard padding="body" variant="violet">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                "p-2 rounded-xl border",
                variantConfig.violet.iconBg,
                "dark:border-violet-400/30 dark:bg-violet-500/20",
              )}
            >
              <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Suppliers
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Supplier entities and their product/order summary
              </p>
            </div>
          </div>
          {dataLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between gap-2">
                  <DataSlotPulse variant="text-sm" className="w-40" />
                  <DataSlotPulse variant="metric" />
                </div>
              ))}
            </div>
          ) : (stats?.suppliers?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No suppliers yet. Add suppliers from the Suppliers page.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-violet-200/40 dark:border-white/10 text-left text-gray-600 dark:text-gray-400">
                    <th className="px-2 pr-4 font-medium">Name</th>
                    <th className="px-2 pr-4 hidden sm:table-cell font-medium">
                      Email
                    </th>
                    <th className="px-2 pr-4 text-right font-medium">
                      Products
                    </th>
                    <th className="px-2 pr-4 text-right font-medium">Orders</th>
                    <th className="px-2 text-right font-medium">
                      Inventory Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-white/10">
                  {(stats?.suppliers ?? []).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 px-2 pr-4">
                        {/* REQ-0100: stale Redis may omit userId until TTL or supplierPortal:* invalidation */}
                        <AvatarInlineLink
                          label={s.name}
                          seed={s.userId ?? s.id}
                          image={s.image}
                          href={`/admin/suppliers/${s.id}`}
                          size={28}
                        />
                      </td>
                      <td className="py-2 px-2 pr-4 hidden sm:table-cell text-gray-700 dark:text-white truncate max-w-[200px]">
                        {s.email}
                      </td>
                      <td className="py-2 px-2 pr-4 text-right text-gray-700 dark:text-white">
                        {s.productCount}
                      </td>
                      <td className="py-2 px-2 pr-4 text-right text-gray-700 dark:text-white">
                        {s.orderCount}
                      </td>
                      <td className="py-2 px-2 text-right font-normal text-gray-700 dark:text-white">
                        ${s.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {stats && stats.suppliers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "mt-4 group w-full gap-2",
                GLASS_BUTTON_ICON_HOVER,
                GLASS_BUTTON_SHELL_RESET,
                GLASS_ACTION_BUTTON.violet,
              )}
            >
              <Link href="/suppliers">
                <ArrowRight className="h-4 w-4 shrink-0" />
                Manage Suppliers
              </Link>
            </Button>
          )}
        </GlassCard>
      </div>
    </PageContentWrapper>
  );
}
