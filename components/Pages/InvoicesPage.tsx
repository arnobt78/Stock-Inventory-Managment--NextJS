/**
 * Invoices Page
 * Dedicated page for invoice management
 */

"use client";

import React from "react";
import Navbar from "@/components/layouts/Navbar";
import InvoiceList from "@/components/invoices/InvoiceList";
import { PageContentWrapper } from "@/components/shared";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { InvoiceForPage } from "@/lib/server/invoices-data";

export type InvoicesPageProps = {
  initialInvoices?: InvoiceForPage[];
};

/**
 * Invoices page client component.
 * REQ-0021 — shell-first; SSR initialData passed to InvoiceList.
 */
export default function InvoicesPage({
  initialInvoices,
}: InvoicesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <InvoiceList initialInvoices={initialInvoices} />
        <FloatingActionButtons variant="invoices" />
      </PageContentWrapper>
    </Navbar>
  );
}
