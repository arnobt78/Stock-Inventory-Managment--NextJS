/**
 * REQ-0106/0110/0111 — shared order-line stock validation (client + server-safe).
 * Auto mode: catalog committed available (incl. unallocated pool).
 * Manual mode: per-warehouse quantity − reservedQuantity.
 */

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { fetchStockByProduct } from "@/hooks/queries/use-stock-allocation";
import { getDisplayCommittedQuantity } from "@/lib/products/enrich-product-committed-quantity";
import { getAvailableCatalogForOrder } from "@/lib/products/order-stock-reservation";
import type { StockAllocation } from "@/types";

/** Sentinel for auto-assign warehouse mode (Radix Select requires non-empty value). */
export const AUTO_WAREHOUSE_VALUE = "__auto__";

/** REQ-0126 — warehouse picker label: "Main Warehouse · 20 avail." */
export function formatWarehouseAvailLabel(
  name: string,
  available: number,
): string {
  return `${name} · ${available} avail.`;
}

export type OrderLineAllocationRow = {
  warehouseId: string;
  quantity: number;
  reservedQuantity?: number | null;
  warehouse?: { name?: string | null } | null;
};

export type OrderLineStockProduct = {
  quantity: number;
  reservedQuantity?: number | null;
  /** REQ-0110 — browse/list enrich; fallback when allocation cache empty */
  committedQuantity?: number;
};

export type OrderLineStockMode = "auto" | "manual" | "catalog";

export type ValidateOrderLineStockInput = {
  qty: number;
  product: OrderLineStockProduct;
  allocations: OrderLineAllocationRow[];
  warehouseId?: string | null;
  /** Override; when omitted, inferred via resolveOrderLineHasAllocations */
  hasAllocations?: boolean;
  /** REQ-0110 — manual-pick error label */
  warehouseName?: string | null;
};

export type OrderLineStockValidation = {
  ok: boolean;
  maxQty: number;
  message: string | null;
  mode: OrderLineStockMode;
};

/** Order line item fields used for stock cap validation. */
export type OrderLineStockItem = {
  productId: string;
  quantity?: number;
  warehouseId?: string;
};

/** Map TanStack/API allocation rows for shared validation (REQ-0111). */
export function mapStockAllocationsToOrderLineRows(
  rows: StockAllocation[] | undefined,
): OrderLineAllocationRow[] {
  return (rows ?? []).map((row) => ({
    warehouseId: row.warehouseId,
    quantity: Number(row.quantity),
    reservedQuantity: row.reservedQuantity,
    warehouse: row.warehouse,
  }));
}

/** Build validator input — centralizes committedQuantity + warehouse name (REQ-0111). */
export function buildOrderLineStockValidationInput(
  product: OrderLineStockProduct,
  item: OrderLineStockItem,
  allocations: OrderLineAllocationRow[],
): ValidateOrderLineStockInput {
  const requestedQty =
    item.quantity !== undefined && item.quantity !== null
      ? Number(item.quantity)
      : 0;
  const warehouseId = item.warehouseId;
  const pick = warehouseId
    ? allocations.find((row) => row.warehouseId === warehouseId)
    : undefined;

  return {
    qty: requestedQty,
    product: {
      quantity: Number(product.quantity),
      reservedQuantity: product.reservedQuantity,
      committedQuantity: getDisplayCommittedQuantity(product),
    },
    allocations,
    warehouseId,
    warehouseName: pick?.warehouse?.name,
  };
}

/** Validate one order line from product + item + allocation rows (REQ-0111). */
export function validateOrderLineStockForItem(
  product: OrderLineStockProduct,
  item: OrderLineStockItem,
  allocations: OrderLineAllocationRow[],
): OrderLineStockValidation {
  return validateOrderLineStock(
    buildOrderLineStockValidationInput(product, item, allocations),
  );
}

/**
 * Submit path — ensure allocation cache is fresh before validating (REQ-0111).
 * Uses same queryKey/queryFn as useStockByProduct.
 */
export async function ensureStockAllocationsAndValidate(
  queryClient: QueryClient,
  product: OrderLineStockProduct,
  item: OrderLineStockItem,
): Promise<OrderLineStockValidation> {
  const rows = await queryClient.ensureQueryData({
    queryKey: queryKeys.stockAllocation.byProduct(item.productId),
    queryFn: () => fetchStockByProduct(item.productId),
  });
  return validateOrderLineStockForItem(
    product,
    item,
    mapStockAllocationsToOrderLineRows(rows),
  );
}

/** Catalog-level available for auto-assign orders (REQ-0103 disjoint commitment). */
export function getOrderLineCatalogAvailable(
  catalogQty: number,
  productReserved: number,
  allocationRows: Pick<OrderLineAllocationRow, "reservedQuantity">[],
): number {
  return getAvailableCatalogForOrder(
    catalogQty,
    productReserved,
    allocationRows.map((row) => ({
      reservedQuantity: Number(row.reservedQuantity ?? 0),
    })),
  );
}

/**
 * REQ-0110 — catalog available with committedQuantity fallback when cache empty.
 */
export function getOrderLineCatalogAvailableFromProduct(
  product: OrderLineStockProduct,
  allocationRows: OrderLineAllocationRow[],
): number {
  const catalogQty = Number(product.quantity);
  const productReserved = Number(product.reservedQuantity ?? 0);

  if (allocationRows.length > 0) {
    return getOrderLineCatalogAvailable(
      catalogQty,
      productReserved,
      allocationRows,
    );
  }

  if (product.committedQuantity != null) {
    return Math.max(0, catalogQty - Number(product.committedQuantity));
  }

  return Math.max(0, catalogQty - productReserved);
}

/** REQ-0110 — infer warehouse-tracked product before allocation cache loads. */
export function resolveOrderLineHasAllocations(
  product: OrderLineStockProduct,
  allocationRows: OrderLineAllocationRow[],
): boolean {
  if (allocationRows.length > 0) return true;
  const productReserved = Number(product.reservedQuantity ?? 0);
  const committed = product.committedQuantity;
  return committed != null && committed > productReserved;
}

/** Per-warehouse available for manual pick. */
export function getOrderLineWarehouseAvailable(
  pickQty: number,
  pickReserved: number,
): number {
  return Math.max(0, pickQty - pickReserved);
}

/** Warehouse picker row for order-line manual override (REQ-0112). */
export type OrderLineWarehousePickOption = {
  warehouseId: string;
  name: string;
  available: number;
};

/** Build sorted warehouse options; keeps selected row when avail is 0. */
export function buildOrderLineWarehousePickOptions(
  allocations: OrderLineAllocationRow[],
  selectedWarehouseId?: string | null,
): OrderLineWarehousePickOption[] {
  if (!allocations.length) return [];

  return allocations
    .map((row) => {
      const available = getOrderLineWarehouseAvailable(
        Number(row.quantity),
        Number(row.reservedQuantity ?? 0),
      );
      return {
        warehouseId: row.warehouseId,
        name: row.warehouse?.name ?? "Warehouse",
        available,
      };
    })
    .filter(
      (option) =>
        option.available > 0 || option.warehouseId === selectedWarehouseId,
    )
    .sort((a, b) => b.available - a.available);
}

function resolveManualPick(
  allocations: OrderLineAllocationRow[],
  warehouseId: string,
): OrderLineAllocationRow | undefined {
  return allocations.find((row) => row.warehouseId === warehouseId);
}

function resolveWarehouseLabel(
  pick: OrderLineAllocationRow | undefined,
  warehouseName?: string | null,
): string {
  if (warehouseName?.trim()) return warehouseName.trim();
  if (pick?.warehouse?.name?.trim()) return pick.warehouse.name.trim();
  return "warehouse";
}

/**
 * Validate a single order line quantity against catalog or warehouse caps.
 * Empty/null warehouseId → auto mode when hasAllocations; catalog-only otherwise.
 */
export function validateOrderLineStock(
  input: ValidateOrderLineStockInput,
): OrderLineStockValidation {
  const {
    qty,
    product,
    allocations,
    warehouseId,
    warehouseName,
  } = input;

  const hasAllocations =
    input.hasAllocations ??
    resolveOrderLineHasAllocations(product, allocations);

  const catalogQty = Number(product.quantity);
  const productReserved = Number(product.reservedQuantity ?? 0);
  const isManualPick =
    warehouseId != null &&
    warehouseId !== AUTO_WAREHOUSE_VALUE &&
    String(warehouseId).trim() !== "";

  if (hasAllocations && isManualPick) {
    const pick = resolveManualPick(allocations, warehouseId);
    const maxQty = getOrderLineWarehouseAvailable(
      Number(pick?.quantity ?? 0),
      Number(pick?.reservedQuantity ?? 0),
    );
    if (qty > maxQty) {
      const name = resolveWarehouseLabel(pick, warehouseName);
      return {
        ok: false,
        maxQty,
        message: `Max ${maxQty} at ${name}`,
        mode: "manual",
      };
    }
    return { ok: true, maxQty, message: null, mode: "manual" };
  }

  const maxQty = hasAllocations
    ? getOrderLineCatalogAvailableFromProduct(product, allocations)
    : Math.max(0, catalogQty - productReserved);

  if (qty > maxQty) {
    const message = hasAllocations
      ? `Quantity exceeds catalog available stock. Available: ${maxQty}`
      : `Insufficient stock. Available: ${maxQty}`;
    return {
      ok: false,
      maxQty,
      message,
      mode: hasAllocations ? "auto" : "catalog",
    };
  }

  return {
    ok: true,
    maxQty,
    message: null,
    mode: hasAllocations ? "auto" : "catalog",
  };
}

/** Hint copy for auto-assign warehouse picker. */
export function formatOrderLineAutoAssignHint(maxQty: number): string {
  return `Auto-assign — up to ${maxQty} from catalog (incl. unallocated)`;
}
