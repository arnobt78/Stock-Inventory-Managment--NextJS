import { cn } from "@/lib/utils";
import {
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
} from "@/lib/ui/popover-readability-styles";

/**
 * Import History Type Filter Dropdown
 * Colored glass badges per import type
 */

import React from "react";
import { History } from "lucide-react";
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
import { ImportTypeBadge } from "@/lib/ui/semantic-badges";
import type { ImportHistoryType } from "@/types";

const importTypes: { value: ImportHistoryType; label: string }[] = [
  { value: "products", label: "Products" },
  { value: "orders", label: "Orders" },
  { value: "suppliers", label: "Suppliers" },
  { value: "categories", label: "Categories" },
];

type ImportTypeDropDownProps = {
  selectedImportTypes: string[];
  setSelectedImportTypes: React.Dispatch<React.SetStateAction<string[]>>;
};

export function ImportTypeDropDown({
  selectedImportTypes,
  setSelectedImportTypes,
}: ImportTypeDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedImportTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedImportTypes([]);
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-md transition duration-200 hover:border-rose-300/40 hover:from-rose-500/35 hover:via-rose-500/25 hover:to-rose-500/15 dark:hover:border-rose-300/40 dark:hover:from-rose-500/35 dark:hover:via-rose-500/25 dark:hover:to-rose-500/15"
          >
            <History className="h-4 w-4 mr-1" />
            Import Type
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("p-0 w-52 poppins", filterCommandPopoverClass("rose"), FILTER_COMMAND_INPUT_WRAPPER_CLASS)}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by type..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {importTypes.map((type) => (
                  <FilterCommandCheckboxItem
                    key={type.value}
                    value={type.label}
                    toggleValue={type.value}
                    checked={selectedImportTypes.includes(type.value)}
                    onToggle={handleToggle}
                  >
                    <ImportTypeBadge status={type.value} label={type.label} />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
              No type found.
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
