"use client";

import React from "react";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { InvoiceForPage } from "@/lib/server/invoices-data";
import type { DashboardStats } from "@/types";

export type AdminCombinedInvoicesContentProps = {
  initialInvoices?: InvoiceForPage[];
  initialClientInvoices?: InvoiceForPage[];
  initialStats?: DashboardStats | null;
};

/** Admin combined Invoices — personal + client invoices (REQ-0025 SSR). */
export default function AdminCombinedInvoicesContent({
  initialInvoices,
  initialClientInvoices,
  initialStats,
}: AdminCombinedInvoicesContentProps = {}) {
  return (
    <PageContentWrapper>
      <InvoiceList
        dataSource="adminCombined"
        detailHrefBase="/admin/invoices"
        initialInvoices={initialInvoices}
        initialClientInvoices={initialClientInvoices}
        initialStats={initialStats}
      />
      <FloatingActionButtons variant="invoices" />
    </PageContentWrapper>
  );
}
