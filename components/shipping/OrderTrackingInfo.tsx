"use client";

/**
 * Order Tracking Info — glass carrier glow badge (REQ-0146 / REQ-0147).
 * REQ-0147 — never use shadcn Badge here (default bg-primary paints red over glass).
 */

import React from "react";
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
import { CopyableText } from "@/components/shared";
import {
  GLASS_BADGE_CLASS,
  type GlassBadgeHue,
} from "@/lib/ui/glass-badge-styles";
import { TYPO_CARD_TITLE, TYPO_SUBTITLE } from "@/lib/ui/typography-scale";

interface Order {
  status: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  paymentStatus?: string;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
}

interface OrderTrackingInfoProps {
  order: Order;
  className?: string;
}

const CARRIER_INFO: Record<
  string,
  {
    name: string;
    hue: GlassBadgeHue;
    trackingUrl?: (trackingNumber: string) => string;
  }
> = {
  usps: {
    name: "USPS",
    hue: "blue",
    trackingUrl: (tn) =>
      `https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=${tn}`,
  },
  ups: {
    name: "UPS",
    hue: "amber",
    trackingUrl: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
  },
  fedex: {
    name: "FedEx",
    hue: "purple",
    trackingUrl: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
  },
  dhl: {
    name: "DHL",
    hue: "red",
    trackingUrl: (tn) =>
      `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
  },
  other: {
    name: "Other",
    hue: "gray",
  },
};

/** Map Shippo provider / stored carrier to our known carrier key (e.g. Stamps.com -> usps). */
export function normalizeCarrier(carrier: string): string {
  const c = carrier.toLowerCase();
  if (c === "usps" || c.includes("stamps") || c.includes("usps")) return "usps";
  if (c === "ups" || c.includes("ups")) return "ups";
  if (c === "fedex" || c.includes("fedex")) return "fedex";
  if (c === "dhl" || c.includes("dhl")) return "dhl";
  return "other";
}

/** REQ-0146 — glass glow badge meta for carrier chips outside OrderTrackingInfo. */
export function getCarrierBadgeMeta(carrier?: string | null): {
  name: string;
  hue: GlassBadgeHue;
} {
  const key = normalizeCarrier(carrier ?? "other");
  const info = CARRIER_INFO[key] ?? CARRIER_INFO.other!;
  return { name: info.name, hue: info.hue };
}

/**
 * REQ-0147 — plain span glass chip (no shadcn Badge / bg-primary).
 * Compact height matches SemanticBadgeBase compact tokens.
 */
export function CarrierGlassBadge({
  carrier,
  className,
}: {
  carrier?: string | null;
  className?: string;
}) {
  const meta = getCarrierBadgeMeta(carrier);
  return (
    <span
      className={cn(
        "relative isolate inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-normal",
        GLASS_BADGE_CLASS[meta.hue],
        className,
      )}
    >
      {meta.name}
    </span>
  );
}

export default function OrderTrackingInfo({
  order,
  className,
}: OrderTrackingInfoProps) {
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
  const carrier = normalizeCarrier(rawCarrier);
  const resolvedCarrier = carrier in CARRIER_INFO ? carrier : "other";
  const carrierInfo =
    CARRIER_INFO[resolvedCarrier as keyof typeof CARRIER_INFO]!;

  const trackingUrl =
    order.trackingUrl ||
    (carrierInfo?.trackingUrl && order.trackingNumber
      ? carrierInfo.trackingUrl(order.trackingNumber)
      : null);

  return (
    <article
      className={cn(
        "h-full flex flex-col rounded-[28px] border border-emerald-400/20 dark:border-emerald-400/30 p-2 sm:p-4 backdrop-blur-md transition-all duration-300",
        "bg-white/60 dark:bg-white/5",
        "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/25 dark:via-emerald-500/10 dark:to-emerald-500/5",
        "shadow-[0_15px_40px_rgba(16,185,129,0.15)] dark:shadow-[0_30px_80px_rgba(16,185,129,0.25)]",
        "hover:border-emerald-300/40 dark:hover:border-emerald-300/50",
        className,
      )}
    >
      <div className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {order.status === "delivered" ? (
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-emerald-400 shrink-0" />
            ) : (
              <Truck className="h-5 w-5 text-primary dark:text-emerald-400 shrink-0" />
            )}
            <h3
              className={cn(TYPO_CARD_TITLE, "text-gray-700 dark:text-white")}
            >
              {order.status === "delivered"
                ? "Package Delivered"
                : "Shipping Information"}
            </h3>
          </div>
          <CarrierGlassBadge carrier={order.trackingCarrier} />
        </div>
        <p
          className={cn(
            TYPO_SUBTITLE,
            "text-gray-600 dark:text-white/80 mt-1.5",
          )}
        >
          {order.status === "delivered" && order.deliveredAt
            ? `Delivered on ${formatStableDate(order.deliveredAt)}`
            : order.shippedAt
              ? `Shipped on ${formatStableDate(order.shippedAt)}`
              : "Your package is on its way"}
        </p>
      </div>
      <div className="space-y-4 flex-1 flex flex-col justify-end">
        <div className="flex items-center gap-2 p-2 rounded-xl border border-white/10 dark:border-white/10 bg-white/30 dark:bg-white/5">
          <Package className="h-5 w-5 text-gray-500 dark:text-white/80 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Tracking Number
            </p>
            <p className="font-mono font-normal text-sm text-gray-700 dark:text-white truncate">
              {order.trackingNumber ? (
                <CopyableText value={order.trackingNumber}>
                  {order.trackingNumber}
                </CopyableText>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {trackingUrl && (
            <Button
              asChild
              className="flex-1 gap-2 rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/70 dark:via-sky-500/50 dark:to-sky-500/30 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] dark:shadow-[0_15px_35px_rgba(2,132,199,0.25)] backdrop-blur-md hover:border-sky-300/50 hover:from-sky-500/80 hover:via-sky-500/60 hover:to-sky-500/40 dark:hover:border-sky-300/50 transition-all duration-300 h-10"
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
              className="flex-1 gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/70 via-violet-500/50 to-violet-500/30 dark:from-violet-500/70 dark:via-violet-500/50 dark:to-violet-500/30 text-white shadow-[0_15px_35px_rgba(139,92,246,0.45)] dark:shadow-[0_15px_35px_rgba(139,92,246,0.25)] backdrop-blur-md hover:border-violet-300/50 hover:from-violet-500/80 hover:via-violet-500/60 hover:to-violet-500/40 dark:hover:border-violet-300/50 transition-all duration-300 h-10"
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
