import { cn } from "@/lib/utils";
import {
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
} from "@/lib/ui/popover-readability-styles";

/**
 * Support Ticket Priority Filter Dropdown
 * Colored glass badges per option (matches PaymentStatusFilter pattern)
 */

import React from "react";
import { AlertCircle } from "lucide-react";
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
import { TicketPriorityBadge } from "@/lib/ui/semantic-badges";
import type { SupportTicketPriority } from "@/types";

type TicketPriorityOption = {
  value: SupportTicketPriority;
  label: string;
};

const ticketPriorities: TicketPriorityOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

type TicketPriorityDropDownProps = {
  selectedPriorities: string[];
  setSelectedPriorities: React.Dispatch<React.SetStateAction<string[]>>;
};

export function TicketPriorityDropDown({
  selectedPriorities,
  setSelectedPriorities,
}: TicketPriorityDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedPriorities((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedPriorities([]);
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30 bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-md transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15 dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Priority
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("p-0 w-48 poppins", filterCommandPopoverClass("sky"), FILTER_COMMAND_INPUT_WRAPPER_CLASS)}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by priority..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {ticketPriorities.map((priority) => (
                  <FilterCommandCheckboxItem
                    key={priority.value}
                    value={priority.label}
                    toggleValue={priority.value}
                    checked={selectedPriorities.includes(priority.value)}
                    onToggle={handleToggle}
                    className="focus:bg-sky-100 dark:focus:bg-white/10"
                    checkboxClassName="focus:ring-sky-500/50"
                  >
                    <TicketPriorityBadge
                      status={priority.value}
                      label={priority.label}
                    />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
              No priority found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-white/10"
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
