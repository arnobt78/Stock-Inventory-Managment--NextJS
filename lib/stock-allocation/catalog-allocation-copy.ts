/**
 * REQ-0102 — shared catalog vs allocated vs unallocated hint copy.
 */
export function formatCatalogAllocationSummary(
  catalogQty: number,
  allocatedTotal: number,
  unallocated: number,
): string {
  return `Catalog ${catalogQty} · allocated ${allocatedTotal} · unallocated ${unallocated}`;
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
  return `${base} · ${reservedCommitment} reserved`;
}
