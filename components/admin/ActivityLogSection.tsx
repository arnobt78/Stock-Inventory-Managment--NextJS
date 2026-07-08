"use client";

import React, { useMemo, useState } from "react";
import { DeferredSelectGate } from "@/components/shared";
import Link from "next/link";
import {
  useAuditLogs,
  type ActivityLogPeriod,
} from "@/hooks/queries/use-audit-logs";
import { isDataSlotLoading } from "@/lib/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AuditLog, AuditAction } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { IoClose } from "react-icons/io5";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableBodyPulseRows } from "@/components/ui/table-data-skeleton";

const PERIODS: { value: ActivityLogPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "month", label: "Last month" },
];

const actionColors: Record<AuditAction, string> = {
  create:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  login:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  logout: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  view: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  export:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  import:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  send: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  payment:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ship: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  settings_change:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const variantConfig = {
  border: "border-violet-400/20",
  gradient:
    "bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent",
  shadow:
    "shadow-[0_15px_40px_rgba(139,92,246,0.15)] dark:shadow-[0_15px_40px_rgba(139,92,246,0.1)]",
  iconBg:
    "border-violet-300/30 bg-violet-100/50 dark:border-violet-400/30 dark:bg-violet-500/20",
};

/** Build activity details: action + entity, then dynamic lines from details (status, tracking, product, fields updated, etc.). */
function getActivityDetails(log: AuditLog): React.ReactNode {
  const action =
    log.action.charAt(0).toUpperCase() +
    (log.action?.slice(1) ?? "").replace(/_/g, " ");
  const entityLabel = log.entityType.replace(/_/g, " ");
  const shortId = log.entityId ? ` …${log.entityId.slice(-6)}` : "";
  const lines: string[] = [`${action} ${entityLabel}${shortId}`];

  let detailsObj: Record<string, unknown> | null = null;
  if (log.details != null) {
    if (typeof log.details === "object" && !Array.isArray(log.details)) {
      detailsObj = log.details as Record<string, unknown>;
    } else if (typeof log.details === "string") {
      try {
        const parsed = JSON.parse(log.details) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          detailsObj = parsed as Record<string, unknown>;
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }
  if (detailsObj) {
    const d = detailsObj as Record<string, unknown> & {
      message?: string;
      summary?: string;
      statusFrom?: string;
      statusTo?: string;
      trackingNumber?: string;
      trackingCarrier?: string;
      labelSource?: string;
      productName?: string;
      orderNumber?: string;
      invoiceNumber?: string;
      subject?: string;
      fieldsUpdated?: string[];
      name?: string;
    };

    if (d.statusFrom != null && d.statusTo != null) {
      lines.push(`Status: ${String(d.statusFrom)} → ${String(d.statusTo)}`);
    }
    if (d.trackingNumber != null && String(d.trackingNumber).trim()) {
      const carrier = d.trackingCarrier
        ? ` (${String(d.trackingCarrier)})`
        : "";
      lines.push(`Tracking: ${String(d.trackingNumber)}${carrier}`);
    }
    if (d.labelSource != null && String(d.labelSource).trim()) {
      lines.push(`Label: ${String(d.labelSource)}`);
    }
    if (d.productName != null && String(d.productName).trim()) {
      lines.push(`Product: ${String(d.productName)}`);
    }
    if (d.orderNumber != null && String(d.orderNumber).trim()) {
      lines.push(`Order: ${String(d.orderNumber)}`);
    }
    if (d.invoiceNumber != null && String(d.invoiceNumber).trim()) {
      lines.push(`Invoice: ${String(d.invoiceNumber)}`);
    }
    if (d.subject != null && String(d.subject).trim()) {
      lines.push(`Subject: ${String(d.subject)}`);
    }
    if (d.rating != null && d.rating !== "") {
      lines.push(`Rating: ${d.rating}/5`);
    }
    if (Array.isArray(d.fieldsUpdated) && d.fieldsUpdated.length > 0) {
      const labels = d.fieldsUpdated.map((f) =>
        String(f)
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim(),
      );
      lines.push(`Fields updated: ${labels.join(", ")}`);
    }
    if (d.name != null && String(d.name).trim() && !d.productName) {
      lines.push(`Name: ${String(d.name)}`);
    }
    if (d.sku != null && String(d.sku).trim()) {
      lines.push(`SKU: ${String(d.sku)}`);
    }
    const msg = d.message ?? d.summary;
    if (typeof msg === "string" && msg.trim()) {
      lines.push(msg.trim());
    }
  }

  return (
    <span className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
      {lines.join("\n")}
    </span>
  );
}

function entityLink(
  entityType: string,
  entityId: string | null | undefined,
): string | null {
  if (!entityId) return null;
  const base = "/admin";
  switch (entityType) {
    case "product":
      return `${base}/products/${entityId}`;
    case "order":
      return `${base}/orders/${entityId}`;
    case "invoice":
      return `${base}/invoices/${entityId}`;
    case "user":
      return `${base}/user-management/${entityId}`;
    case "supplier":
      return `${base}/suppliers/${entityId}`;
    case "category":
      return `${base}/categories/${entityId}`;
    case "warehouse":
      return `${base}/warehouses/${entityId}`;
    case "ticket":
      return `${base}/support-tickets/${entityId}`;
    case "review":
      return `${base}/product-reviews/${entityId}`;
    default:
      return null;
  }
}

export type ActivityLogSectionProps = {
  initialLogs?: AuditLog[];
  initialPeriod?: ActivityLogPeriod;
};

export default function ActivityLogSection({
  initialLogs,
  initialPeriod = "7days",
}: ActivityLogSectionProps) {
  const [period, setPeriod] = useState<ActivityLogPeriod>(initialPeriod);
  const [searchTerm, setSearchTerm] = useState("");
  const initialAuditData =
    initialLogs != null && period === initialPeriod
      ? { logs: initialLogs, pagination: null }
      : undefined;
  const auditQuery = useAuditLogs({ period }, initialAuditData);
  const data = auditQuery.data;
  const dataLoading = isDataSlotLoading(auditQuery, initialAuditData);

  const rawLogs =
    data?.logs ?? (period === initialPeriod ? (initialLogs ?? []) : []);
  const logs = useMemo(() => {
    if (!searchTerm.trim()) return rawLogs;
    const term = searchTerm.toLowerCase().trim();
    return rawLogs.filter((log) => {
      const name =
        log.user?.name ?? log.user?.username ?? log.user?.email ?? "";
      const email = log.user?.email ?? "";
      const action = log.action ?? "";
      const entityType = log.entityType ?? "";
      const entityId = log.entityId ?? "";
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        action.toLowerCase().includes(term) ||
        entityType.toLowerCase().includes(term) ||
        entityId.toLowerCase().includes(term)
      );
    });
  }, [rawLogs, searchTerm]);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: "adminUser",
        header: "Admin User",
        cell: ({ row }) => {
          const log = row.original;
          const name =
            log.user?.name ??
            log.user?.username ??
            log.user?.email ??
            log.userId.slice(-8);
          const email = log.user?.email ?? "—";
          return (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {name}
              </span>
              <span
                className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]"
                title={email}
              >
                {email}
              </span>
            </div>
          );
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const action = row.original.action as AuditAction;
          const label =
            action.charAt(0).toUpperCase() +
            (action?.slice(1) ?? "").replace(/_/g, " ");
          const colorClass =
            actionColors[action] ??
            "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
          return (
            <Badge
              variant="secondary"
              className={cn("font-medium", colorClass)}
            >
              {label}
            </Badge>
          );
        },
      },
      {
        id: "entity",
        header: "Entity",
        cell: ({ row }) => {
          const log = row.original;
          const link = entityLink(log.entityType, log.entityId);
          return link ? (
            <Link
              href={link}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
            >
              {log.entityType} {log.entityId?.slice(-6)}
            </Link>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {log.entityType}
              {log.entityId ? ` ${log.entityId.slice(-6)}` : ""}
            </span>
          );
        },
      },
      {
        id: "activityDetails",
        header: "Activity details",
        cell: ({ row }) => (
          <div className="max-w-[320px] min-w-[180px]">
            {getActivityDetails(row.original)}
          </div>
        ),
      },
      {
        id: "when",
        header: "When",
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {format(new Date(row.original.createdAt), "MMM d, HH:mm")}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <article
      className={cn(
        "rounded-[20px] border p-2 sm:p-4 backdrop-blur-sm mt-8",
        "bg-white/60 dark:bg-white/5",
        variantConfig.border,
        variantConfig.gradient,
        variantConfig.shadow,
      )}
    >
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-white ">
            Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Your actions & activities (create, update, delete). Last{" "}
            {period === "today"
              ? "24 hours"
              : period === "7days"
                ? "7 days"
                : "30 days"}
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-white/60 z-10" />
            <Input
              placeholder="Search by user, action, entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-10 w-full rounded-[28px] bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-700 dark:text-white/60 hover:text-gray-700 dark:hover:text-white hover:bg-white/10"
              >
                <IoClose className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DeferredSelectGate
            enabled={!dataLoading}
            placeholder={
              <div
                className={cn(
                  "w-full sm:w-[180px] h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
                  "bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10",
                  "text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-sm",
                  "flex items-center px-3 text-sm",
                )}
                aria-hidden
              >
                {PERIODS.find((p) => p.value === period)?.label ??
                  "Last 7 days"}
              </div>
            }
          >
            {({ selectRemountKey }) => (
              <Select
                key={selectRemountKey}
                value={period}
                onValueChange={(v) => setPeriod(v as ActivityLogPeriod)}
              >
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-[180px] h-10 rounded-[28px] border border-sky-400/30 dark:border-sky-400/30",
                    "bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-sky-500/10 dark:from-sky-500/25 dark:via-sky-500/15 dark:to-sky-500/10",
                    "text-gray-700 dark:text-white shadow-[0_10px_30px_rgba(2,132,199,0.2)] backdrop-blur-sm",
                    "transition duration-200 hover:border-sky-300/40 hover:from-sky-500/35 hover:via-sky-500/25 hover:to-sky-500/15",
                    "dark:hover:border-sky-300/40 dark:hover:from-sky-500/35 dark:hover:via-sky-500/25 dark:hover:to-sky-500/15",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="rounded-xl border-sky-400/20 bg-white/95 dark:bg-popover/95 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
                  position="popper"
                >
                  {PERIODS.map((p) => (
                    <SelectItem
                      key={p.value}
                      value={p.value}
                      className="cursor-pointer"
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </DeferredSelectGate>
        </div>
      </div>
      {dataLoading && logs.length === 0 ? (
        <div className="overflow-x-auto rounded-xl border border-violet-200/30 dark:border-white/10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-violet-200/30 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBodyPulseRows rows={6} columnCount={5} />
          </Table>
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 py-6 text-center">
          {searchTerm.trim()
            ? "No matching activity."
            : "No activity in this period."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-violet-200/30 dark:border-white/10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-violet-200/30 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-violet-100/30 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </article>
  );
}
