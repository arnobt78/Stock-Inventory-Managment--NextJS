/**
 * Shipping query hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  invalidateAfterOrderGraphChange,
  patchOrdersOnShipping,
} from "@/lib/react-query";
import { useToast } from "@/hooks/use-toast";
import type {
  GenerateLabelInput,
  GenerateLabelResponse,
  AddTrackingInput,
  GetRatesInput,
  GetRatesResponse,
} from "@/types";

function applyShippingCachePatch(
  queryClient: ReturnType<typeof useQueryClient>,
  data: GenerateLabelResponse,
): void {
  patchOrdersOnShipping(queryClient, {
    orderId: data.orderId,
    status: data.status || "shipped",
    trackingNumber: data.trackingNumber,
    trackingCarrier: data.trackingCarrier,
    trackingUrl: data.trackingUrl,
    labelUrl: data.labelUrl,
    updatedAt: data.updatedAt,
  });
}

/**
 * Get shipping rates (read-only Shippo quote — no DB/cache; no invalidate needed)
 */
export function useGetShippingRates() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: GetRatesInput): Promise<GetRatesResponse> => {
      const response = await apiClient.shipping.getRates(data);
      return response.data;
    },
    onError: (error: unknown) => {
      toast({
        title: "Shipping Error",
        description: getErrorMessage(error) || "Failed to get shipping rates",
        variant: "destructive",
      });
    },
  });
}

/**
 * Generate shipping label via Shippo
 */
export function useGenerateShippingLabel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: GenerateLabelInput,
    ): Promise<GenerateLabelResponse> => {
      const response = await apiClient.shipping.generateLabel(data);
      return response.data;
    },
    onSuccess: (data: GenerateLabelResponse) => {
      applyShippingCachePatch(queryClient, data);
      invalidateAfterOrderGraphChange(queryClient);

      toast({
        title: "Label Generated",
        description: `Shipping label created. Tracking: ${data.trackingNumber}`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Shipping Error",
        description:
          getErrorMessage(error) || "Failed to generate shipping label",
        variant: "destructive",
      });
    },
  });
}

/**
 * Add manual tracking number
 */
export function useAddTrackingNumber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: AddTrackingInput,
    ): Promise<GenerateLabelResponse> => {
      const response = await apiClient.shipping.addTracking(data);
      return response.data;
    },
    onSuccess: (data: GenerateLabelResponse) => {
      applyShippingCachePatch(queryClient, data);
      invalidateAfterOrderGraphChange(queryClient);

      toast({
        title: "Tracking Added",
        description: `Tracking number ${data.trackingNumber} added successfully`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to add tracking number",
        variant: "destructive",
      });
    },
  });
}
