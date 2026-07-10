/**
 * History (Import History) List Component
 * List view for admin import history with filters, table, and detail links
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useHistory } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { PageSectionHeader } from "@/components/shared";
import { Upload } from "lucide-react";
import { createHistoryColumns } from "./HistoryTableColumns";
import HistoryFilters from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";
import type { ImportHistoryForPage } from "@/types";

export type HistoryListProps = {
  /** When set (e.g. "/admin/activity-history"), View links use {detailHrefBase}/{id} */
  detailHrefBase?: string;
  /** SSR-passed history for first-render hydration (REQ-0021) */
  initialHistory?: ImportHistoryForPage[];
};

export default function HistoryList({
  detailHrefBase,
  initialHistory,
}: HistoryListProps = {}) {
  const historyQuery = useHistory(initialHistory);

  const allRecords = historyQuery.data ?? initialHistory ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationType>({
    pageIndex: 0,
    pageSize: 8,
  });
  const [selectedImportTypes, setSelectedImportTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const columns = useMemo(
    () => createHistoryColumns(detailHrefBase ?? "/admin/activity-history"),
    [detailHrefBase],
  );

  // REQ-0021: shell-first — only table data slot pulses
  const tableDataLoading = isDataSlotLoading(historyQuery, initialHistory);

  return (
    <div className="flex flex-col poppins">
      <PageSectionHeader
        as="h2"
        icon={Upload}
        tone="blue"
        className="pb-6"
        title="Import History"
        description="Bulk import runs (CSV/Excel). Data appears here when you use Import for products, orders, suppliers, or categories. View details, success/failed rows, and error logs."
      />

      <div className="pb-6 flex justify-start">
        <div className={APP_SHELL_WIDTH_CLASS}>
          <HistoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedImportTypes={selectedImportTypes}
            setSelectedImportTypes={setSelectedImportTypes}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            setPagination={setPagination}
          />
        </div>
      </div>

      <HistoryTable
        data={allRecords}
        columns={columns}
        isLoading={tableDataLoading}
        searchTerm={searchTerm}
        pagination={pagination}
        setPagination={setPagination}
        selectedImportTypes={selectedImportTypes}
        selectedStatuses={selectedStatuses}
      />
    </div>
  );
}
