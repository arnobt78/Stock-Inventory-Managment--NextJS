/**
 * History (Import History) Filters
 * Search and filter controls for import history list
 */

"use client";

import { FILTER_SEARCH_INPUT_SKY_CLASS } from "@/lib/ui/filter-toolbar-styles";
import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { ImportTypeDropDown } from "./ImportTypeFilter";
import { ImportStatusDropDown } from "./ImportStatusFilter";
import { DismissibleFilterChips } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import {
  ImportStatusBadge,
  ImportTypeBadge,
} from "@/lib/ui/semantic-badges";

interface HistoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedImportTypes: string[];
  setSelectedImportTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
}

export default function HistoryFilters({
  searchTerm,
  setSearchTerm,
  selectedImportTypes,
  setSelectedImportTypes,
  selectedStatuses,
  setSelectedStatuses,
  setPagination,
}: HistoryFiltersProps) {
  const handleResetFilters = useCallback(() => {
    setSelectedImportTypes([]);
    setSelectedStatuses([]);
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedImportTypes, setSelectedStatuses, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    return [
      {
        label: "Type",
        values: selectedImportTypes,
        onClear: () => setSelectedImportTypes([]),
        renderBadge: (value) => (
          <ImportTypeBadge status={value} size="compact" />
        ),
      },
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <ImportStatusBadge status={value} size="compact" />
        ),
      },
    ];
  }, [
    selectedImportTypes,
    selectedStatuses,
    setSelectedImportTypes,
    setSelectedStatuses,
  ]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by file name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={FILTER_SEARCH_INPUT_SKY_CLASS}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-white/10"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <ImportTypeDropDown
            selectedImportTypes={selectedImportTypes}
            setSelectedImportTypes={setSelectedImportTypes}
          />
          <ImportStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
        </div>
      </div>

      <DismissibleFilterChips
        groups={filterChipGroups}
        onReset={handleResetFilters}
      />
    </div>
  );
}
