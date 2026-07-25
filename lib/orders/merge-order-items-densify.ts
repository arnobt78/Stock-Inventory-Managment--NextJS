/**
 * REQ-0211 — PUT /orders returns thin items (ids/qty/price only).
 * Merging must keep catalog densify (category/supplier/image) or line rows flash.
 */

import type { OrderItem } from "@/types";

/** Drop undefined so `{ ...old, ...patch }` does not wipe densify / dates. */
export function omitUndefinedFields<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key];
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Merge API items onto cached items; prefer next scalars, keep densify when thin.
 * Always returns OrderItem[] so patchDetailCacheMerge stays assignable to Order.items.
 */
export function mergeOrderItemsPreservingDensify(
  previous: OrderItem[] | undefined,
  next: OrderItem[] | undefined,
): OrderItem[] {
  if (next == null) return previous ?? [];
  if (!previous?.length) return next;

  const prevById = new Map(previous.map((item) => [item.id, item]));
  return next.map((item) => {
    const prev = prevById.get(item.id);
    if (!prev) return item;
    return {
      ...prev,
      ...item,
      categoryId: item.categoryId ?? prev.categoryId,
      categoryName: item.categoryName ?? prev.categoryName,
      supplierId: item.supplierId ?? prev.supplierId,
      supplierName: item.supplierName ?? prev.supplierName,
      imageUrl: item.imageUrl ?? prev.imageUrl,
      warehouseId: item.warehouseId ?? prev.warehouseId,
      warehouseName: item.warehouseName ?? prev.warehouseName,
      proportionalAmount: item.proportionalAmount ?? prev.proportionalAmount,
    };
  });
}
