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
import type { DashboardStats, ClientPortalDashboard } from "@/types";

export type InvoicesPageProps = {
  initialInvoices?: InvoiceForPage[];
  /** SSR dashboard stats for admin/user /invoices cards (REQ-0025) */
  initialStats?: DashboardStats;
  /** SSR client portal for client /invoices cards */
  initialClientPortal?: ClientPortalDashboard;
};

/**
 * Invoices page client component.
 * REQ-0021 — shell-first; SSR initialData passed to InvoiceList.
 */
export default function InvoicesPage({
  initialInvoices,
  initialStats,
  initialClientPortal,
}: InvoicesPageProps = {}) {
  return (
    <Navbar>
      <PageContentWrapper>
        <InvoiceList
          initialInvoices={initialInvoices}
          initialStats={initialStats}
          initialClientPortal={initialClientPortal}
        />
        <FloatingActionButtons variant="invoices" />
      </PageContentWrapper>
    </Navbar>
  );
}
