"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { useSupportTickets } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { MessageSquare, MessageCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/types";
import SupportTicketDialog, {
  type ProductOwnerOption,
} from "./SupportTicketDialog";
import { Button } from "@/components/ui/button";
import SupportTicketFilters from "@/components/admin/SupportTicketFilters";
import { SupportTicketTable } from "@/components/admin/SupportTicketTable";
import { createSupportTicketColumns } from "@/components/admin/SupportTicketTableColumns";
import { StatisticsCard } from "@/components/home/StatisticsCard";

export type SupportTicketsPageContentProps = {
  initialTickets: SupportTicket[];
  productOwners: ProductOwnerOption[];
};

export default function SupportTicketsPageContent({
  initialTickets,
  productOwners,
}: SupportTicketsPageContentProps) {
  const ticketsQuery = useSupportTickets("all", initialTickets);
  const list = ticketsQuery.data ?? initialTickets ?? [];

  const ticketStats = useMemo(() => {
    if (list.length === 0) {
      return {
        statusCounts: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
        priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
        totalMessages: 0,
      };
    }
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let totalMessages = 0;
    for (const t of list) {
      statusCounts[t.status as keyof typeof statusCounts]++;
      priorityCounts[t.priority as keyof typeof priorityCounts]++;
      totalMessages += 1 + (t.replyCount ?? 0);
    }
    return { statusCounts, priorityCounts, totalMessages };
  }, [list]);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  const columns = useMemo(
    () => createSupportTicketColumns("/support-tickets"),
    [],
  );

  // REQ-0021: shell-first — only data slots pulse
  const cardsLoading = isDataSlotLoading(ticketsQuery, initialTickets);
  const tableDataLoading = isDataSlotLoading(ticketsQuery, initialTickets);

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="flex flex-col poppins">
          <div className="pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white flex items-center gap-2">
                <div
                  className={cn(
                    "p-2 rounded-xl border",
                    "border-sky-300/30 bg-sky-100/50 dark:border-sky-400/30 dark:bg-sky-500/20",
                  )}
                >
                  <MessageSquare className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                Your Support Tickets
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Open and track tickets you&apos;ve sent. Create a ticket to get
                help from a product owner.
              </p>
            </div>
            <div className="flex-shrink-0">
              <SupportTicketDialog
                productOwners={productOwners}
                variant="sky"
                trigger={
                  <Button
                    className={cn(
                      "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
                      "bg-gradient-to-r from-sky-500/50 via-sky-500/40 to-sky-500/30 dark:from-sky-500/50 dark:via-sky-500/40 dark:to-sky-500/30",
                      "text-white shadow-[0_10px_30px_rgba(2,132,199,0.3)] backdrop-blur-md",
                      "hover:border-sky-300/50 hover:from-sky-500/60 hover:via-sky-500/50 hover:to-sky-500/40",
                      "gap-2",
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    Create Ticket
                  </Button>
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch pb-6">
            <StatisticsCard
              title="Support Tickets"
              value={list.length}
              description="Sent by you"
              icon={MessageSquare}
              variant="sky"
              valueLoading={cardsLoading}
              badgeValuesLoading={cardsLoading}
              badges={[
                { label: "Open", value: ticketStats.statusCounts.open },
                {
                  label: "In progress",
                  value: ticketStats.statusCounts.in_progress,
                },
                {
                  label: "Resolved",
                  value: ticketStats.statusCounts.resolved,
                },
                {
                  label: "Closed",
                  value: ticketStats.statusCounts.closed,
                },
                {
                  label: "Total messages",
                  value: ticketStats.totalMessages,
                },
              ]}
            />
            <StatisticsCard
              title="Total messages"
              value={ticketStats.totalMessages}
              description="Replies across tickets"
              icon={MessageCircle}
              variant="violet"
              valueLoading={cardsLoading}
              badgeValuesLoading={cardsLoading}
              badges={[
                {
                  label: "Low",
                  value: ticketStats.priorityCounts.low,
                },
                {
                  label: "Medium",
                  value: ticketStats.priorityCounts.medium,
                },
                {
                  label: "High",
                  value: ticketStats.priorityCounts.high,
                },
                {
                  label: "Urgent",
                  value: ticketStats.priorityCounts.urgent,
                },
              ]}
            />
          </div>

          <div className="pb-6 flex justify-center">
            <div className={APP_SHELL_WIDTH_CLASS}>
              <SupportTicketFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                selectedPriorities={selectedPriorities}
                setSelectedPriorities={setSelectedPriorities}
              />
            </div>
          </div>

          <SupportTicketTable
            data={list}
            columns={columns}
            isLoading={tableDataLoading}
            searchTerm={searchTerm}
            pagination={pagination}
            setPagination={setPagination}
            selectedStatuses={selectedStatuses}
            selectedPriorities={selectedPriorities}
          />
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
