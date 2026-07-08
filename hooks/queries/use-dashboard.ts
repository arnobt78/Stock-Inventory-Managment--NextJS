/**
 * Dashboard (admin overview) query hooks
 * Query key includes userId so persisted cache is per-user (avoids showing previous user's data after login switch).
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import type { DashboardStats } from "@/types";

export function useDashboard(initialData?: DashboardStats | null) {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.dashboard.overview(userId),
    queryFn: async () => {
      const response = await apiClient.dashboard.getOverview();
      return response.data;
    },
    enabled: !!userId,
    ...withInitialData(initialData ?? undefined),
  });
}
