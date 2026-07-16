/**
 * Semantic status badges — glassmorphic icons + gradient glow for tables, lists, detail pages.
 * Exclude StatisticsCard summary badges (those keep outline style).
 */

import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  FolderTree,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  ShoppingCart,
  Store,
  Truck,
  Upload,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  GLASS_BADGE_CLASS,
  OPAQUE_BADGE_CLASS,
} from "@/lib/ui/glass-badge-styles";
import {
  getWarehouseTypeTone,
} from "@/lib/ui/warehouse-type-styles";
import { cn } from "@/lib/utils";

/** Human-readable label: snake_case / lowercase → Title case */
export function formatSemanticLabel(value: string): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type BadgeTone = {
  className: string;
  icon: LucideIcon;
};

function normalizeKey(value: string): string {
  return (value || "").toLowerCase().replace(/\s+/g, "_");
}

const ORDER_STATUS: Record<string, BadgeTone> = {
  pending: { className: GLASS_BADGE_CLASS.orange, icon: Clock },
  confirmed: { className: GLASS_BADGE_CLASS.sky, icon: CheckCircle },
  processing: { className: GLASS_BADGE_CLASS.yellow, icon: Loader2 },
  shipped: { className: GLASS_BADGE_CLASS.purple, icon: Truck },
  delivered: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  cancelled: { className: GLASS_BADGE_CLASS.rose, icon: XCircle },
};

const PAYMENT_STATUS: Record<string, BadgeTone> = {
  paid: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  unpaid: { className: GLASS_BADGE_CLASS.slate, icon: AlertCircle },
  /** Legacy checkout value — display as Unpaid with orange (order-pending hue) */
  pending: { className: GLASS_BADGE_CLASS.orange, icon: AlertCircle },
  partial: { className: GLASS_BADGE_CLASS.orange, icon: CircleDollarSign },
  refunded: { className: GLASS_BADGE_CLASS.violet, icon: RotateCcw },
};

const PRODUCT_STOCK_STATUS: Record<string, BadgeTone> = {
  available: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  in_stock: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  stock_low: { className: GLASS_BADGE_CLASS.orange, icon: AlertTriangle },
  low_stock: { className: GLASS_BADGE_CLASS.orange, icon: AlertTriangle },
  stock_out: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
  out_of_stock: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
};

const ACTIVE_INACTIVE: Record<string, BadgeTone> = {
  active: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  inactive: { className: GLASS_BADGE_CLASS.slate, icon: Ban },
};

const TICKET_PRIORITY: Record<string, BadgeTone> = {
  low: { className: GLASS_BADGE_CLASS.gray, icon: Clock },
  medium: { className: GLASS_BADGE_CLASS.blue, icon: AlertCircle },
  high: { className: GLASS_BADGE_CLASS.orange, icon: AlertTriangle },
  urgent: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
};

const TICKET_STATUS: Record<string, BadgeTone> = {
  open: { className: GLASS_BADGE_CLASS.amber, icon: MessageSquare },
  in_progress: { className: GLASS_BADGE_CLASS.blue, icon: Loader2 },
  resolved: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  closed: { className: GLASS_BADGE_CLASS.gray, icon: XCircle },
};

const REVIEW_STATUS: Record<string, BadgeTone> = {
  pending: { className: GLASS_BADGE_CLASS.amber, icon: Clock },
  approved: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  rejected: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
};

const INVOICE_STATUS: Record<string, BadgeTone> = {
  draft: { className: GLASS_BADGE_CLASS.slate, icon: FileText },
  sent: { className: GLASS_BADGE_CLASS.sky, icon: FileText },
  paid: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  overdue: { className: GLASS_BADGE_CLASS.rose, icon: AlertCircle },
  cancelled: { className: GLASS_BADGE_CLASS.orange, icon: XCircle },
};

const USER_ROLE: Record<string, BadgeTone> = {
  admin: { className: GLASS_BADGE_CLASS.violet, icon: Shield },
  supplier: { className: GLASS_BADGE_CLASS.emerald, icon: Store },
  client: { className: GLASS_BADGE_CLASS.sky, icon: ShoppingBag },
  retailer: { className: GLASS_BADGE_CLASS.amber, icon: Store },
  user: { className: GLASS_BADGE_CLASS.gray, icon: User },
};

const AUDIT_ACTION: Record<string, BadgeTone> = {
  create: { className: GLASS_BADGE_CLASS.emerald, icon: Plus },
  update: { className: GLASS_BADGE_CLASS.blue, icon: Pencil },
  delete: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
  login: { className: GLASS_BADGE_CLASS.purple, icon: LogIn },
  logout: { className: GLASS_BADGE_CLASS.gray, icon: LogOut },
  view: { className: GLASS_BADGE_CLASS.cyan, icon: AlertCircle },
  export: { className: GLASS_BADGE_CLASS.yellow, icon: Download },
  import: { className: GLASS_BADGE_CLASS.orange, icon: Upload },
  send: { className: GLASS_BADGE_CLASS.indigo, icon: Send },
  payment: { className: GLASS_BADGE_CLASS.emerald, icon: CircleDollarSign },
  ship: { className: GLASS_BADGE_CLASS.sky, icon: Truck },
  settings_change: { className: GLASS_BADGE_CLASS.amber, icon: Settings },
};

const IMPORT_STATUS: Record<string, BadgeTone> = {
  completed: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  failed: { className: GLASS_BADGE_CLASS.red, icon: XCircle },
  processing: { className: GLASS_BADGE_CLASS.amber, icon: Loader2 },
};

const IMPORT_TYPE: Record<string, BadgeTone> = {
  products: { className: GLASS_BADGE_CLASS.emerald, icon: Package },
  orders: { className: GLASS_BADGE_CLASS.violet, icon: ShoppingCart },
  suppliers: { className: GLASS_BADGE_CLASS.teal, icon: Truck },
  categories: { className: GLASS_BADGE_CLASS.amber, icon: FolderTree },
};

/** Admin order/invoice list — personal vs client-placed */
const ADMIN_ORDER_SOURCE: Record<string, BadgeTone> = {
  personal: { className: GLASS_BADGE_CLASS.violet, icon: User },
  client: { className: GLASS_BADGE_CLASS.sky, icon: ShoppingBag },
};

/**
 * Forecast reorder urgency — includes demand-forecast keys (urgent/soon/normal/overstocked)
 * and legacy low/medium/high/critical aliases.
 */
const FORECAST_URGENCY: Record<string, BadgeTone> = {
  urgent: { className: GLASS_BADGE_CLASS.red, icon: AlertTriangle },
  soon: { className: GLASS_BADGE_CLASS.orange, icon: AlertCircle },
  normal: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  overstocked: { className: GLASS_BADGE_CLASS.violet, icon: Package },
  low: { className: GLASS_BADGE_CLASS.amber, icon: Clock },
  medium: { className: GLASS_BADGE_CLASS.amber, icon: AlertCircle },
  high: { className: GLASS_BADGE_CLASS.orange, icon: AlertTriangle },
  critical: { className: GLASS_BADGE_CLASS.red, icon: AlertTriangle },
};

/**
 * REQ-0139 — plain text color for reorder recommendation (Urgent / Normal / …).
 */
export function reorderRecommendationTextClass(
  recommendation: string | null | undefined,
): string {
  const key = normalizeKey(recommendation ?? "");
  if (key === "urgent" || key === "critical") {
    return "text-red-600 dark:text-red-400";
  }
  if (key === "soon" || key === "high") {
    return "text-orange-600 dark:text-orange-400";
  }
  if (key === "overstocked") {
    return "text-violet-600 dark:text-violet-400";
  }
  if (key === "normal" || key === "low" || key === "medium") {
    return "text-emerald-600 dark:text-emerald-400";
  }
  return "text-gray-700 dark:text-white";
}

/** Inventory health summary */
const INVENTORY_HEALTH: Record<string, BadgeTone> = {
  healthy: { className: GLASS_BADGE_CLASS.emerald, icon: CheckCircle },
  needs_attention: { className: GLASS_BADGE_CLASS.rose, icon: AlertTriangle },
};

const DEFAULT_TONE: BadgeTone = {
  className: OPAQUE_BADGE_CLASS.gray,
  icon: Clock,
};

function resolveTone(
  map: Record<string, BadgeTone>,
  status: string,
): BadgeTone {
  return map[normalizeKey(status)] ?? DEFAULT_TONE;
}

export type SemanticBadgeProps = {
  status: string;
  className?: string;
  /** Override display label (defaults to formatSemanticLabel) */
  label?: string;
  /** `compact` = tables/portal rows; `detail` = entity detail cards */
  size?: "compact" | "detail";
};

const BADGE_SIZE_CLASS = {
  compact: "text-[10px] py-0.5 gap-1 [&_svg]:h-3 [&_svg]:w-3",
  detail: "text-xs py-0.5 gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5",
} as const;

function SemanticBadgeBase({
  tone,
  label,
  className,
  spinIcon,
  size = "compact",
}: {
  tone: BadgeTone;
  label: string;
  className?: string;
  spinIcon?: boolean;
  size?: "compact" | "detail";
}) {
  const Icon = tone.icon;
  return (
    <span
      className={cn(
        "relative isolate inline-flex shrink-0 items-center rounded-full border px-2 font-normal transition-opacity hover:opacity-95",
        tone.className,
        BADGE_SIZE_CLASS[size],
        className,
      )}
    >
      <Icon
        className={cn("shrink-0", spinIcon && "animate-spin")}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}

export function OrderStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(ORDER_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      spinIcon={normalizeKey(status) === "processing"}
      size={size}
    />
  );
}

function resolveUserRoleTone(role: string | null | undefined): BadgeTone {
  const key = normalizeKey(role ?? "user");
  return USER_ROLE[key] ?? USER_ROLE.user ?? DEFAULT_TONE;
}

/** User role badge — admin, supplier, client, etc. */
export function UserRoleBadge({
  role,
  className,
  size,
}: {
  role: string | null | undefined;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone = resolveUserRoleTone(role);
  const label = formatSemanticLabel(role ?? "user");
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label}
      className={className}
      size={size}
    />
  );
}

/** Role chip surface classes for select triggers (same tones as UserRoleBadge). */
export function userRoleBadgeClass(role: string | null | undefined): string {
  return resolveUserRoleTone(role).className;
}

/** Audit log action badge — create, update, delete, etc. */
export function AuditActionBadge({
  action,
  className,
  size,
}: {
  action: string;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone = resolveTone(AUDIT_ACTION, action);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={formatSemanticLabel(action)}
      className={className}
      size={size}
    />
  );
}

export function PaymentStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const key = normalizeKey(status);
  const tone = resolveTone(PAYMENT_STATUS, status);
  const displayLabel =
    label ??
    (key === "pending" ? "Unpaid" : formatSemanticLabel(status));
  return (
    <SemanticBadgeBase
      tone={tone}
      label={displayLabel}
      className={className}
      size={size}
    />
  );
}

export function ProductStockStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(PRODUCT_STOCK_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      size={size}
    />
  );
}

/** Active / inactive entity status (category, supplier, warehouse, etc.) */
export function ActiveInactiveBadge({
  active,
  className,
  size,
}: {
  active: boolean;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone = resolveTone(
    ACTIVE_INACTIVE,
    active ? "active" : "inactive",
  );
  return (
    <SemanticBadgeBase
      tone={tone}
      label={active ? "Active" : "Inactive"}
      className={className}
      size={size}
    />
  );
}

/** Warehouse type label (main, secondary, distribution) */
export function WarehouseTypeBadge({
  type,
  className,
  size,
}: {
  type: string;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone = getWarehouseTypeTone(type);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={formatSemanticLabel(type)}
      className={className}
      size={size}
    />
  );
}

export function TicketPriorityBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(TICKET_PRIORITY, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      size={size}
    />
  );
}

export function TicketStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(TICKET_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      spinIcon={normalizeKey(status) === "in_progress"}
      size={size}
    />
  );
}

export function ReviewStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(REVIEW_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      size={size}
    />
  );
}

export function InvoiceStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(INVOICE_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      size={size}
    />
  );
}

export function ImportStatusBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(IMPORT_STATUS, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      spinIcon={normalizeKey(status) === "processing"}
      size={size}
    />
  );
}

/** Bulk import type badge — products, orders, suppliers, categories */
export function ImportTypeBadge({
  status,
  className,
  label,
  size,
}: SemanticBadgeProps) {
  const tone = resolveTone(IMPORT_TYPE, status);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label ?? formatSemanticLabel(status)}
      className={className}
      size={size}
    />
  );
}

/** Product table stock label from available quantity */
export function productStockLabelFromAvailable(available: number): string {
  if (available > 20) return "Available";
  if (available > 0) return "Stock Low";
  return "Stock Out";
}

/**
 * REQ-0138 — text color for available qty (same thresholds as productStockLabelFromAvailable).
 * Available >20 emerald · Stock Low >0 orange · Stock Out red.
 */
export function productStockAvailableTextClass(available: number): string {
  if (available > 20) return "text-emerald-600 dark:text-emerald-400";
  if (available > 0) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function ProductStockFromQuantityBadge({
  available,
  className,
  size,
}: {
  available: number;
  className?: string;
  size?: "compact" | "detail";
}) {
  const label = productStockLabelFromAvailable(available);
  const key =
    available > 20 ? "available" : available > 0 ? "stock_low" : "stock_out";
  return (
    <ProductStockStatusBadge
      status={key}
      label={label}
      className={className}
      size={size}
    />
  );
}

/** REQ-0098 — admin order/invoice table Self vs Client source */
export function AdminOrderSourceBadge({
  source,
  className,
  size = "compact",
}: {
  source: "personal" | "client" | string | null | undefined;
  className?: string;
  size?: "compact" | "detail";
}) {
  const key = source === "personal" ? "personal" : "client";
  const tone = resolveTone(ADMIN_ORDER_SOURCE, key);
  const label = key === "personal" ? "Self" : "Client";
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label}
      className={className}
      size={size}
    />
  );
}

/** REQ-0098 — forecast reorder urgency (low/medium/high/critical) */
export function ForecastUrgencyBadge({
  urgency,
  className,
  size = "compact",
}: {
  urgency: string;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone = resolveTone(FORECAST_URGENCY, urgency);
  return (
    <SemanticBadgeBase
      tone={tone}
      label={formatSemanticLabel(urgency)}
      className={className}
      size={size}
    />
  );
}

/** REQ-0098 — low-stock alert quantity pill e.g. "10 left" */
export function StockQuantityLeftBadge({
  quantity,
  className,
  size = "compact",
}: {
  quantity: number;
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone: BadgeTone =
    quantity <= 0
      ? { className: GLASS_BADGE_CLASS.red, icon: XCircle }
      : quantity <= 20
        ? { className: GLASS_BADGE_CLASS.orange, icon: AlertTriangle }
        : { className: GLASS_BADGE_CLASS.amber, icon: Package };
  return (
    <SemanticBadgeBase
      tone={tone}
      label={`${quantity} left`}
      className={className}
      size={size}
    />
  );
}

/** REQ-0098 — business insights inventory health row */
export function InventoryHealthBadge({
  lowStockItems,
  className,
  size = "compact",
}: {
  lowStockItems: number;
  className?: string;
  size?: "compact" | "detail";
}) {
  const key = lowStockItems > 5 ? "needs_attention" : "healthy";
  const tone = resolveTone(INVENTORY_HEALTH, key);
  const label = key === "needs_attention" ? "Needs Attention" : "Healthy";
  return (
    <SemanticBadgeBase
      tone={tone}
      label={label}
      className={className}
      size={size}
    />
  );
}

/** REQ-0098 — notification dropdown unread "New" pill */
export function NotificationNewBadge({
  className,
  size = "compact",
}: {
  className?: string;
  size?: "compact" | "detail";
}) {
  const tone: BadgeTone = {
    className: GLASS_BADGE_CLASS.rose,
    icon: Sparkles,
  };
  return (
    <SemanticBadgeBase
      tone={tone}
      label="New"
      className={className}
      size={size}
    />
  );
}
