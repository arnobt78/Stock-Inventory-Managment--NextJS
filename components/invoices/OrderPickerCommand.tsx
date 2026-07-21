"use client";

/**
 * OrderPickerCommand — searchable order picker for InvoiceDialog (REQ-0060).
 *
 * Replaces the plain Select in create mode: a Popover + Command dropdown with
 * type-to-filter (matches the ProductOwnerSelect pattern). Each row shows
 * order # + total + status (+ placer name on the admin combined invoices page)
 * and all of those fields are searchable.
 *
 * REQ-0199 — dark glass Combobox trigger (no outline→white hover); modal Popover
 * + onCloseAutoFocus preventDefault so outside-click does not close-then-reopen.
 */

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
import { Check, ChevronDown } from "lucide-react";
import { DIALOG_COMBOBOX_TRIGGER_CLASS } from "@/components/shared/dialog-form-field";
import { DIALOG_SELECT_CONTENT_CLASS } from "@/components/shared/dialog-edge-scroll";
import { READABLE_POPOVER_CONTENT_CLASS } from "@/lib/ui/popover-readability-styles";
import { AvatarInlineLink } from "@/components/shared/AvatarInlineLink";
import { ClientCompactDateTime } from "@/components/shared/ClientFormatDisplay";
import { OrderStatusBadge, PaymentStatusBadge } from "@/lib/ui/semantic-badges";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const fmt = (v: number) =>
  `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type OrderPickerCommandProps = {
  /** Non-cancelled orders eligible for invoicing */
  orders: (Order & { _source?: string })[];
  selectedOrderId: string;
  onSelect: (orderId: string) => void;
  /** Show placer name per row (admin combined invoices page) */
  showPlacer?: boolean;
  /** id forwarded to the trigger button (label htmlFor) */
  triggerId?: string;
  triggerClassName?: string;
};

export function OrderPickerCommand({
  orders,
  selectedOrderId,
  onSelect,
  showPlacer = false,
  triggerId,
  triggerClassName,
}: OrderPickerCommandProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId],
  );

  const handleSelect = React.useCallback(
    (orderId: string) => {
      onSelect(orderId);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    // REQ-0199 — modal isolates pointer events from parent Dialog (no reopen race)
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={triggerId}
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between",
            DIALOG_COMBOBOX_TRIGGER_CLASS,
            triggerClassName,
          )}
        >
          <span className="truncate">
            {selected
              ? `${selected.orderNumber} - ${fmt(selected.total)} (${selected.status})`
              : "Select an order..."}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      {/* z-[100]: render above the dialog overlay (same as edit-form SelectContent) */}
      <PopoverContent
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "p-0 w-[var(--radix-popover-trigger-width)] rounded-md",
          READABLE_POPOVER_CONTENT_CLASS,
          DIALOG_SELECT_CONTENT_CLASS,
        )}
      >
        <Command className="bg-popover text-popover-foreground">
          <CommandInput
            placeholder="Search order #, customer, total..."
            className="h-11"
          />
          <CommandList className="max-h-[min(60vh,280px)]">
            <CommandEmpty className="text-sm text-center p-5 text-muted-foreground">
              No matching order found.
            </CommandEmpty>
            <CommandGroup>
              {orders.map((order) => {
                const placer = showPlacer
                  ? order.placedByName || order.placedByEmail || null
                  : null;
                const items = order.items ?? [];
                const totalQty = items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                const productNames = items
                  .map((item) =>
                    item.sku ? `${item.productName} (${item.sku})` : item.productName,
                  )
                  .join(", ");
                return (
                  <CommandItem
                    key={order.id}
                    value={`${order.orderNumber} ${placer ?? ""} ${order.total} ${order.status} ${productNames}`}
                    onSelect={() => handleSelect(order.id)}
                    className="cursor-pointer items-start py-2"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate font-medium">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} size="detail" />
                        <PaymentStatusBadge
                          status={order.paymentStatus}
                          size="detail"
                        />
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {fmt(order.total)}
                        </span>
                        <span>
                          {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
                          {totalQty} unit{totalQty === 1 ? "" : "s"}
                        </span>
                        {productNames && (
                          <span className="truncate">{productNames}</span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {placer && (
                          <AvatarInlineLink
                            label={placer}
                            seed={order.placedByUserId ?? order.userId}
                            image={order.placedByImage}
                            size={16}
                            linkClassName="text-xs font-normal text-muted-foreground"
                          />
                        )}
                        <ClientCompactDateTime date={order.createdAt} semantic="created" />
                      </span>
                    </span>
                    {order.id === selectedOrderId && (
                      <Check className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
