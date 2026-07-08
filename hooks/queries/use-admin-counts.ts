/**
 * Admin sidebar counts — client orders, client invoices, support tickets, product reviews.
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { AdminCounts } from "@/types";

export function useAdminCounts(initialData?: AdminCounts) {
  return useQuery({
    queryKey: queryKeys.admin.counts(),
    queryFn: async () => {
      const response = await apiClient.admin.getCounts();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
