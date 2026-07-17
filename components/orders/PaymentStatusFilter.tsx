import { cn } from "@/lib/utils";
import {
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
} from "@/lib/ui/popover-readability-styles";

/**
 * Payment Status Filter Dropdown Component
 * Reusable dropdown for filtering orders by payment status (matching Product StatusDropDown style)
 */

import React from "react";
import { CreditCard } from "lucide-react";
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
import { PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import type { PaymentStatus } from "@/types";

type PaymentStatusOption = {
  value: PaymentStatus;
  label: string;
};

const paymentStatuses: PaymentStatusOption[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
];

type PaymentStatusDropDownProps = {
  selectedPaymentStatuses: string[];
  setSelectedPaymentStatuses: React.Dispatch<React.SetStateAction<string[]>>;
};

export function PaymentStatusDropDown({
  selectedPaymentStatuses,
  setSelectedPaymentStatuses,
}: PaymentStatusDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function handleToggle(value: string) {
    setSelectedPaymentStatuses((prev) =>
      prev.includes(value)
        ? prev.filter((status) => status !== value)
        : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedPaymentStatuses([]);
  }

  return (
    <div className="flex items-center space-x-4 poppins">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-10 rounded-[28px] border border-amber-400/30 dark:border-amber-400/30 bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-amber-500/5 dark:from-amber-500/30 dark:via-amber-500/15 dark:to-amber-500/5 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(245,158,11,0.2)] backdrop-blur-md transition duration-200 hover:border-amber-300/60 hover:from-amber-500/35 hover:via-amber-500/25 hover:to-amber-500/15 dark:hover:border-amber-300/60 dark:hover:from-amber-500/35 dark:hover:via-amber-500/25 dark:hover:to-amber-500/15"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Payment
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "p-0 w-48 poppins",
            filterCommandPopoverClass("amber"),
            FILTER_COMMAND_INPUT_WRAPPER_CLASS,
          )}
          side="bottom"
          align="center"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Filter by payment..."
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandGroup>
                {paymentStatuses.map((status) => (
                  <FilterCommandCheckboxItem
                    key={status.value}
                    value={status.label}
                    toggleValue={status.value}
                    checked={selectedPaymentStatuses.includes(status.value)}
                    onToggle={handleToggle}
                    className="focus:bg-amber-100 dark:focus:bg-white/10"
                    checkboxClassName="focus:ring-amber-500/50"
                  >
                    <PaymentStatusBadge
                      status={status.value}
                      label={status.label}
                    />
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandEmpty className="text-gray-600 dark:text-white/80 text-sm text-center p-5">
              No payment status found.
            </CommandEmpty>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                variant="ghost"
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-white/10"
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
