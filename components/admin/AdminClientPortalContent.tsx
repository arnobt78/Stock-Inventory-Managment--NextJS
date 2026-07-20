"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/lib/ui/semantic-badges";
import {
  CARD_LIST_DIVIDE_CLASS,
  CARD_LIST_ROW_CLASS,
  CARD_LIST_META_ROW_CLASS,
} from "@/lib/ui/card-list-styles";
import { AnalyticsCard } from "@/components/ui/analytics-card";
import {
  CopyableText,
  PageContentWrapper,
  PageSectionHeader,
  DataSlotPulse,
  GlassCard,
  SectionCountBadge,
  SectionCardHeader,
  AvatarInlineLink,
  ClientCompactDateTime,
  RecentOrderStatusColumn,
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
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import {
  Users,
  ShoppingCart,
  FileText,
  DollarSign,
  ArrowRight,
  Tag,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductThumb } from "@/components/products/ProductOptionRow";
import type { ClientPortalClient, ClientPortalStats } from "@/types";
import {
  AdminEmbedDataTable,
  type AdminEmbedColumn,
} from "@/components/admin/AdminEmbedDataTable";

export type AdminClientPortalContentProps = {
  initialStats?: ClientPortalStats | null;
};

export default function AdminClientPortalContent({
  initialStats,
}: AdminClientPortalContentProps = {}) {
  const portalQuery = useClientPortal(initialStats ?? undefined);
  const stats = portalQuery.data ?? initialStats ?? null;
  const dataLoading = isDataSlotUnsettled(portalQuery, initialStats);

  useSyncSsrQueryData(
    queryKeys.clientPortal.overview(),
    initialStats ?? undefined,
  );

  const clientColumns = useMemo<AdminEmbedColumn<ClientPortalClient>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        render: (c) => (
          <AvatarInlineLink
            label={c.name}
            seed={c.id}
            image={c.image}
            href={`/admin/user-management/${c.id}`}
            size={28}
            linkClassName="text-sm font-normal"
          />
        ),
      },
      {
        id: "email",
        header: "Email",
        headerClassName: "hidden sm:table-cell",
        cellClassName:
          "hidden sm:table-cell text-gray-600 dark:text-gray-300 truncate max-w-[160px]",
        render: (c) => c.email,
      },
      {
        id: "orders",
        header: "Orders",
        headerClassName: "text-right",
        cellClassName: "text-right text-gray-700 dark:text-white",
        render: (c) => c.orderCount,
      },
      {
        id: "invoices",
        header: "Invoices",
        headerClassName: "text-right",
        cellClassName: "text-right text-gray-700 dark:text-white",
        render: (c) => c.invoiceCount,
      },
      {
        id: "spent",
        header: "Total Spent",
        headerClassName: "text-right",
        cellClassName: "text-right text-gray-700 dark:text-white",
        render: (c) => `$${c.totalSpent.toLocaleString()}`,
      },
    ],
    [],
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
            // REQ-0159 — order totals only (avoid double-count with invoice totals)
            value={`$${(stats?.revenue?.orders ?? 0).toLocaleString()}`}
            icon={DollarSign}
            description="Order totals"
            variant="amber"
            valueLoading={dataLoading}
          />
        </div>

        {/* Recent orders & invoices — REQ-0177 densify + SectionCardHeader */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          <GlassCard padding="body" variant="sky">
            <SectionCardHeader
              title="Recent Client Orders"
              description="Last 10 orders placed by client users"
              icon={ShoppingCart}
              tone="sky"
              className="mb-4"
            />
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
                {(stats?.recentOrders ?? []).map((o) => {
                  const productLabel = o.productPreview?.trim() || null;
                  const hasProductMeta = Boolean(
                    productLabel || (o.categoryId && o.categoryName),
                  );
                  return (
                    <li key={o.id} className={CARD_LIST_ROW_CLASS}>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5 overflow-visible">
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
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          {o.productId && productLabel ? (
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <ProductThumb
                                name={productLabel}
                                imageUrl={o.productImageUrl}
                                size="sm"
                              />
                              <Link
                                href={`/admin/products/${o.productId}`}
                                className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                              >
                                {productLabel}
                              </Link>
                            </span>
                          ) : productLabel ? (
                            <span className="truncate">{productLabel}</span>
                          ) : null}
                          {o.categoryId && o.categoryName ? (
                            <>
                              <span aria-hidden>·</span>
                              <Link
                                href={`/admin/categories/${o.categoryId}`}
                                className="inline-flex items-center gap-1 text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0"
                              >
                                <Tag
                                  className="h-3 w-3 shrink-0"
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {o.categoryName}
                                </span>
                              </Link>
                            </>
                          ) : null}
                          {o.supplierId && o.supplierName ? (
                            <>
                              {hasProductMeta || productLabel ? (
                                <span aria-hidden>·</span>
                              ) : null}
                              <AvatarInlineLink
                                seed={o.supplierId}
                                image={o.supplierImage}
                                label={o.supplierName}
                                href={`/admin/suppliers/${o.supplierId}`}
                                size={20}
                                linkClassName="text-xs"
                                className="gap-1.5"
                              />
                            </>
                          ) : null}
                        </div>
                        {/* REQ-0176/0177 — date-first then client avatar */}
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Calendar
                              className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400"
                              aria-hidden
                            />
                            <ClientCompactDateTime
                              date={o.createdAt}
                              semantic="created"
                            />
                          </span>
                          <span aria-hidden>·</span>
                          <AvatarInlineLink
                            label={o.clientName}
                            seed={o.clientId}
                            image={o.clientImage}
                            href={`/admin/user-management/${o.clientId}`}
                            size={20}
                            linkClassName="text-xs"
                            className="gap-1.5"
                          />
                        </div>
                      </div>
                      <RecentOrderStatusColumn
                        status={o.status}
                        statusAt={o.statusAt}
                        paymentStatus={o.paymentStatus}
                        trailing={
                          <span className="text-xs font-normal text-gray-700 dark:text-white">
                            ${o.total.toLocaleString()}
                          </span>
                        }
                      />
                    </li>
                  );
                })}
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

          <GlassCard padding="body" variant="emerald">
            <SectionCardHeader
              title="Recent Client Invoices"
              description="Last 10 invoices for client users"
              icon={FileText}
              tone="emerald"
              className="mb-4"
            />
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
              <p className={CARD_EMPTY_MESSAGE_CLASS}>
                No client invoices yet.
              </p>
            ) : (
              <ul className={CARD_LIST_DIVIDE_CLASS}>
                {(stats?.recentInvoices ?? []).map((i) => {
                  const productLabel = i.productPreview?.trim() || null;
                  return (
                    <li key={i.id} className={CARD_LIST_ROW_CLASS}>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5 overflow-visible">
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
                        {(i.productId || productLabel || i.categoryName) && (
                          <div className={CARD_LIST_META_ROW_CLASS}>
                            {i.productId && productLabel ? (
                              <span className="inline-flex items-center gap-1 min-w-0">
                                <ProductThumb
                                  name={productLabel}
                                  imageUrl={i.productImageUrl}
                                  size="sm"
                                />
                                <Link
                                  href={`/admin/products/${i.productId}`}
                                  className="text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 truncate"
                                >
                                  {productLabel}
                                </Link>
                              </span>
                            ) : productLabel ? (
                              <span className="truncate">{productLabel}</span>
                            ) : null}
                            {i.categoryId && i.categoryName ? (
                              <>
                                <span aria-hidden>·</span>
                                <Link
                                  href={`/admin/categories/${i.categoryId}`}
                                  className="inline-flex items-center gap-1 text-xs font-normal text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 min-w-0"
                                >
                                  <Tag
                                    className="h-3 w-3 shrink-0"
                                    aria-hidden
                                  />
                                  <span className="truncate">
                                    {i.categoryName}
                                  </span>
                                </Link>
                              </>
                            ) : null}
                          </div>
                        )}
                        <div className={CARD_LIST_META_ROW_CLASS}>
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Calendar
                              className="h-3 w-3 shrink-0 text-gray-500 dark:text-gray-400"
                              aria-hidden
                            />
                            <ClientCompactDateTime
                              date={i.createdAt}
                              semantic="created"
                            />
                          </span>
                          <span aria-hidden>·</span>
                          <AvatarInlineLink
                            label={i.clientName}
                            seed={i.clientId}
                            image={i.clientImage}
                            href={`/admin/user-management/${i.clientId}`}
                            size={20}
                            linkClassName="text-xs"
                            className="gap-1.5"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <InvoiceStatusBadge status={i.status} />
                        <span className="text-xs font-normal text-gray-700 dark:text-white">
                          ${i.total.toLocaleString()}
                        </span>
                      </div>
                    </li>
                  );
                })}
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

        {/* Clients list */}
        <GlassCard padding="body" variant="violet">
          <SectionCardHeader
            title="Clients"
            description='Users with role "client" and their activity summary'
            icon={Users}
            tone="violet"
            className="mb-4"
          />
          <AdminEmbedDataTable
            columns={clientColumns}
            data={stats?.clients ?? []}
            loading={dataLoading}
            emptyMessage='No client users yet. Assign "client" role to users from User Management.'
            emptyIcon={Users}
            getRowKey={(c) => c.id}
          />
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
