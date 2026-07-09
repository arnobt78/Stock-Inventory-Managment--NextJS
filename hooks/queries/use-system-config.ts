/**
 * System Configuration query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { invalidateAllRelatedQueries } from "@/lib/react-query/invalidate-all";
import { useToast } from "@/hooks/use-toast";
import type { SystemConfig, UpdateSystemConfigInput } from "@/types";
import type { SystemConfigForPage } from "@/lib/server/system-config-data";

export type SystemConfigResponse = SystemConfigForPage;

/**
 * Get all system configurations
 */
export function useSystemConfigs(initialData?: SystemConfigResponse) {
  return useQuery({
    queryKey: queryKeys.systemConfig.all(),
    queryFn: async (): Promise<SystemConfigResponse> => {
      const response = await apiClient.systemConfig.getAll();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/**
 * Update system configurations
 */
export function useUpdateSystemConfigs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (configs: UpdateSystemConfigInput[]) => {
      const response = await apiClient.systemConfig.update(configs);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systemConfig.all(),
      });
      invalidateAllRelatedQueries(queryClient);
      toast({
        title: "Settings saved",
        description: "System configuration updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to save settings",
        description:
          getErrorMessage(error) || "Could not update configuration.",
        variant: "destructive",
      });
    },
  });
}
