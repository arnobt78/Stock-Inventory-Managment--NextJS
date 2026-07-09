/**
 * Build TanStack / API invoice list filters from UI search + status chips.
 */

import type { InvoiceFilters, InvoiceStatus } from "@/types";

export function buildInvoiceListFilters(options: {
  searchTerm: string;
  selectedStatuses: string[];
  scope?: "store";
}): InvoiceFilters | undefined {
  const filters: InvoiceFilters = {};

  if (options.scope === "store") {
    filters.scope = "store";
  }

  const term = options.searchTerm.trim();
  if (term) {
    filters.searchTerm = term;
  }

  if (options.selectedStatuses.length > 0) {
    filters.status = options.selectedStatuses as InvoiceStatus[];
  }

  if (Object.keys(filters).length === 0) {
    return undefined;
  }

  return filters;
}

/** True when SSR initialData matches the unfiltered list (no search/status). */
export function isDefaultInvoiceListFilters(
  filters?: InvoiceFilters,
): boolean {
  if (!filters) return true;
  return (
    !filters.searchTerm && (!filters.status || filters.status.length === 0)
  );
}
