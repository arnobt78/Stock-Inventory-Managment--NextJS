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
  PageContentWrapper,
  PageSectionHeader,
  DataSlotPulse,
} from "@/components/shared";
import { useClientPortal } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
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

type CardVariant = "sky" | "emerald" | "amber" | "violet" | "blue" | "teal";

const variantConfig: Record<
  CardVariant,
  {
    border: string;
    gradient: string;
    shadow: string;
    hoverBorder: string;
    iconBg: string;
  }
> = {
  sky: {
    border: "border-sky-400/20",
    gradient: "bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_15px_40px_rgba(2,132,199,0.1)]",
    hoverBorder: "hover:border-sky-300/40",
    iconBg: "border-sky-300/30 bg-sky-100/50",
  },
  emerald: {
    border: "border-emerald-400/20",
    gradient:
      "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_15px_40px_rgba(16,185,129,0.1)]",
    hoverBorder: "hover:border-emerald-300/40",
    iconBg: "border-emerald-300/30 bg-emerald-100/50",
  },
  amber: {
    border: "border-amber-400/20",
    gradient:
      "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_40px_rgba(245,158,11,0.08)]",
    hoverBorder: "hover:border-amber-300/40",
    iconBg: "border-amber-300/30 bg-amber-100/50",
  },
  violet: {
    border: "border-violet-400/20",
    gradient:
      "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
    hoverBorder: "hover:border-violet-300/40",
    iconBg: "border-violet-300/30 bg-violet-100/50",
  },
  blue: {
    border: "border-blue-400/20",
    gradient:
      "bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(59,130,246,0.15)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.1)]",
    hoverBorder: "hover:border-blue-300/40",
    iconBg: "border-blue-300/30 bg-blue-100/50",
  },
  teal: {
    border: "border-teal-400/20",
    gradient:
      "bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent",
    shadow:
      "shadow-[0_15px_40px_rgba(20,184,166,0.15)] dark:shadow-[0_15px_40px_rgba(20,184,166,0.1)]",
    hoverBorder: "hover:border-teal-300/40",
    iconBg: "border-teal-300/30 bg-teal-100/50",
  },
};

function GlassCard({
  children,
  variant = "blue",
  className,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  const config = variantConfig[variant];
  return (
    <article
      className={cn(
        "group rounded-[20px] border p-4 sm:p-5 backdrop-blur-md transition-all duration-300 bg-white/60 dark:bg-white/5",
        config.border,
        config.gradient,
        config.shadow,
        config.hoverBorder,
        className,
      )}
    >
      {children}
    </article>
  );
}

export type AdminClientPortalContentProps = {
  initialStats?: ClientPortalStats | null;
};

export default function AdminClientPortalContent({
  initialStats,
}: AdminClientPortalContentProps = {}) {
  const portalQuery = useClientPortal(initialStats ?? undefined);
  const stats = portalQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotLoading(portalQuery, initialStats);

  return (
    <PageContentWrapper>
      <div className="flex flex-col">
        <PageSectionHeader
          as="h1"
          icon={Users}
          tone="violet"
          title="Client Portal"
          description="Overview of client users, their orders, invoices, and activity."
        />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 items-stretch pb-6">
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
          <GlassCard variant="sky">
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No client orders yet.
              </p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentOrders ?? []).map((o) => (
                  <li key={o.id} className={CARD_LIST_ROW_CLASS}>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                      >
                        {o.orderNumber}
                      </Link>
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
            {stats && (stats.recentOrders?.length ?? 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-3 w-full rounded-xl border border-sky-200/40 dark:border-white/10"
              >
                <Link href="/admin/orders" className="gap-1">
                  View all orders <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </GlassCard>

          {/* Recent invoices */}
          <GlassCard variant="emerald">
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No client invoices yet.
              </p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentInvoices ?? []).map((i) => (
                  <li key={i.id} className={CARD_LIST_ROW_CLASS}>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/invoices/${i.id}`}
                        className="font-normal text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate block"
                      >
                        {i.invoiceNumber}
                      </Link>
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
            {stats && (stats.recentInvoices?.length ?? 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mt-3 w-full rounded-xl border border-emerald-200/40 dark:border-white/10"
              >
                <Link href="/admin/invoices" className="gap-1">
                  View all invoices <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </GlassCard>
        </div>

        {/* Clients list — glassmorphic card */}
        <GlassCard variant="violet">
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
                        <Link
                          href={`/admin/user-management/${c.id}`}
                          className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                        >
                          {c.name}
                        </Link>
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
              className="mt-4 w-full rounded-xl border border-violet-200/40 dark:border-white/10"
            >
              <Link href="/admin/user-management" className="gap-1">
                Manage users <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </GlassCard>
      </div>
    </PageContentWrapper>
  );
}
