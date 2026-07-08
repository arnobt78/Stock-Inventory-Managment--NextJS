/**
 * Support Ticket Filters
 * Search and filter controls for support tickets list
 */

"use client";

import React from "react";
import { DeferredSelectGate } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import type { SupportTicketViewFilter } from "@/hooks/queries/use-support-tickets";

const STATUS_OPTIONS = [
  { id: "open", name: "Open" },
  { id: "in_progress", name: "In Progress" },
  { id: "resolved", name: "Resolved" },
  { id: "closed", name: "Closed" },
];

const PRIORITY_OPTIONS = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "urgent", name: "Urgent" },
];

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
}: SupportTicketFiltersProps) {
  const statusTriggerClass =
    "h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-sm transition duration-200 hover:border-rose-300/40 hover:from-rose-500/35 hover:via-rose-500/25 hover:to-rose-500/15 dark:hover:border-rose-300/40 dark:hover:from-rose-500/35 dark:hover:via-rose-500/25 dark:hover:to-rose-500/15";
  const priorityTriggerClass =
    "h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-sm transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="relative flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
        <Input
          placeholder="Search by subject or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm"
          >
            <IoClose className="h-4 w-4 text-gray-700 dark:text-white/60" />
          </Button>
        )}
      </div>
      {onViewFilterChange && (
        <DeferredSelectGate
          placeholder={
            <div
              className="h-10 w-[180px] rounded-[28px] border border-violet-400/30 bg-white/10 dark:bg-white/5 text-gray-700 dark:text-white flex items-center justify-between px-3 py-2"
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
        <FilterDropdown
          selectedValues={selectedStatuses}
          setSelectedValues={setSelectedStatuses}
          options={STATUS_OPTIONS}
          placeholder="Filter by status..."
          label="Status"
          icon={MessageSquare}
          triggerClassName={statusTriggerClass}
        />
        <FilterDropdown
          selectedValues={selectedPriorities}
          setSelectedValues={setSelectedPriorities}
          options={PRIORITY_OPTIONS}
          placeholder="Filter by priority..."
          label="Priority"
          triggerClassName={priorityTriggerClass}
        />
      </div>
    </div>
  );
}
