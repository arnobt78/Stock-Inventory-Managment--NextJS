"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
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
import { useClientPortal } from "@/hooks/queries";
import {
  isDataSlotLoading,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import {
  Users,
  ShoppingCart,
  FileText,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ClientPortalStats } from "@/types";

export type AdminClientPortalContentProps = {
  initialStats?: ClientPortalStats | null;
};

export default function AdminClientPortalContent({
  initialStats,
}: AdminClientPortalContentProps = {}) {
  const portalQuery = useClientPortal(initialStats ?? undefined);
  const stats = portalQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotLoading(portalQuery, initialStats);

  useSyncSsrQueryData(
    queryKeys.clientPortal.overview(),
    initialStats ?? undefined,
  );

  return (
    <PageContentWrapper>
      <div className="flex flex-col gap-6">
        <PageSectionHeader
          as="h1"
          icon={Users}
          tone="violet"
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              Client Portal
              <SectionCountBadge>
                {stats?.counts?.clients ?? 0}
              </SectionCountBadge>
            </span>
          }
          description="Overview of client users, their orders, invoices, and activity."
          className={DETAIL_PAGE_HEADER_SPACING_CLASS}
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch">
          <AnalyticsCard
            title="Clients"
            value={stats?.counts?.clients ?? 0}
            icon={Users}
            description="Users with role client"
            variant="violet"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Orders"
            value={stats?.counts?.orders ?? 0}
            icon={ShoppingCart}
            description="Client orders"
            variant="sky"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Invoices"
            value={stats?.counts?.invoices ?? 0}
            icon={FileText}
            description="Client invoices"
            variant="emerald"
            valueLoading={dataLoading}
          />
          <AnalyticsCard
            title="Revenue"
            value={`$${((stats?.revenue?.orders ?? 0) + (stats?.revenue?.invoices ?? 0)).toLocaleString()}`}
            icon={DollarSign}
            description="Orders + Invoices"
            variant="amber"
            valueLoading={dataLoading}
          />
        </div>

        {/* Recent orders & invoices — glassmorphic cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {/* Recent orders */}
          <GlassCard padding="body" variant="sky">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.sky.iconBg,
                  "dark:border-sky-400/30 dark:bg-sky-500/20",
                )}
              >
                <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Recent Client Orders
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 10 orders placed by client users
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
            ) : (stats?.recentOrders?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>No client orders yet.</p>
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
                        {o.clientName} ·{" "}
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
                  GLASS_ACTION_BUTTON.sky,
                )}
              >
                <Link href="/admin/orders">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Orders
                </Link>
              </Button>
            </div>
          </GlassCard>

          {/* Recent invoices */}
          <GlassCard padding="body" variant="emerald">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl border",
                  variantConfig.emerald.iconBg,
                  "dark:border-emerald-400/30 dark:bg-emerald-500/20",
                )}
              >
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                  Recent Client Invoices
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Last 10 invoices for client users
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
            ) : (stats?.recentInvoices?.length ?? 0) === 0 ? (
              <p className={CARD_EMPTY_MESSAGE_CLASS}>No client invoices yet.</p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentInvoices ?? []).map((i) => (
                  <li key={i.id} className={CARD_LIST_ROW_CLASS}>
                    <div className="min-w-0">
                      <CopyableText
                        value={i.invoiceNumber}
                        className="max-w-full"
                      >
                        <Link
                          href={`/admin/invoices/${i.id}`}
                          prefetch
                          className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                        >
                          {i.invoiceNumber}
                        </Link>
                      </CopyableText>
                      <span className={CARD_LIST_META_CLASS}>
                        {i.clientName} ·{" "}
                        {format(new Date(i.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <InvoiceStatusBadge status={i.status} />
                      <span className="text-xs font-normal text-gray-700 dark:text-white">
                        ${i.total.toLocaleString()}
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
                <Link href="/admin/invoices">
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  View All Invoices
                </Link>
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Clients list — glassmorphic card */}
        <GlassCard padding="body" variant="violet">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                "p-2 rounded-xl border",
                variantConfig.violet.iconBg,
                "dark:border-violet-400/30 dark:bg-violet-500/20",
              )}
            >
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                Clients
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Users with role &ldquo;client&rdquo; and their activity summary
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
          ) : (stats?.clients?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No client users yet. Assign &ldquo;client&rdquo; role to users
              from User Management.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-violet-200/40 dark:border-white/10 text-left text-gray-600 dark:text-gray-400">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4 hidden sm:table-cell">Email</th>
                    <th className="py-2 pr-4 text-right">Orders</th>
                    <th className="py-2 pr-4 text-right">Invoices</th>
                    <th className="py-2 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-200/40 dark:divide-white/10">
                  {(stats?.clients ?? []).map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-4">
                        <AvatarInlineLink
                          label={c.name}
                          seed={c.id}
                          image={c.image}
                          href={`/admin/user-management/${c.id}`}
                          size={28}
                          linkClassName="text-sm font-normal"
                        />
                      </td>
                      <td className="py-2 pr-4 hidden sm:table-cell text-gray-600 dark:text-gray-400 truncate max-w-[160px]">
                        {c.email}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-700 dark:text-white">
                        {c.orderCount}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-700 dark:text-white">
                        {c.invoiceCount}
                      </td>
                      <td className="py-2 text-right text-gray-700 dark:text-white">
                        ${c.totalSpent.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {stats && (stats.clients?.length ?? 0) > 0 && (
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
              <Link href="/admin/user-management">
                <ArrowRight className="h-4 w-4 shrink-0" />
                Manage Users
              </Link>
            </Button>
          )}
        </GlassCard>
      </div>
    </PageContentWrapper>
  );
}
