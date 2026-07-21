"use client";

import React from "react";
import SupportTicketList from "./SupportTicketList";
import { PageContentWrapper } from "@/components/shared";
import type {
  SupportTicket,
  DashboardStats,
  ProductOwnerOption,
} from "@/types";

export type AdminSupportTicketsContentProps = {
  initialTickets?: SupportTicket[];
  initialStats?: DashboardStats;
  productOwners?: ProductOwnerOption[];
};

/** Admin Support Tickets — REQ-0021 initialData via props (no useLayoutEffect hydrate). */
export default function AdminSupportTicketsContent({
  initialTickets,
  initialStats,
  productOwners = [],
}: AdminSupportTicketsContentProps = {}) {
  return (
    <PageContentWrapper>
      <SupportTicketList
        detailHrefBase="/admin/support-tickets"
        productOwners={productOwners}
        initialTickets={initialTickets}
        initialStats={initialStats}
      />
    </PageContentWrapper>
  );
}
