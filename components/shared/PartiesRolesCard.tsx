"use client";

/**
 * REQ-0074 — shared Parties & roles card with avatar rings and per-party glow cards.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Package,
  User,
  MapPin,
  Users,
} from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveAvatarSourcesFromSeed } from "@/lib/ui/user-avatar-sources";
import { AVATAR_RING_TEAL_CLASS } from "@/lib/ui/avatar-ring-styles";
import { cn } from "@/lib/utils";

export type PartyPerson = {
  userId?: string;
  name?: string | null;
  email: string;
  image?: string | null;
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
  const avatar = resolveAvatarSourcesFromSeed(seed, person.image);
  const displayName = person.name ?? person.email;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <SafeAvatarImage
        src={avatar.src}
        fallbackSrc={avatar.fallbackSrc}
        width={28}
        height={28}
        className={cn("object-cover shrink-0", AVATAR_RING_TEAL_CLASS)}
        alt=""
      />
      <p className="text-sm text-gray-700 dark:text-white truncate">
        <span className="font-medium">{displayName}</span>
        {person.name && (
          <>
            <span className="text-gray-400 dark:text-gray-500 mx-1">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {person.email}
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function PartyFieldCard({
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
        "p-3 rounded-xl border border-teal-200/30 dark:border-teal-400/20",
        "bg-gradient-to-br from-teal-100/40 via-white/30 to-transparent",
        "dark:from-teal-500/10 dark:via-white/5 dark:to-transparent",
        "shadow-[0_8px_24px_rgba(20,184,166,0.12)] dark:shadow-[0_8px_24px_rgba(20,184,166,0.08)]",
        className,
      )}
    >
      <p className="text-gray-600 dark:text-gray-400 font-medium mb-1.5 inline-flex items-center gap-1.5 text-sm">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </p>
      {children}
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
        <h3 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
          Parties &amp; roles
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {showInvoiceCreated && (
          <PartyFieldCard label="Invoice created by" icon={FileText}>
            <PartyPersonDisplay person={invoiceCreatedBy} loading={dataLoading} />
          </PartyFieldCard>
        )}
        {showOrderedBy && (
          <PartyFieldCard label="Ordered by" icon={User}>
            <PartyPersonDisplay person={orderedBy} loading={dataLoading} />
          </PartyFieldCard>
        )}
        {showCustomer && (
          <PartyFieldCard label={customerLabel} icon={MapPin}>
            <PartyPersonDisplay person={customer} loading={dataLoading} />
          </PartyFieldCard>
        )}
        {showOwners && (
          <PartyFieldCard
            label="Product owner(s)"
            icon={Users}
            className="sm:col-span-2"
          >
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
          </PartyFieldCard>
        )}
      </div>
    </div>
  );
}

export function mapOrderProductOwners(
  owners: { userId: string; name: string | null; email: string; image?: string | null }[],
): PartyPerson[] {
  return owners.map((o) => ({
    userId: o.userId,
    name: o.name,
    email: o.email,
    image: o.image,
  }));
}
