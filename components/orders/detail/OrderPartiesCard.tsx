"use client";

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

export type OrderPartiesCardProps = {
  order?: Order;
  dataLoading: boolean;
};

export function OrderPartiesCard({
  order,
  dataLoading,
}: OrderPartiesCardProps) {
  const shouldShow =
    dataLoading ||
    order?.placedByName != null ||
    order?.placedByEmail != null ||
    (order?.orderProductOwners && order.orderProductOwners.length > 0);

  if (!shouldShow) return null;

  const orderedBy: PartyPerson | null =
    order?.placedByEmail || order?.placedByName
      ? {
          userId: order.placedByUserId ?? undefined,
          name: order.placedByName,
          email: order.placedByEmail ?? "",
          image: order.placedByImage,
        }
      : null;

  const customer: PartyPerson | null = order
    ? {
        userId: order.clientId ?? order.userId,
        name: getCustomerDisplay(order),
        email: getCustomerEmail(order),
      }
    : null;

  return (
    <GlassCard variant="teal">
      <PartiesRolesCard
        dataLoading={dataLoading}
        headerIcon={Package}
        orderedBy={orderedBy}
        customer={customer}
        customerLabel="Customer / Ship to"
        productOwners={mapOrderProductOwners(order?.orderProductOwners ?? [])}
      />
    </GlassCard>
  );
}
