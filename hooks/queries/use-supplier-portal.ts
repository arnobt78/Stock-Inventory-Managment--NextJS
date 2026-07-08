/**
 * Admin Supplier Portal query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { SupplierPortalStats } from "@/types";

export function useSupplierPortal(initialData?: SupplierPortalStats) {
  return useQuery({
    queryKey: queryKeys.supplierPortal.overview(),
    queryFn: async () => {
      const response = await apiClient.supplierPortal.getOverview();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
