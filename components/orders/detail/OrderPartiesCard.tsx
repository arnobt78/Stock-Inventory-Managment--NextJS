"use client";

/**
 * REQ-0147 / REQ-0164 — Parties & Roles on order detail.
 * Owner-products links for all roles; self name gray/white; others sky.
 */

import React from "react";
import { Package } from "lucide-react";
import type { Order } from "@/types";
import { GlassCard } from "./order-detail-primitives";
import {
  PartiesRolesCard,
  mapOrderProductOwners,
  type PartyPerson,
} from "@/components/shared/PartiesRolesCard";
import { getCustomerDisplay, getCustomerEmail } from "./order-detail-primitives";
import { enrichPartyPerson } from "@/lib/navigation/enrich-party-person";
import { useAuth } from "@/contexts";

export type OrderPartiesCardProps = {
  order?: Order;
  dataLoading: boolean;
  /** When true, party names link to /admin/products?ownerId= */
  isAdminRole?: boolean;
};

export function OrderPartiesCard({
  order,
  dataLoading,
  isAdminRole = false,
}: OrderPartiesCardProps) {
  const { user } = useAuth();
  const viewerUserId = user?.id;
  const enrichOpts = { isAdminRole, viewerUserId };

  // Always mount when order exists (SSR parties) — avoid late card appear/expand
  const shouldShow = dataLoading || !!order;

  if (!shouldShow) return null;

  const orderedBy: PartyPerson | null = enrichPartyPerson(
    order?.placedByEmail || order?.placedByName
      ? {
          userId: order.placedByUserId ?? undefined,
          name: order.placedByName,
          email: order.placedByEmail ?? "",
          image: order.placedByImage,
        }
      : null,
    enrichOpts,
  );

  const customerUserId = order?.clientId ?? order?.userId;
  const customer: PartyPerson | null = order
    ? enrichPartyPerson(
        {
          userId: customerUserId ?? undefined,
          name: getCustomerDisplay(order),
          email: getCustomerEmail(order),
        },
        enrichOpts,
      )
    : null;

  const productOwners = mapOrderProductOwners(
    order?.orderProductOwners ?? [],
  )
    .map((owner) => enrichPartyPerson(owner, enrichOpts))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <GlassCard variant="teal">
      <PartiesRolesCard
        dataLoading={dataLoading}
        // Keep party rows mounted; cancel merge keeps densify (no "—" flash)
        stableOrderPartySlots
        headerIcon={Package}
        orderedBy={orderedBy}
        customer={customer}
        customerLabel="Customer / Ship to"
        productOwners={productOwners}
      />
    </GlassCard>
  );
}
