/**
 * REQ-0217 — empty copy for dynamic Select / Command pickers (parity with table
 * "No … found." rows). Entity plural drives both closed-trigger placeholder and
 * open-panel empty body; no TanStack/invalidation impact (presentational only).
 */

export type SelectEmptyEntity =
  | "category"
  | "supplier"
  | "product"
  | "warehouse"
  | "order"
  | "user";

const ENTITY_PLURAL: Record<SelectEmptyEntity, string> = {
  category: "categories",
  supplier: "suppliers",
  product: "products",
  warehouse: "warehouses",
  order: "orders",
  user: "users",
};

/** Closed SelectValue placeholder when the option list is empty. */
export function selectEmptyPlaceholder(entity: SelectEmptyEntity): string {
  return `No ${ENTITY_PLURAL[entity]} found`;
}

/** Open-panel / CommandEmpty body (sentence form, matches table empty cells). */
export function selectEmptyMessage(entity: SelectEmptyEntity): string {
  return `No ${ENTITY_PLURAL[entity]} found.`;
}

/**
 * Prefer empty copy when `count === 0`; otherwise keep the normal invite placeholder.
 * Loading (`isLoading`) keeps the invite so we never flash empty before data arrives.
 */
export function resolveSelectPlaceholder(
  entity: SelectEmptyEntity,
  options: { count: number; isLoading?: boolean; invite: string },
): string {
  if (options.isLoading) return options.invite;
  if (options.count === 0) return selectEmptyPlaceholder(entity);
  return options.invite;
}
