/**
 * REQ-0225 — catalog create/PUT bodies are thin (createdBy id, supplier/category as
 * name strings). Shallow `{...old, ...patch}` wipes object densify → detail remount flash.
 */

import { omitUndefinedFields } from "@/lib/orders/merge-order-items-densify";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** Relation / audit fields that must stay objects when the API returns a name string. */
const OBJECT_DENSIFY_KEYS = [
  "creator",
  "updater",
  "supplier",
  "category",
  "owner",
  "productInsights",
  "categoryInsights",
  "supplierInsights",
  "warehouseInsights",
  "statistics",
] as const;

/**
 * Merge thin mutation response into cached detail without wiping densify objects.
 */
export function mergeCatalogMutationIntoDetail<T extends { id: string }>(
  old: T | undefined,
  patch: T,
): T {
  if (!old) return patch;
  const clean = omitUndefinedFields(
    patch as unknown as Record<string, unknown>,
  );
  const next: Record<string, unknown> = {
    ...(old as unknown as Record<string, unknown>),
    ...clean,
  };
  const prev = old as unknown as Record<string, unknown>;
  for (const key of OBJECT_DENSIFY_KEYS) {
    const prevVal = prev[key];
    const incoming = clean[key];
    if (
      isPlainObject(prevVal) &&
      (incoming === undefined ||
        incoming === null ||
        typeof incoming === "string")
    ) {
      next[key] = prevVal;
    }
  }
  return next as T;
}
