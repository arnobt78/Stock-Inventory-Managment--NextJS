/**
 * Portal query hooks (supplier and client portals)
 * Query keys include userId so client/supplier see their own data (no cross-user cache).
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import { useAuth } from "@/contexts";
import type {
  SupplierPortalDashboard,
  ClientPortalDashboard,
  ClientCatalogOverview,
  ClientBrowseMeta,
  ClientBrowseProductsResponse,
} from "@/types";

/**
 * Get supplier portal dashboard (keyed by userId so supplier sees own data)
 */
export function useSupplierPortalDashboard(
  initialData?: SupplierPortalDashboard,
) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: queryKeys.portal.supplierDashboard(userId),
    queryFn: async (): Promise<SupplierPortalDashboard> => {
      const response = await apiClient.portal.getSupplierDashboard();
      return response.data;
    },
    enabled: !!userId && user?.role === "supplier",
    staleTime: 1000 * 30,
    ...withInitialData(initialData),
  });
}

export function useClientPortalDashboard(
  initialData?: ClientPortalDashboard,
) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: queryKeys.portal.clientDashboard(userId),
    queryFn: async (): Promise<ClientPortalDashboard> => {
      const response = await apiClient.portal.getClientDashboard();
      return response.data;
    },
    enabled: !!userId && user?.role === "client",
    staleTime: 1000 * 30,
    ...withInitialData(initialData),
  });
}

export function useClientCatalogOverview(
  initialData?: ClientCatalogOverview,
) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: queryKeys.portal.clientCatalogDashboard(userId),
    queryFn: async (): Promise<ClientCatalogOverview> => {
      const response = await apiClient.portal.getClientCatalog();
      return response.data;
    },
    enabled: !!userId && user?.role === "client",
    staleTime: 1000 * 30,
    ...withInitialData(initialData),
  });
}

/**
 * Get client browse meta (product owners + global stats)
 */
export function useClientBrowseMeta(initialData?: ClientBrowseMeta) {
  return useQuery({
    queryKey: queryKeys.portal.clientBrowseMeta(),
    queryFn: async (): Promise<ClientBrowseMeta> => {
      const response = await apiClient.portal.getClientBrowseMeta();
      return response.data;
    },
    staleTime: 1000 * 30,
    ...withInitialData(initialData),
  });
}

/**
 * Get client browse products (by owner, optional supplier/category filter)
 */
export function useClientBrowseProducts(
  params: {
    ownerId: string;
    supplierId?: string;
    categoryId?: string;
  },
  initialData?: ClientBrowseProductsResponse,
) {
  return useQuery({
    queryKey: queryKeys.portal.clientBrowseProducts(params),
    queryFn: async (): Promise<ClientBrowseProductsResponse> => {
      const response = await apiClient.portal.getClientBrowseProducts(params);
      return response.data;
    },
    enabled: !!params.ownerId,
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
    ...withInitialData(initialData),
  });
}
