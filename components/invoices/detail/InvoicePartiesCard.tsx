"use client";

/**
 * REQ-0162 / REQ-0164 — Parties & Roles on invoice detail.
 * Owner-products links for all roles; self name gray/white; others sky.
 */

import React from "react";
import { FileText } from "lucide-react";
import type { Invoice } from "@/types";
import { GlassCard } from "@/components/orders/detail/order-detail-primitives";
import {
  PartiesRolesCard,
  mapOrderProductOwners,
} from "@/components/shared/PartiesRolesCard";
import { enrichPartyPerson } from "@/lib/navigation/enrich-party-person";
import { useAuth } from "@/contexts";

export type InvoicePartiesCardProps = {
  invoice?: Invoice;
  dataLoading: boolean;
  /** When true, party names link to /admin/products?ownerId= */
  isAdminRole?: boolean;
};

export function InvoicePartiesCard({
  invoice,
  dataLoading,
  isAdminRole = false,
}: InvoicePartiesCardProps) {
  const { user } = useAuth();
  const viewerUserId = user?.id;
  const enrichOpts = { isAdminRole, viewerUserId };

  const shouldShow =
    dataLoading ||
    invoice?.invoiceCreatedBy != null ||
    invoice?.orderedBy != null ||
    invoice?.client != null ||
    (invoice?.invoiceProductOwners != null &&
      invoice.invoiceProductOwners.length > 0);

  if (!shouldShow) return null;

  const productOwners = mapOrderProductOwners(
    invoice?.invoiceProductOwners ?? [],
  )
    .map((owner) => enrichPartyPerson(owner, enrichOpts))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <GlassCard variant="teal">
      <PartiesRolesCard
        dataLoading={dataLoading}
        headerIcon={FileText}
        invoiceCreatedBy={enrichPartyPerson(
          invoice?.invoiceCreatedBy,
          enrichOpts,
        )}
        orderedBy={enrichPartyPerson(invoice?.orderedBy, enrichOpts)}
        customer={enrichPartyPerson(invoice?.client, enrichOpts)}
        customerLabel="Customer / Bill to"
        productOwners={productOwners}
      />
    </GlassCard>
  );
}
