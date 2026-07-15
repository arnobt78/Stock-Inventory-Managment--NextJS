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
import {
  filterCommandPopoverClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
  READABLE_POPOVER_ITEM_CLASS,
} from "@/lib/ui/popover-readability-styles";
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

/** REQ-0081 — stacked name + email; avatar aligns to dynamic row height. */
function OwnerPickerRow({
  owner,
  avatarSize = 32,
  showEmail = true,
}: {
  owner: ProductOwnerOption;
  avatarSize?: number;
  showEmail?: boolean;
}) {
  const avatar = resolveAvatarSourcesFromSeed(owner.id, owner.image);
  return (
    <span className="flex min-w-0 flex-1 items-stretch gap-2 text-left">
      <span
        className={cn(
          "relative shrink-0 self-stretch aspect-square overflow-hidden rounded-full",
          AVATAR_RING_CLASS,
        )}
        style={{ width: avatarSize, minHeight: avatarSize }}
      >
        <SafeAvatarImage
          src={avatar.src}
          fallbackSrc={avatar.fallbackSrc}
          alt=""
          width={avatarSize}
          height={avatarSize}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center  py-0.5">
        <span className="truncate text-sm text-gray-700 dark:text-white">
          {owner.name}
        </span>
        {showEmail && owner.email ? (
          <span className="truncate text-xs text-muted-foreground dark:text-white/50">
            {owner.email}
          </span>
        ) : null}
      </span>
    </span>
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
          className={cn(
            "h-auto min-h-10 w-full gap-2 py-2 sm:w-auto",
            triggerClassName,
          )}
        >
          {selectedOwner ? (
            <OwnerPickerRow owner={selectedOwner} avatarSize={28} />
          ) : (
            <span>Product Owner</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          "p-0 w-[min(100vw-2rem,320px)]",
          filterCommandPopoverClass("violet"),
          FILTER_COMMAND_INPUT_WRAPPER_CLASS,
        )}
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
                  className={READABLE_POPOVER_ITEM_CLASS}
                >
                  <OwnerPickerRow owner={owner} avatarSize={32} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
