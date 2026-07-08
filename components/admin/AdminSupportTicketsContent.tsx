"use client";

import React from "react";
import SupportTicketList from "./SupportTicketList";
import { PageContentWrapper } from "@/components/shared";
import type { SupportTicket } from "@/types";
import type { ProductOwnerOption } from "@/components/support-tickets/SupportTicketDialog";

export type AdminSupportTicketsContentProps = {
  initialTickets?: SupportTicket[];
  productOwners?: ProductOwnerOption[];
};

/** Admin Support Tickets — REQ-0021 initialData via props (no useLayoutEffect hydrate). */
export default function AdminSupportTicketsContent({
  initialTickets,
  productOwners = [],
}: AdminSupportTicketsContentProps = {}) {
  return (
    <PageContentWrapper>
      <SupportTicketList
        detailHrefBase="/admin/support-tickets"
        productOwners={productOwners}
        initialTickets={initialTickets}
      />
    </PageContentWrapper>
  );
}
