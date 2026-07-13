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
