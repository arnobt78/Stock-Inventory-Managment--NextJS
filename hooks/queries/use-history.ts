/**
 * Import History (Admin History) query hooks
 * Read-only; new rows arrive via product import — invalidateAllRelatedQueries uses history.all
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { ImportHistoryForPage } from "@/types";

export function useHistory(initialData?: ImportHistoryForPage[]) {
  return useQuery({
    queryKey: queryKeys.history.lists(),
    queryFn: async () => {
      const response = await apiClient.importHistory.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/**
 * Fetch a single import history record by ID
 *
 * @param id - Import history record ID
 */
export function useHistoryItem(id: string) {
  return useQuery({
    queryKey: queryKeys.history.detail(id),
    queryFn: async () => {
      const response = await apiClient.importHistory.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}
