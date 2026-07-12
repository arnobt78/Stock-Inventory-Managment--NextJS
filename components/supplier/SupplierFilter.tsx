"use client";

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
import { Truck } from "lucide-react";
import { FilterCommandCheckboxItem } from "@/lib/ui/filter-command-item";
import { Separator } from "@/components/ui/separator";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";
import { cn } from "@/lib/utils";
import { useSuppliers } from "@/hooks/queries";

type SupplierFilterRow = {
  id: string;
  name: string;
  image?: string | null;
};

/** REQ-0079 — robohash avatar beside supplier name in filter dropdown */
function SupplierFilterAvatar({
  id,
  image,
  size = 20,
}: {
  id: string;
  image?: string | null;
  size?: number;
}) {
  const avatar = resolveAvatarSourcesFromSeed(id, image ?? null);
  return (
    <SafeAvatarImage
      src={avatar.src}
      fallbackSrc={avatar.fallbackSrc}
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover shrink-0",
        AVATAR_RING_CLASS,
        size === 20 ? "h-5 w-5" : undefined,
      )}
      alt=""
    />
  );
}

type SuppliersDropDownProps = {
  selectedSuppliers: string[];
  setSelectedSuppliers: React.Dispatch<React.SetStateAction<string[]>>;
  /** When provided (e.g. client browse mode), use these instead of fetching */
  suppliersOverride?: SupplierFilterRow[];
};

export function SuppliersDropDown({
  selectedSuppliers,
  setSelectedSuppliers,
  suppliersOverride,
}: SuppliersDropDownProps) {
  const [open, setOpen] = React.useState(false);
  const { data: suppliersFromHook = [] } = useSuppliers(undefined, {
    enabled: suppliersOverride == null,
  });
  const suppliers = suppliersOverride ?? suppliersFromHook;

  function handleToggle(value: string) {
    setSelectedSuppliers((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value],
    );
  }

  function clearFilters() {
    setSelectedSuppliers([]);
  }

  return (
    <div className="flex items-center poppins w-full sm:w-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"secondary"}
            className="h-10 w-full sm:w-auto rounded-[28px] border border-emerald-400/30 dark:border-emerald-400/30 bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-emerald-500/10 dark:from-emerald-500/25 dark:via-emerald-500/15 dark:to-emerald-500/10 text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] backdrop-blur-md transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/35 hover:via-emerald-500/25 hover:to-emerald-500/15 dark:hover:border-emerald-300/40 dark:hover:from-emerald-500/35 dark:hover:via-emerald-500/25 dark:hover:to-emerald-500/15"
          >
            <Truck className="h-4 w-4 mr-1" aria-hidden />
            Suppliers
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-56 poppins rounded-[28px] border border-emerald-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md shadow-[0_10px_30px_rgba(16,185,129,0.15)] [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-gray-300/50 [&_[cmdk-input-wrapper]]:dark:border-white/10 [&_[cmdk-input-wrapper]]:bg-white/10 [&_[cmdk-input-wrapper]]:dark:bg-white/5 [&_[cmdk-input-wrapper]]:backdrop-blur-md"
          side="bottom"
          align="end"
        >
          <Command className="p-1 bg-transparent">
            <CommandInput
              placeholder="Supplier"
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
            <CommandList>
              <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
                No supplier found.
              </CommandEmpty>
              <CommandGroup>
                {suppliers.map((supplier) => (
                  <FilterCommandCheckboxItem
                    key={supplier.id}
                    value={supplier.name}
                    toggleValue={supplier.id}
                    checked={selectedSuppliers.includes(supplier.id)}
                    onToggle={handleToggle}
                    className="h-9 focus:bg-emerald-100 dark:focus:bg-white/10"
                    checkboxClassName="focus:ring-emerald-500/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 px-2 text-sm">
                      <SupplierFilterAvatar
                        id={supplier.id}
                        image={
                          "image" in supplier ? supplier.image : undefined
                        }
                        size={20}
                      />
                      <span className="truncate">{supplier.name}</span>
                    </div>
                  </FilterCommandCheckboxItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="flex flex-col gap-2 text-[23px]">
              <Separator className="bg-gray-300/50 dark:bg-white/10" />
              <Button
                onClick={clearFilters}
                variant={"ghost"}
                className="text-[12px] mb-1 text-gray-700 dark:text-white/80 hover:text-gray-700 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-white/10"
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
