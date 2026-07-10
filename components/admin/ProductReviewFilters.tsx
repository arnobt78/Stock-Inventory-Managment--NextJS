/**
 * Product Review Filters
 * Search and filter controls for product reviews list
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ReviewStatusDropDown } from "@/components/product-reviews/ReviewStatusFilter";
import { Star } from "lucide-react";
import { DismissibleFilterChips } from "@/components/shared";
import type { FilterChipGroup } from "@/components/shared";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { ReviewStatusBadge } from "@/lib/ui/semantic-badges";
import { FILTER_CHIP_COLLAPSED_CLASS } from "@/lib/ui/filter-chip-styles";

const RATING_OPTIONS = [
  { id: "1", name: "1 star" },
  { id: "2", name: "2 stars" },
  { id: "3", name: "3 stars" },
  { id: "4", name: "4 stars" },
  { id: "5", name: "5 stars" },
];

interface ProductReviewFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedRatings: string[];
  setSelectedRatings: React.Dispatch<React.SetStateAction<string[]>>;
  setPagination?: React.Dispatch<React.SetStateAction<PaginationType>>;
}

export default function ProductReviewFilters({
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  setSelectedStatuses,
  selectedRatings,
  setSelectedRatings,
  setPagination,
}: ProductReviewFiltersProps) {
  const ratingTriggerClass =
    "h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-500/10 dark:from-amber-500/25 dark:via-amber-500/15 dark:to-amber-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(245,158,11,0.2)] backdrop-blur-md transition duration-200 hover:border-amber-300/40 hover:from-amber-500/35 hover:via-amber-500/25 hover:to-amber-500/15 dark:hover:border-amber-300/40 dark:hover:from-amber-500/35 dark:hover:via-amber-500/25 dark:hover:to-amber-500/15";

  const handleResetFilters = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedRatings([]);
    setPagination?.((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setSelectedStatuses, setSelectedRatings, setPagination]);

  const filterChipGroups = useMemo((): FilterChipGroup[] => {
    const ratingLabelById = new Map(
      RATING_OPTIONS.map((o) => [o.id, o.name]),
    );

    return [
      {
        label: "Status",
        values: selectedStatuses,
        onClear: () => setSelectedStatuses([]),
        renderBadge: (value) => (
          <ReviewStatusBadge status={value} size="compact" />
        ),
      },
      {
        label: "Rating",
        values: selectedRatings,
        onClear: () => setSelectedRatings([]),
        renderBadge: (value) => (
          <span className={FILTER_CHIP_COLLAPSED_CLASS}>
            {ratingLabelById.get(value) ?? `${value} stars`}
          </span>
        ),
      },
    ];
  }, [
    selectedStatuses,
    selectedRatings,
    setSelectedStatuses,
    setSelectedRatings,
  ]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
          <Input
            placeholder="Search by product, SKU, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-md border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-white/10"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <ReviewStatusDropDown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
          />
          <FilterDropdown
            selectedValues={selectedRatings}
            setSelectedValues={setSelectedRatings}
            options={RATING_OPTIONS}
            placeholder="Filter by rating..."
            label="Rating"
            icon={Star}
            triggerClassName={ratingTriggerClass}
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
