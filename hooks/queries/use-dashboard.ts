/**
 * Dashboard (admin overview) query hooks
 * Query key includes userId so persisted cache is per-user (avoids showing previous user's data after login switch).
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import type { DashboardStats } from "@/types";

export function useDashboard(
  initialData?: DashboardStats | null,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.dashboard.overview(userId),
    queryFn: async () => {
      const response = await apiClient.dashboard.getOverview();
      return response.data;
    },
    enabled: !!userId && enabled,
    ...withInitialData(initialData ?? undefined),
  });
}
