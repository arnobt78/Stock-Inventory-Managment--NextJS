"use client";

import React from "react";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

export type AdminClientInvoicesContentProps = {
  initialInvoices?: InvoiceForPage[];
};

/**
 * Admin Client Invoices — invoices for orders that contain products owned by the current user.
 * Reuses InvoiceList with dataSource="clientInvoices"; detail links go to /admin/client-invoices/[id].
 */
export default function AdminClientInvoicesContent({
  initialInvoices,
}: AdminClientInvoicesContentProps = {}) {
  return (
    <PageContentWrapper>
      <InvoiceList
        dataSource="clientInvoices"
        initialInvoices={initialInvoices}
      />
    </PageContentWrapper>
  );
}
