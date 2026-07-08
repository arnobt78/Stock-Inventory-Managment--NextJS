"use client";

/**
 * Order Tracking Info Component
 * Displays shipping tracking information for an order.
 * Styled with glassmorphic card (round-28px, shadow glow) and gradient shadow buttons per UI_STYLING_GUIDE.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Truck,
  ExternalLink,
  FileText,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStableDate } from "@/lib/date/format-stable";

interface Order {
  status: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  paymentStatus?: string;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

interface OrderTrackingInfoProps {
  order: Order;
  className?: string;
}

/**
 * Carrier display info
 */
const CARRIER_INFO: Record<
  string,
  {
    name: string;
    color: string;
    trackingUrl?: (trackingNumber: string) => string;
  }
> = {
  usps: {
    name: "USPS",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    trackingUrl: (tn) =>
      `https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=${tn}`,
  },
  ups: {
    name: "UPS",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    trackingUrl: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
  },
  fedex: {
    name: "FedEx",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    trackingUrl: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
  },
  dhl: {
    name: "DHL",
    color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    trackingUrl: (tn) =>
      `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
  },
  other: {
    name: "Other",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
};

/** Map Shippo provider / stored carrier to our known carrier key (e.g. Stamps.com -> usps). */
function normalizeCarrier(carrier: string): string {
  const c = carrier.toLowerCase();
  if (c === "usps" || c.includes("stamps") || c.includes("usps")) return "usps";
  if (c === "ups" || c.includes("ups")) return "ups";
  if (c === "fedex" || c.includes("fedex")) return "fedex";
  if (c === "dhl" || c.includes("dhl")) return "dhl";
  return carrier || "other";
}

export default function OrderTrackingInfo({
  order,
  className,
}: OrderTrackingInfoProps) {
  // Only show for shipped or delivered orders with tracking info
  const isCancelledOrRefunded =
    order.status === "cancelled" || order.paymentStatus === "refunded";

  const hasTrackingInfo =
    (order.status === "shipped" || order.status === "delivered") &&
    order.trackingNumber &&
    !isCancelledOrRefunded;

  if (!hasTrackingInfo) {
    return null;
  }

  const rawCarrier = order.trackingCarrier?.toLowerCase() || "other";
  // Normalize Shippo provider names to our known carriers (e.g. "Stamps.com" -> usps)
  const carrier = normalizeCarrier(rawCarrier);
  const resolvedCarrier = carrier in CARRIER_INFO ? carrier : "other";
  const carrierInfo =
    CARRIER_INFO[resolvedCarrier as keyof typeof CARRIER_INFO]!;

  // Generate tracking URL if not provided
  const trackingUrl =
    order.trackingUrl ||
    (carrierInfo?.trackingUrl && order.trackingNumber
      ? carrierInfo.trackingUrl(order.trackingNumber)
      : null);

  return (
    <article
      className={cn(
        "rounded-[28px] border border-emerald-400/20 dark:border-emerald-400/30 p-4 sm:p-5 backdrop-blur-sm transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
        "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-emerald-500/5",
        "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]",
        "hover:border-emerald-300/40 dark:hover:border-emerald-300/50",
        className,
      )}
    >
      <div className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {order.status === "delivered" ? (
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-emerald-400" />
            ) : (
              <Truck className="h-5 w-5 text-primary dark:text-emerald-400" />
            )}
            <h3 className="text-base font-semibold text-gray-700 dark:text-white">
              {order.status === "delivered"
                ? "Package Delivered"
                : "Shipping Information"}
            </h3>
          </div>
          <Badge className={carrierInfo.color}>{carrierInfo.name}</Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-white/70 mt-1.5">
          {order.status === "delivered" && order.deliveredAt
            ? `Delivered on ${formatStableDate(order.deliveredAt)}`
            : order.shippedAt
              ? `Shipped on ${formatStableDate(order.shippedAt)}`
              : "Your package is on its way"}
        </p>
      </div>
      <div className="space-y-4">
        {/* Tracking Number */}
        <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 dark:border-white/10 bg-white/30 dark:bg-white/5">
          <Package className="h-5 w-5 text-gray-500 dark:text-white/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-white/60">
              Tracking Number
            </p>
            <p className="font-mono font-medium text-sm text-gray-700 dark:text-white truncate">
              {order.trackingNumber}
            </p>
          </div>
        </div>

        {/* Track Package + Download Label PDF — same gradient shadow style as Update Order / Cancel Order */}
        <div className="flex flex-col sm:flex-row gap-2">
          {trackingUrl && (
            <Button
              asChild
              className="flex-1 gap-2 rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] dark:shadow-[0_15px_35px_rgba(2,132,199,0.25)] backdrop-blur-sm hover:border-sky-300/50 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-sky-300/50 transition-all duration-300 h-10"
            >
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2 inline-flex items-center justify-center"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                Track Package
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </Button>
          )}
          {order.labelUrl && (
            <Button
              asChild
              className="flex-1 gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_15px_35px_rgba(139,92,246,0.45)] dark:shadow-[0_15px_35px_rgba(139,92,246,0.25)] backdrop-blur-sm hover:border-violet-300/50 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 dark:hover:border-violet-300/50 transition-all duration-300 h-10"
            >
              <a
                href={order.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2 inline-flex items-center justify-center"
              >
                <FileText className="h-4 w-4 shrink-0" />
                Download Label PDF
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
