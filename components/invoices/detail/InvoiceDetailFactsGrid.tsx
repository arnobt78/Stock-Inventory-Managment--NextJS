"use client";

/**
 * REQ-0126 — responsive icon row for invoice detail facts (amounts + dates).
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Wallet,
  Banknote,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DataSlotPulse } from "@/components/shared";
import { ClientDateTime } from "@/components/shared/ClientDateDisplay";
import { cn } from "@/lib/utils";

export type InvoiceDetailFactsGridProps = {
  dataLoading: boolean;
  amountPaid?: number;
  amountDue?: number;
  isOverdue?: boolean;
  issuedAt?: Date | string;
  dueDate?: Date | string;
  sentAt?: Date | string | null;
  paidAt?: Date | string | null;
  cancelledAt?: Date | string | null;
};

function FactChip({
  icon: Icon,
  label,
  children,
  loading,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 min-w-0 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
      <span className="text-gray-600 dark:text-gray-400 shrink-0">{label}</span>
      <span
        className={cn(
          "font-normal text-gray-700 dark:text-white truncate",
          valueClassName,
        )}
      >
        {loading ? (
          <DataSlotPulse variant="text-sm" className="w-20" />
        ) : (
          children
        )}
      </span>
    </div>
  );
}

export function InvoiceDetailFactsGrid({
  dataLoading,
  amountPaid = 0,
  amountDue = 0,
  isOverdue,
  issuedAt,
  dueDate,
  sentAt,
  paidAt,
  cancelledAt,
}: InvoiceDetailFactsGridProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-orange-200/30 dark:border-orange-400/20">
      <FactChip
        icon={Wallet}
        label="Amount Paid:"
        loading={dataLoading}
        valueClassName="text-emerald-600 dark:text-emerald-400"
      >
        ${amountPaid.toFixed(2)}
      </FactChip>
      <FactChip
        icon={Banknote}
        label="Amount Due:"
        loading={dataLoading}
        valueClassName={
          amountDue > 0
            ? isOverdue
              ? "text-rose-600 dark:text-rose-400"
              : "text-amber-600 dark:text-amber-400"
            : "text-emerald-600 dark:text-emerald-400"
        }
      >
        ${amountDue.toFixed(2)}
        {isOverdue ? " (Overdue)" : ""}
      </FactChip>
      <FactChip icon={Calendar} label="Issued:" loading={dataLoading}>
        {issuedAt ? <ClientDateTime date={issuedAt} semantic="created" /> : "—"}
      </FactChip>
      <FactChip icon={Calendar} label="Due Date:" loading={dataLoading}>
        {dueDate ? (
          <ClientDateTime
            date={dueDate}
            semantic={isOverdue ? "overdue" : "due"}
          />
        ) : (
          "—"
        )}
      </FactChip>
      <FactChip icon={Send} label="Sent:" loading={dataLoading}>
        {sentAt ? <ClientDateTime date={sentAt} semantic="sent" /> : "—"}
      </FactChip>
      <FactChip icon={CheckCircle} label="Paid:" loading={dataLoading}>
        {paidAt ? <ClientDateTime date={paidAt} semantic="paid" /> : "—"}
      </FactChip>
      <FactChip icon={XCircle} label="Cancelled:" loading={dataLoading}>
        {cancelledAt ? <ClientDateTime date={cancelledAt} semantic="cancelled" /> : "—"}
      </FactChip>
    </div>
  );
}
