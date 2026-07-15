"use client";

import React from "react";
import UserManagementList from "./UserManagementList";
import { PageContentWrapper } from "@/components/shared";
import type { UserForAdmin, DashboardStats } from "@/types";

export type AdminUserManagementContentProps = {
  initialUsers?: UserForAdmin[];
  initialStats?: DashboardStats;
};

/** Admin User Management — REQ-0021 initialData passed to list hook via props. */
export default function AdminUserManagementContent({
  initialUsers,
  initialStats,
}: AdminUserManagementContentProps = {}) {
  return (
    <PageContentWrapper>
      <UserManagementList
        detailHrefBase="/admin/user-management"
        initialUsers={initialUsers}
        initialStats={initialStats}
      />
    </PageContentWrapper>
  );
}
