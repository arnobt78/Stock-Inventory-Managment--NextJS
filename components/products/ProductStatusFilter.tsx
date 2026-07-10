/**
 * Product Status Filter Dropdown — REQ-0037 glass badges (closes REQ-0028 AC7 gap).
 * Rows use ProductStockStatusBadge — same component as table/detail columns.
 */

import React from "react";
import { Package } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { FilterCommandCheckboxItem } from "@/lib/ui/filter-command-item";
import { ProductStockStatusBadge } from "@/lib/ui/semantic-badges";
import type { ProductStatus } from "@/types";

type ProductStatusOption = {
  value: ProductStatus;
  label: string;
};

const productStatuses: ProductStatusOption[] = [
  { value: "Available", label: "Available" },
  { value: "Stock Low", label: "Stock Low" },
  { value: "Stock Out", label: "Stock Out" },
];

type StatusDropDownProps = {
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
};

export function StatusDropDown({
  selectedStatuses,
  setSelectedStatuses,
}: StatusDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedStatuses((prev) =>
      prev.includes(value)
        ? prev.filter((status) => status !== value)
        : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedStatuses([]);
  }

  return (
    <div className="flex items-center poppins w-full sm:w-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 w-full sm:w-auto rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:from-rose-500/35 hover:via-rose-500/25 hover:to-rose-500/15 dark:hover:border-rose-300/40 dark:hover:from-rose-500/35 dark:hover:via-rose-500/25 dark:hover:to-rose-500/15"
          >
            <Package className="h-4 w-4 mr-1" />
            Status
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-48 poppins rounded-[28px] border border-rose-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(225,29,72,0.15)] [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-gray-300/50 [&_[cmdk-input-wrapper]]:dark:border-white/10 [&_[cmdk-input-wrapper]]:bg-white/10 [&_[cmdk-input-wrapper]]:dark:bg-white/5 [&_[cmdk-input-wrapper]]:backdrop-blur-md"
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by status..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {productStatuses.map((status) => (
                  <FilterCommandCheckboxItem
                    key={status.value}
                    value={status.label}
                    toggleValue={status.value}
                    checked={selectedStatuses.includes(status.value)}
                    onToggle={handleToggle}
                  >
                    <ProductStockStatusBadge
                      status={status.value}
                      label={status.label}
                    />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
              No status found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-rose-100 dark:hover:bg-white/10"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
