"use client";

import React from "react";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

export type AdminCombinedInvoicesContentProps = {
  initialInvoices?: InvoiceForPage[];
};

/**
 * Admin combined Invoices — personal + client invoices with Invoice type filter.
 * Single Invoices page under My Store; detail links go to /admin/invoices/[id].
 */
export default function AdminCombinedInvoicesContent({
  initialInvoices,
}: AdminCombinedInvoicesContentProps = {}) {
  return (
    <PageContentWrapper>
      <InvoiceList
        dataSource="adminCombined"
        detailHrefBase="/admin/invoices"
        initialInvoices={initialInvoices}
      />
      <FloatingActionButtons variant="invoices" />
    </PageContentWrapper>
  );
}
