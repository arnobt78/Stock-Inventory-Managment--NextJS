/**
 * REQ-0102 — shared catalog vs allocated vs unallocated hint copy.
 * REQ-0138 — capitalized labels in string form (UI uses CatalogAllocationSummaryText for colors).
 */
export function formatCatalogAllocationSummary(
  catalogQty: number,
  allocatedTotal: number,
  unallocated: number,
): string {
  return `Catalog ${catalogQty} · Allocated ${allocatedTotal} · Unallocated ${unallocated}`;
}

/** REQ-0107 — product detail / read-only surfaces with reserved commitment. */
export function formatCatalogAllocationDetailSummary(
  catalogQty: number,
  allocatedTotal: number,
  unallocated: number,
  reservedCommitment: number,
): string {
  const base = formatCatalogAllocationSummary(
    catalogQty,
    allocatedTotal,
    unallocated,
  );
  if (reservedCommitment <= 0) return base;
  return `${base} · ${reservedCommitment} Reserved`;
}

/**
 * REQ-0114 — auto-assign orders commit at catalog level; warehouse row qty unchanged until fulfill.
 * REQ-0138 — capitalize first letter for display consistency.
 */
export function formatCatalogCommitWarehouseHint(catalogCommitted: number): string {
  if (catalogCommitted <= 0) return "";
  return `${catalogCommitted} on catalog orders — warehouse row unchanged until fulfilled`;
}
