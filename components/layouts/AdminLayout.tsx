"use client";

import React, { type ReactNode } from "react";
import Navbar from "@/components/layouts/Navbar";
import PageWithSidebar from "@/components/layouts/PageWithSidebar";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { PageContentWrapper } from "@/components/shared";

import type { AdminCounts } from "@/types";

/**
 * Admin layout: Navbar + left AdminSidebar + scrollable content.
 * initialCounts from app/admin/layout.tsx SSR (REQ-0025).
 */
export default function AdminLayout({
  children,
  initialCounts,
}: {
  children: ReactNode;
  initialCounts?: AdminCounts;
}) {
  return (
    <Navbar>
      <PageWithSidebar
        sidebarContent={<AdminSidebar initialCounts={initialCounts} />}
        sidebarCollapsed={<AdminSidebar collapsed initialCounts={initialCounts} />}
      >
        <div className="min-w-0 flex-1 px-1 sm:px-0">{children}</div>
      </PageWithSidebar>
    </Navbar>
  );
}
