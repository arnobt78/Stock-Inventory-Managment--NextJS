/**
 * Admin Client Portal query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { ClientPortalStats } from "@/types";

export function useClientPortal(initialData?: ClientPortalStats) {
  return useQuery({
    queryKey: queryKeys.clientPortal.overview(),
    queryFn: async () => {
      const response = await apiClient.clientPortal.getOverview();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
