"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_CLASS } from "@/lib/ui/avatar-ring-styles";

export type ProductOwnerOption = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type ProductOwnerSelectProps = {
  options: ProductOwnerOption[];
  selectedOwnerId: string;
  onOwnerChange: (ownerId: string) => void;
  triggerClassName?: string;
};

function OwnerAvatar({
  owner,
  size = 24,
  className,
}: {
  owner: ProductOwnerOption;
  size?: number;
  className?: string;
}) {
  const avatar = resolveAvatarSourcesFromSeed(owner.id, owner.image);
  return (
    <SafeAvatarImage
      src={avatar.src}
      fallbackSrc={avatar.fallbackSrc}
      width={size}
      height={size}
      className={cn("rounded-full object-cover shrink-0", AVATAR_RING_CLASS, className)}
      alt=""
    />
  );
}

/**
 * Searchable product-owner picker for client browse.
 * CommandList caps height so large owner lists do not block the main thread.
 */
export function ProductOwnerSelect({
  options,
  selectedOwnerId,
  onOwnerChange,
  triggerClassName,
}: ProductOwnerSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOwner = React.useMemo(
    () => options.find((a) => a.id === selectedOwnerId),
    [options, selectedOwnerId],
  );

  const handleSelect = React.useCallback(
    (ownerId: string) => {
      onOwnerChange(ownerId);
      setOpen(false);
    },
    [onOwnerChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full sm:w-auto gap-2", triggerClassName)}
        >
          {selectedOwner ? (
            <>
              <OwnerAvatar owner={selectedOwner} size={24} className="h-6 w-6" />
              <span className="truncate">{selectedOwner.name}</span>
            </>
          ) : (
            <span>Product Owner</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-0 w-[min(100vw-2rem,320px)] rounded-[28px] border border-violet-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search product owner..."
            className="bg-transparent border-0 focus:ring-0 text-gray-700 dark:text-white/80 placeholder:text-gray-500 dark:placeholder:text-white/40"
          />
          <CommandList className="max-h-[min(60vh,280px)]">
            <CommandEmpty className="text-gray-600 dark:text-white/60 text-sm text-center p-5">
              No product owner found.
            </CommandEmpty>
            <CommandGroup>
              {options.map((owner) => (
                <CommandItem
                  key={owner.id}
                  value={`${owner.name} ${owner.email}`}
                  onSelect={() => handleSelect(owner.id)}
                  className="cursor-pointer text-gray-700 dark:text-white/80 focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white gap-2"
                >
                  <OwnerAvatar owner={owner} size={20} className="h-5 w-5" />
                  <span className="truncate">
                    {owner.name} ({owner.email})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
