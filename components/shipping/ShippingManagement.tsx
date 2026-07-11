"use client";

/**
 * Shipping Management Component
 * Admin component for generating labels and managing tracking
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
import { Label } from "@/components/ui/label";
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
import { DeferredSelectGate, DIALOG_FORM_FIELD_EMERALD, CopyableText } from "@/components/shared";
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
} from "lucide-react";
import type { Order, ShippingCarrier } from "@/types";

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

  // Auto generate form state
  const [carrier, setCarrier] = useState<ShippingCarrier>("usps");

  // Manual tracking form state
  const [manualTrackingNumber, setManualTrackingNumber] = useState("");
  const [manualCarrier, setManualCarrier] = useState<ShippingCarrier>("usps");

  const generateLabelMutation = useGenerateShippingLabel();
  const addTrackingMutation = useAddTrackingNumber();

  const hasTrackingInfo = order.trackingNumber;
  const isShipped = order.status === "shipped" || order.status === "delivered";

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

  // If already shipped, show tracking info
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

  // Don't show for cancelled orders
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
      <DialogContent className="p-2 sm:p-4 sm:px-8 poppins max-h-[90vh] overflow-y-auto flex flex-col overflow-hidden gap-4 border-emerald-400/30 dark:border-emerald-400/30 shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]">
        <DialogHeader className="flex-shrink-0">
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

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 min-h-[340px]">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "auto" | "manual")}
            className="flex flex-col min-h-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 rounded-lg bg-white/30 dark:bg-white/10 text-white shrink-0 border border-emerald-400/30 dark:border-white/20 shadow-[0_10px_30px_rgba(16,185,129,0.15)] dark:shadow-[0_10px_30px_rgba(16,185,129,0.1)]">
              <TabsTrigger
                value="auto"
                className="h-9 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-emerald-400 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/50 data-[state=active]:bg-background data-[state=active]:text-slate-700 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
              >
                <Truck className="h-4 w-4" />
                Auto Generate
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="h-9 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-emerald-400 data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/50 data-[state=active]:bg-background data-[state=active]:text-slate-700 dark:data-[state=active]:text-white dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
              >
                <Tag className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            {/* Auto Generate Tab */}
            <TabsContent
              value="auto"
              className="space-y-4 mt-4 flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    This will generate a shipping label via Shippo and
                    automatically update the order status to
                    &quot;shipped&quot;. Label costs will be charged to your
                    Shippo account.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier" className="text-white/90">
                  Carrier
                </Label>
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    <div
                      className="flex h-11 w-full items-center rounded-md border border-emerald-400/30 bg-white/10 px-2 text-sm text-white/60"
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
                        className={cn("h-11 w-full dark:shadow-[0_10px_30px_rgba(16,185,129,0.1)]", DIALOG_FORM_FIELD_EMERALD)}
                      >
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-emerald-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {CARRIERS.map((c) => (
                          <SelectItem
                            key={c.value}
                            value={c.value}
                            className="cursor-pointer text-gray-700 dark:text-white focus:bg-emerald-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                          >
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </DeferredSelectGate>
              </div>

              <Button
                variant="ghost"
                onClick={handleGenerateLabel}
                disabled={isLoading}
                className={cn(
                  "group w-full",
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
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent
              value="manual"
              className="space-y-4 mt-4 flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <p className="text-sm text-white/70">
                Already have a tracking number from another source? Enter it
                here to update the order.
              </p>

              <div className="space-y-2">
                <Label htmlFor="manual-carrier" className="text-white/90">
                  Carrier
                </Label>
                <DeferredSelectGate
                  enabled={open}
                  placeholder={
                    <div
                      className="flex h-11 w-full items-center rounded-md border border-emerald-400/30 bg-white/10 px-2 text-sm text-white/60"
                      aria-hidden
                    >
                      {CARRIERS.find((c) => c.value === manualCarrier)?.label ??
                        "Select carrier"}
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
                        className={cn("h-11 w-full dark:shadow-[0_10px_30px_rgba(16,185,129,0.1)]", DIALOG_FORM_FIELD_EMERALD)}
                      >
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-emerald-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                        position="popper"
                        sideOffset={5}
                        align="start"
                      >
                        {CARRIERS.map((c) => (
                          <SelectItem
                            key={c.value}
                            value={c.value}
                            className="cursor-pointer text-gray-700 dark:text-white focus:bg-emerald-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
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
                <Label htmlFor="tracking-number" className="text-white/90">
                  Tracking Number
                </Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter tracking number"
                  value={manualTrackingNumber}
                  onChange={(e) => setManualTrackingNumber(e.target.value)}
                  className={cn("h-11 w-full dark:shadow-[0_10px_30px_rgba(16,185,129,0.1)]", DIALOG_FORM_FIELD_EMERALD)}
                />
              </div>

              <Button
                variant="ghost"
                onClick={handleAddTracking}
                disabled={isLoading || !manualTrackingNumber.trim()}
                className={cn(
                  "group w-full",
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
