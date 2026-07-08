/**
 * Audit Logs query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { AuditLog, AuditLogFilters } from "@/types";

export type ActivityLogPeriod = "today" | "7days" | "month";

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

/**
 * Get audit logs with filtering and pagination (or period for activity feed).
 */
export function useAuditLogs(
  filters?: AuditLogFilters & {
    page?: number;
    limit?: number;
    period?: ActivityLogPeriod;
  },
  initialData?: AuditLogsResponse,
) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: async (): Promise<AuditLogsResponse> => {
      const response = await apiClient.auditLogs.getAll(filters);
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
