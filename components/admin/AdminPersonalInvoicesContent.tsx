"use client";

import React from "react";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

export type AdminPersonalInvoicesContentProps = {
  initialInvoices?: InvoiceForPage[];
};

/** Admin Personal Invoices — REQ-0021 initialData via props. */
export default function AdminPersonalInvoicesContent({
  initialInvoices,
}: AdminPersonalInvoicesContentProps = {}) {
  return (
    <PageContentWrapper>
      <InvoiceList
        detailHrefBase="/admin/personal-invoices"
        initialInvoices={initialInvoices}
      />
      <FloatingActionButtons variant="invoices" />
    </PageContentWrapper>
  );
}
