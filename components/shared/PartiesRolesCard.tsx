"use client";

/**
 * REQ-0074 — shared Parties & roles card with avatar rings and per-party glow cards.
 * REQ-0127 — single inline row per party: icon label + PersonInlineRow (sky name · muted email).
 * REQ-0164 — optional linkClassName for self (gray) vs other (sky) party names.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { FileText, Package, User, MapPin, Users } from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import { PersonInlineRow } from "@/components/shared/PersonInlineRow";
import { cn } from "@/lib/utils";

export type PartyPerson = {
  userId?: string;
  name?: string | null;
  email: string;
  image?: string | null;
  /** Optional owner-products (or profile) link */
  href?: string;
  /** REQ-0164 — override name link classes (self = gray/white) */
  linkClassName?: string;
};

export type PartiesRolesCardProps = {
  dataLoading: boolean;
  headerIcon?: LucideIcon;
  invoiceCreatedBy?: PartyPerson | null;
  orderedBy?: PartyPerson | null;
  customer?: PartyPerson | null;
  customerLabel?: string;
  productOwners?: PartyPerson[];
};

function PartyPersonDisplay({
  person,
  loading,
}: {
  person?: PartyPerson | null;
  loading?: boolean;
}) {
  if (loading) {
    return <DataSlotPulse variant="text-md" className="w-36" />;
  }
  if (!person) return <span className="text-gray-700 dark:text-white">—</span>;

  const seed = person.userId ?? person.email;
  const displayName = person.name ?? person.email;

  return (
    <PersonInlineRow
      seed={seed}
      image={person.image}
      name={displayName}
      email={person.email}
      href={person.href}
      linkClassName={person.linkClassName}
      avatarSize={28}
    />
  );
}

function PartyFieldRow({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl border border-teal-200/30 dark:border-teal-400/20",
        "bg-gradient-to-br from-teal-100/40 via-white/30 to-transparent",
        "dark:from-teal-500/10 dark:via-white/5 dark:to-transparent",
        "shadow-[0_8px_24px_rgba(20,184,166,0.12)] dark:shadow-[0_8px_24px_rgba(20,184,166,0.08)]",
        className,
      )}
    >
      <span className="text-gray-600 dark:text-gray-300 font-normal inline-flex items-center gap-1.5 text-sm shrink-0">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function PartiesRolesCard({
  dataLoading,
  headerIcon: HeaderIcon = Package,
  invoiceCreatedBy,
  orderedBy,
  customer,
  customerLabel = "Customer / Ship to",
  productOwners = [],
}: PartiesRolesCardProps) {
  const showInvoiceCreated = dataLoading || invoiceCreatedBy != null;
  const showOrderedBy = dataLoading || orderedBy != null;
  const showCustomer = dataLoading || customer != null;
  const showOwners = dataLoading || productOwners.length > 0;

  if (!showInvoiceCreated && !showOrderedBy && !showCustomer && !showOwners) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl border border-teal-400/30 bg-teal-500/10 dark:bg-teal-500/20">
          <HeaderIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-sm sm:text-base font-medium leading-none text-gray-700 dark:text-white">
          Parties & Roles
        </h3>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        {showInvoiceCreated && (
          <PartyFieldRow label="Invoice created by" icon={FileText}>
            <PartyPersonDisplay
              person={invoiceCreatedBy}
              loading={dataLoading}
            />
          </PartyFieldRow>
        )}
        {showOrderedBy && (
          <PartyFieldRow label="Ordered by" icon={User}>
            <PartyPersonDisplay person={orderedBy} loading={dataLoading} />
          </PartyFieldRow>
        )}
        {showCustomer && (
          <PartyFieldRow label={customerLabel} icon={MapPin}>
            <PartyPersonDisplay person={customer} loading={dataLoading} />
          </PartyFieldRow>
        )}
        {showOwners && (
          <PartyFieldRow label="Product owner(s)" icon={Users}>
            {dataLoading ? (
              <DataSlotPulse variant="text-md" className="w-48" />
            ) : (
              <div className="flex flex-col gap-2">
                {productOwners.map((owner) => (
                  <PartyPersonDisplay
                    key={owner.userId ?? owner.email}
                    person={owner}
                  />
                ))}
              </div>
            )}
          </PartyFieldRow>
        )}
      </div>
    </div>
  );
}

export function mapOrderProductOwners(
  owners: {
    userId: string;
    name: string | null;
    email: string;
    image?: string | null;
  }[],
): PartyPerson[] {
  return owners.map((o) => ({
    userId: o.userId,
    name: o.name,
    email: o.email,
    image: o.image,
  }));
}
