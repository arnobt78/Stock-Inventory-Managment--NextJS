/**
 * Reusable Filter Dropdown Component
 * Generic dropdown component for filtering with checkboxes
 * Used for Categories, Suppliers, Status, and other filter types
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LuGitPullRequestDraft } from "react-icons/lu";
import { FilterCommandCheckboxItem } from "@/lib/ui/filter-command-item";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from "lucide-react";

/**
 * Filter option interface
 */
export interface FilterOption {
  id: string;
  name: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Props for FilterDropdown component
 */
export interface FilterDropdownProps {
  /**
   * Array of selected filter values (IDs or names)
   */
  selectedValues: string[];
  /**
   * Callback to update selected values
   */
  setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>;
  /**
   * Array of filter options to display
   */
  options: FilterOption[];
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  /**
   * Button label text
   */
  label: string;
  /**
   * Icon to display in the button (optional)
   */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  /**
   * Whether to allow multiple selections (default: true)
   */
  multiple?: boolean;
  /**
   * Optional filter function to filter options (e.g., by userId)
   */
  filterOptions?: (options: FilterOption[]) => FilterOption[];
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Optional className for the trigger button (e.g. glassmorphic styling)
   */
  triggerClassName?: string;
}

/**
 * FilterDropdown Component
 * Reusable dropdown component for filtering with checkboxes
 * Supports single and multiple selection modes
 */
export function FilterDropdown({
  selectedValues,
  setSelectedValues,
  options,
  placeholder = "Search...",
  label,
  icon: Icon = LuGitPullRequestDraft,
  multiple = true,
  filterOptions,
  className = "",
  triggerClassName,
}: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false);

  // Filter options if filter function provided
  const filteredOptions = React.useMemo(() => {
    return filterOptions ? filterOptions(options) : options;
  }, [options, filterOptions]);

  /**
   * Handle checkbox change for filter selection
   */
  const handleToggle = React.useCallback(
    (value: string) => {
      if (multiple) {
        setSelectedValues((prev) =>
          prev.includes(value)
            ? prev.filter((item) => item !== value)
            : [...prev, value],
        );
      } else {
        setSelectedValues((prev) => (prev.includes(value) ? [] : [value]));
      }
    },
    [multiple, setSelectedValues],
  );

  /**
   * Clear all selected filters
   */
  const clearFilters = React.useCallback(() => {
    setSelectedValues([]);
  }, [setSelectedValues]);

  return (
    <div className={`flex items-center space-x-4 poppins ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={"secondary"} className={triggerClassName ?? "h-10"}>
            {Icon && <Icon />}
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-56 poppins" side="bottom" align="end">
          <Command className="p-1">
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty className="text-slate-500 text-sm text-center p-5">
                No {label.toLowerCase()} found.
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <FilterCommandCheckboxItem
                    key={option.id}
                    value={option.name}
                    toggleValue={option.id}
                    checked={selectedValues.includes(option.id)}
                    onToggle={handleToggle}
                    className="h-9"
                    checkboxClassName="size-4 rounded-[4px]"
                  >
                    <div className="flex items-center gap-1 p-1 rounded-lg px-2 text-[14px]">
                      {option.name}
                    </div>
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator />
              <Button
                onClick={clearFilters}
                variant={"ghost"}
                className="text-[12px] mb-1"
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
