/**
 * Support Ticket Filters
 * Search and filter controls for support tickets list
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { DeferredSelectGate, DismissibleFilterChips } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { TicketStatusDropDown } from "@/components/support-tickets/TicketStatusFilter";
import { TicketPriorityDropDown } from "@/components/support-tickets/TicketPriorityFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import type { SupportTicketViewFilter } from "@/hooks/queries/use-support-tickets";
import { PaginationType } from "@/components/shared/PaginationSelector";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";

const VIEW_OPTIONS: { value: SupportTicketViewFilter; label: string }[] = [
  { value: "all", label: "All tickets" },
  { value: "assigned_to_me", label: "Assigned to me" },
  { value: "created_by_me", label: "Created by me" },
];

interface SupportTicketFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPriorities: string[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>;
  viewFilter?: SupportTicketViewFilter;
  onViewFilterChange?: (view: SupportTicketViewFilter) => void;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
}

export default function SupportTicketFilters({
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  setSelectedStatuses,
  selectedPriorities,
  setSelectedPriorities,
  viewFilter = "all",
  onViewFilterChange,
  setPagination,
}: SupportTicketFiltersProps) {
  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    onViewFilterChange?.("all");
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [
    setSelectedStatuses,
    setSelectedPriorities,
    onViewFilterChange,
    setPagination,
  ]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const groups: FilterChipGroup[] = [];

    if (onViewFilterChange && viewFilter !== "all") {
      const viewLabel =
        VIEW_OPTIONS.find((o) => o.value === viewFilter)?.label ?? viewFilter;
      groups.push({
        label: "View",
        values: [viewFilter],
        onClear: () => onViewFilterChange("all"),
        renderBadge: () => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>{viewLabel}</span>
        ),
      });
    }

    groups.push(
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <TicketStatusBadge status={value} size="compact" />
        ),
      },
      {
        label: "Priority",
        values: selectedPriorities,
        onClear: () => setSelectedPriorities([]),
        renderBadge: (value) => (
          <TicketPriorityBadge status={value} size="compact" />
        ),
      },
    );

    return groups;
  }, [
    onViewFilterChange,
    viewFilter,
    selectedStatuses,
    selectedPriorities,
    setSelectedStatuses,
    setSelectedPriorities,
  ]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by subject or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-md border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-md"
            >
              <IoClose className="h-4 w-4 text-gray-700 dark:text-white/60" />
            </Button>
          )}
        </div>
        {onViewFilterChange && (
          <DeferredSelectGate
            placeholder={
              <div
                className="h-10 w-[180px] rounded-[28px] border border-violet-400/30 bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white flex items-center justify-between px-2 py-2"
                aria-hidden
              >
                <span>
                  {VIEW_OPTIONS.find((o) => o.value === viewFilter)?.label ??
                    "View"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </div>
            }
          >
            {({ selectRemountKey }) => (
              <Select
                key={selectRemountKey}
                value={viewFilter}
                onValueChange={(v) =>
                  onViewFilterChange(v as SupportTicketViewFilter)
                }
              >
                <SelectTrigger className="h-10 w-[180px] rounded-[28px] border border-violet-400/30 dark:border-violet-400/30 bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-violet-400/20">
                  {VIEW_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </DeferredSelectGate>
        )}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <TicketStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
          <TicketPriorityDropDown
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
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
