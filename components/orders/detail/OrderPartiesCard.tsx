"use client";

/**
 * REQ-0147 — admin party names get sky user-management links via href.
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
import { resolveAuditUserManagementHref } from "@/lib/navigation/audit-user-href";

export type OrderPartiesCardProps = {
  order?: Order;
  dataLoading: boolean;
  /** When true, party names link to admin user management */
  isAdminRole?: boolean;
};

export function OrderPartiesCard({
  order,
  dataLoading,
  isAdminRole = false,
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
          href: order.placedByUserId
            ? resolveAuditUserManagementHref(order.placedByUserId, isAdminRole)
            : undefined,
        }
      : null;

  const customerUserId = order?.clientId ?? order?.userId;
  const customer: PartyPerson | null = order
    ? {
        userId: customerUserId ?? undefined,
        name: getCustomerDisplay(order),
        email: getCustomerEmail(order),
        href: customerUserId
          ? resolveAuditUserManagementHref(customerUserId, isAdminRole)
          : undefined,
      }
    : null;

  const productOwners = mapOrderProductOwners(
    order?.orderProductOwners ?? [],
  ).map((owner) => ({
    ...owner,
    href: owner.userId
      ? resolveAuditUserManagementHref(owner.userId, isAdminRole)
      : undefined,
  }));

  return (
    <GlassCard variant="teal">
      <PartiesRolesCard
        dataLoading={dataLoading}
        headerIcon={Package}
        orderedBy={orderedBy}
        customer={customer}
        customerLabel="Customer / Ship to"
        productOwners={productOwners}
      />
    </GlassCard>
  );
}
