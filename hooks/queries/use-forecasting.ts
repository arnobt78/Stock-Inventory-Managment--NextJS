/**
 * Forecasting query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { ForecastingSummary } from "@/types";

/** Demand forecast summary — SSR initialData avoids skeleton on dashboard refresh. */
export function useForecastingSummary(
  initialData?: ForecastingSummary,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.forecasting.summary(),
    queryFn: async (): Promise<ForecastingSummary> => {
      const response = await apiClient.forecasting.getSummary();
      return response.data;
    },
    gcTime: 1000 * 60 * 30,
    enabled: options?.enabled ?? true,
    ...withInitialData(initialData),
  });
}
