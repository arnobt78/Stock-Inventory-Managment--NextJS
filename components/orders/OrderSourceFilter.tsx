/**
 * Order source/type filter for admin combined Orders view.
 * Options: Client orders, Personal orders, View both, Clear.
 */

import React from "react";
import { ShoppingCart, User, LayoutGrid } from "lucide-react";
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
  CommandItem,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

export type OrderSourceFilterValue = "client" | "personal" | "both";

type OrderSourceDropDownProps = {
  value: OrderSourceFilterValue;
  onChange: (value: OrderSourceFilterValue) => void;
};

const options: {
  value: OrderSourceFilterValue;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "client",
    label: "Client orders",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    value: "personal",
    label: "Personal orders",
    icon: <User className="h-4 w-4" />,
  },
  {
    value: "both",
    label: "View both",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
];

export function OrderSourceDropDown({
  value,
  onChange,
}: OrderSourceDropDownProps) {
  const [open, setOpen] = React.useState(false);

  function getButtonLabel() {
    const o = options.find((opt) => opt.value === value);
    return o ? o.label : "Order type";
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="h-10 rounded-[28px] border border-teal-400/30 dark:border-teal-400/30 bg-gradient-to-r from-teal-500/25 via-teal-500/15 to-teal-500/10 dark:from-teal-500/25 dark:via-teal-500/15 dark:to-teal-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(20,184,166,0.2)] backdrop-blur-sm transition duration-200 hover:border-teal-300/40"
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          {getButtonLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-52 poppins rounded-[28px] border border-teal-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(20,184,166,0.15)]"
        side="bottom"
        align="start"
      >
        <Command className="p-1 bg-transparent">
          <CommandList>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  className="h-10 flex items-center text-gray-700 dark:text-white/80 focus:bg-teal-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white cursor-pointer"
                  value={opt.value}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.icon}
                  <span className="ml-2">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <Separator className="bg-gray-300/50 dark:bg-white/10" />
            <Button
              variant="ghost"
              className="w-full text-[12px] text-gray-700 dark:text-white/80 hover:bg-teal-100 dark:hover:bg-white/10 rounded-none"
              onClick={() => {
                onChange("both");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
