/**
 * Support Ticket List Component
 * List view for admin support tickets with filters, table, and create button
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useSupportTickets,
  useDashboard,
  type SupportTicketViewFilter,
} from "@/hooks/queries";
import {
  isDataSlotLoading,
  isDataSlotUnsettled,
  queryKeys,
  useSyncSsrQueryData,
} from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { PageSectionHeader } from "@/components/shared";
import { createSupportTicketColumns } from "./SupportTicketTableColumns";
import SupportTicketFilters from "./SupportTicketFilters";
import { SupportTicketTable } from "./SupportTicketTable";
import SupportTicketDialog from "@/components/support-tickets/SupportTicketDialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertCircle } from "lucide-react";
import { StatisticsCard } from "@/components/home/StatisticsCard";
import { useAuth } from "@/contexts";
import type {
  ProductOwnerOption,
  SupportTicket,
  DashboardStats,
} from "@/types";

export type SupportTicketListProps = {
  detailHrefBase?: string;
  productOwners?: ProductOwnerOption[];
  /** SSR-passed tickets for first-render hydration (REQ-0021) */
  initialTickets?: SupportTicket[];
  /** SSR dashboard stats for status stat card (REQ-0125 — CategoryList parity) */
  initialStats?: DashboardStats;
};

export default function SupportTicketList({
  detailHrefBase,
  productOwners = [],
  initialTickets,
  initialStats,
}: SupportTicketListProps = {}) {
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [viewFilter, setViewFilter] = useState<SupportTicketViewFilter>("all");
  const { user } = useAuth();
  const supportTicketsQuery = useSupportTickets(viewFilter, initialTickets);
  const dashboardQuery = useDashboard(initialStats);

  useSyncSsrQueryData(
    queryKeys.supportTickets.list({ view: "all" }),
    viewFilter === "all" ? initialTickets : undefined,
  );
  useSyncSsrQueryData(
    queryKeys.dashboard.overview(user?.id ?? ""),
    user?.id && initialStats !== undefined ? initialStats : undefined,
  );

  const allTickets = supportTicketsQuery.data ?? initialTickets ?? [];
  const dashboard = dashboardQuery.data ?? null;
  const ticketBreakdown = dashboard?.ticketStatusBreakdown;

  const ticketStats = useMemo(() => {
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let totalMessages = 0;
    for (const t of allTickets) {
      statusCounts[t.status as keyof typeof statusCounts]++;
      priorityCounts[t.priority as keyof typeof priorityCounts]++;
      totalMessages += 1 + (t.replyCount ?? 0);
    }
    return { statusCounts, priorityCounts, totalMessages };
  }, [allTickets]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      queueMicrotask(() => setIsMounted(true));
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const columns = useMemo(
    () =>
      createSupportTicketColumns({
        detailHrefBase: detailHrefBase ?? "/admin/support-tickets",
        productOwners,
        dialogVariant: "violet",
        linkUserManagement: true,
      }),
    [detailHrefBase, productOwners],
  );

  // REQ-0125: dashboard status card unsettled; list-derived priority + table use loading (patched rows visible)
  const statusCardsLoading = isDataSlotUnsettled(dashboardQuery, initialStats);
  const listDerivedLoading = isDataSlotLoading(
    supportTicketsQuery,
    initialTickets,
  );
  const tableDataLoading = listDerivedLoading;

  return (
    <div className="flex flex-col poppins">
      <PageSectionHeader
        as="h2"
        icon={MessageSquare}
        tone="violet"
        title="Store Support Tickets (assigned to you)"
        description="Manage customer support tickets. Create, view, update status and priority, and add internal notes."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 pb-6 items-stretch">
        <StatisticsCard
          title="Support Tickets"
          value={dashboard?.counts?.tickets ?? allTickets.length}
          description="Sent by users, clients & suppliers"
          icon={MessageSquare}
          variant="violet"
          valueLoading={statusCardsLoading}
          badgeValuesLoading={statusCardsLoading}
          badges={[
            {
              label: "Open",
              value: ticketBreakdown?.open ?? ticketStats.statusCounts.open,
            },
            {
              label: "In progress",
              value:
                ticketBreakdown?.in_progress ??
                ticketStats.statusCounts.in_progress,
            },
            {
              label: "Resolved",
              value:
                ticketBreakdown?.resolved ?? ticketStats.statusCounts.resolved,
            },
            {
              label: "Closed",
              value: ticketBreakdown?.closed ?? ticketStats.statusCounts.closed,
            },
          ]}
        />
        <StatisticsCard
          title="Total messages"
          value={ticketStats.totalMessages}
          description="Replies across tickets"
          icon={AlertCircle}
          variant="rose"
          valueLoading={listDerivedLoading}
          badgeValuesLoading={listDerivedLoading}
          badges={[
            { label: "Low", value: ticketStats.priorityCounts.low },
            { label: "Medium", value: ticketStats.priorityCounts.medium },
            { label: "High", value: ticketStats.priorityCounts.high },
            { label: "Urgent", value: ticketStats.priorityCounts.urgent },
          ]}
        />
      </div>

      <div className="pb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <SupportTicketFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
            viewFilter={viewFilter}
            onViewFilterChange={setViewFilter}
            setPagination={setPagination}
          />
        </div>
        {isMounted && (
          <div className="flex-shrink-0">
            <SupportTicketDialog
              productOwners={productOwners}
              variant="violet"
              trigger={
                <Button className="h-10 rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Create Ticket
                </Button>
              }
            />
          </div>
        )}
      </div>

      <SupportTicketTable
        data={allTickets}
        columns={columns}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        selectedStatuses={selectedStatuses}
        selectedPriorities={selectedPriorities}
      />
    </div>
  );
}
