"use client";

/**
 * Shipping Management — generate Shippo label or add manual tracking.
 * REQ-0208 polish — edge-scroll shell (button glow not clipped), label icons,
 * order line densify (thumb / category / supplier / qty / parties).
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  useGenerateShippingLabel,
  useAddTrackingNumber,
} from "@/hooks/queries";
import {
  DeferredSelectGate,
  DIALOG_FORM_FIELD_EMERALD,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  CopyableText,
  DialogFormLabel,
  ProductLineItemsList,
} from "@/components/shared";
import {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
} from "@/components/shared/dialog-edge-scroll";
import {
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_PRIMARY_BUTTON,
} from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
import {
  Truck,
  Package,
  Loader2,
  Tag,
  CheckCircle,
  AlertTriangle,
  Hash,
} from "lucide-react";
import type { Order, ShippingCarrier } from "@/types";
import { OrderPartiesCard } from "@/components/orders/detail/OrderPartiesCard";
import { OrderShippingAddressCard } from "@/components/orders/detail/OrderShippingAddressCard";

interface ShippingManagementProps {
  order: Order;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

const CARRIERS: { value: ShippingCarrier; label: string }[] = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
];

export default function ShippingManagement({
  order,
  disabled,
  trigger,
}: ShippingManagementProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"auto" | "manual">("auto");

  const [carrier, setCarrier] = useState<ShippingCarrier>("usps");
  const [manualTrackingNumber, setManualTrackingNumber] = useState("");
  const [manualCarrier, setManualCarrier] = useState<ShippingCarrier>("usps");

  const generateLabelMutation = useGenerateShippingLabel();
  const addTrackingMutation = useAddTrackingNumber();

  const hasTrackingInfo = order.trackingNumber;

  const handleGenerateLabel = () => {
    generateLabelMutation.mutate(
      {
        orderId: order.id,
        carrier,
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  };

  const handleAddTracking = () => {
    if (!manualTrackingNumber.trim()) return;

    addTrackingMutation.mutate(
      {
        orderId: order.id,
        trackingNumber: manualTrackingNumber.trim(),
        trackingCarrier: manualCarrier,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setManualTrackingNumber("");
        },
      },
    );
  };

  const isLoading =
    generateLabelMutation.isPending || addTrackingMutation.isPending;

  if (hasTrackingInfo) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-muted-foreground">
          Tracking:{" "}
          {order.trackingNumber ? (
            <CopyableText value={order.trackingNumber} className="inline">
              {order.trackingNumber}
            </CopyableText>
          ) : null}
        </span>
        <Badge variant="secondary" className="text-xs">
          {order.trackingCarrier?.toUpperCase() || "Unknown"}
        </Badge>
      </div>
    );
  }

  if (order.status === "cancelled") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            disabled={disabled || isLoading}
            className="gap-2"
          >
            <Truck className="h-4 w-4" />
            {order.paymentStatus === "paid" ? "Ship Order" : "Add Shipping"}
          </Button>
        )}
      </DialogTrigger>
      {/* overflow-visible shell — glass button glow must not clip (REQ-0208) */}
      <DialogContent
        className={cn(
          DIALOG_EDGE_SCROLL_SHELL,
          "overflow-visible border-emerald-400/30 dark:border-emerald-400/30",
          "shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]",
          "poppins sm:max-w-2xl",
        )}
      >
        <DialogHeader className={DIALOG_EDGE_SCROLL_HEADER}>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            Shipping Management
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Generate a shipping label or add a tracking number for order{" "}
            <CopyableText
              value={order.orderNumber}
              className="font-mono font-medium text-white inline"
            >
              {order.orderNumber}
            </CopyableText>
          </DialogDescription>
        </DialogHeader>

        <div className={cn(DIALOG_EDGE_SCROLL_BODY, "overflow-y-auto overflow-x-visible")}>
          <div className={cn(DIALOG_EDGE_SCROLL_INNER, "gap-4")}>
            {/* Order context densify */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-3">
              <p className="text-xs font-medium text-white/80">Order items</p>
              <ProductLineItemsList
                items={order.items ?? []}
                linkMode="none"
                warehouseLinkMode="none"
                order={order}
                orderSubtotal={order.subtotal}
                orderTotal={order.total}
                emptyMessage="No line items"
              />
            </div>
            {/* REQ-0210 — stack parties + address so Auto/Manual tabs stay above fold */}
            <div className="flex flex-col gap-2 min-w-0">
              <OrderPartiesCard order={order} dataLoading={false} />
              <OrderShippingAddressCard order={order} dataLoading={false} />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "auto" | "manual")}
              className="flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 rounded-lg bg-white/30 dark:bg-white/10 text-white shrink-0 border border-emerald-400/30 dark:border-white/20 shadow-[0_10px_30px_rgba(16,185,129,0.15)]">
                <TabsTrigger
                  value="auto"
                  className="h-9 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-emerald-400 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/50 data-[state=active]:bg-background data-[state=active]:text-slate-700 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/20"
                >
                  <Truck className="h-4 w-4" />
                  Auto Generate
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="h-9 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-emerald-400 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/50 data-[state=active]:bg-background data-[state=active]:text-slate-700 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/20"
                >
                  <Tag className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="auto"
                className="space-y-4 mt-4 data-[state=inactive]:hidden"
              >
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {/* REQ-0211 — test keys use sandbox US addresses; UI still shows order ship-to */}
                      Generates a Shippo label and sets status to
                      &quot;shipped&quot;. With a test API key, label purchase
                      uses sandbox US addresses (USPS); the order still shows
                      the customer shipping address above. Confirm or collect
                      payment first.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <DialogFormLabel icon={Truck} htmlFor="carrier">
                    Carrier
                  </DialogFormLabel>
                  <DeferredSelectGate
                    enabled={open}
                    placeholder={
                      <div
                        className={cn(
                          "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                          DIALOG_FORM_FIELD_EMERALD,
                        )}
                        aria-hidden
                      >
                        {CARRIERS.find((c) => c.value === carrier)?.label ??
                          "Select carrier"}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={carrier}
                        onValueChange={(v) => setCarrier(v as ShippingCarrier)}
                      >
                        <SelectTrigger
                          id="carrier"
                          className={cn(
                            "h-11 w-full",
                            DIALOG_FORM_FIELD_EMERALD,
                          )}
                        >
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(DIALOG_SELECT_CONTENT_CLASS)}
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {CARRIERS.map((c) => (
                            <SelectItem
                              key={c.value}
                              value={c.value}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                </div>

                <div className="flex justify-end pt-1 overflow-visible">
                  <Button
                    variant="ghost"
                    onClick={handleGenerateLabel}
                    disabled={isLoading}
                    className={cn(
                      "group w-full sm:w-auto px-8",
                      GLASS_BUTTON_ICON_HOVER,
                      GLASS_BUTTON_SHELL_RESET,
                      GLASS_BUTTON_DISABLED,
                      GLASS_PRIMARY_BUTTON.emerald,
                    )}
                  >
                    {generateLabelMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Label...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        Generate Shipping Label
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="manual"
                className="space-y-4 mt-4 data-[state=inactive]:hidden"
              >
                <p className="text-sm text-white/70">
                  Already have a tracking number from another source? Enter it
                  here to update the order.
                </p>

                <div className="space-y-2">
                  <DialogFormLabel icon={Truck} htmlFor="manual-carrier">
                    Carrier
                  </DialogFormLabel>
                  <DeferredSelectGate
                    enabled={open}
                    placeholder={
                      <div
                        className={cn(
                          "flex h-11 w-full items-center rounded-md px-2 text-sm text-white/60",
                          DIALOG_FORM_FIELD_EMERALD,
                        )}
                        aria-hidden
                      >
                        {CARRIERS.find((c) => c.value === manualCarrier)
                          ?.label ?? "Select carrier"}
                      </div>
                    }
                  >
                    {({ selectRemountKey }) => (
                      <Select
                        key={selectRemountKey}
                        value={manualCarrier}
                        onValueChange={(v) =>
                          setManualCarrier(v as ShippingCarrier)
                        }
                      >
                        <SelectTrigger
                          id="manual-carrier"
                          className={cn(
                            "h-11 w-full",
                            DIALOG_FORM_FIELD_EMERALD,
                          )}
                        >
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent
                          className={cn(DIALOG_SELECT_CONTENT_CLASS)}
                          position="popper"
                          sideOffset={5}
                          align="start"
                        >
                          {CARRIERS.map((c) => (
                            <SelectItem
                              key={c.value}
                              value={c.value}
                              className={DIALOG_SELECT_ITEM_CLASS}
                            >
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </DeferredSelectGate>
                </div>

                <div className="space-y-2">
                  <DialogFormLabel icon={Hash} htmlFor="tracking-number">
                    Tracking Number
                  </DialogFormLabel>
                  <Input
                    id="tracking-number"
                    placeholder="Enter tracking number"
                    value={manualTrackingNumber}
                    onChange={(e) => setManualTrackingNumber(e.target.value)}
                    className={cn("h-11 w-full", DIALOG_FORM_FIELD_EMERALD)}
                  />
                </div>

                <div className="flex justify-end pt-1 overflow-visible">
                  <Button
                    variant="ghost"
                    onClick={handleAddTracking}
                    disabled={isLoading || !manualTrackingNumber.trim()}
                    className={cn(
                      "group w-full sm:w-auto px-8",
                      GLASS_BUTTON_ICON_HOVER,
                      GLASS_BUTTON_SHELL_RESET,
                      GLASS_BUTTON_DISABLED,
                      GLASS_PRIMARY_BUTTON.emerald,
                    )}
                  >
                    {addTrackingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Tracking...
                      </>
                    ) : (
                      <>
                        <Tag className="mr-2 h-4 w-4" />
                        Add Tracking Number
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
