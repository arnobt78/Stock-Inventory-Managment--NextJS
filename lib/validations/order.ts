/**
 * Order validation schemas
 * Zod schemas for order-related form validation
 */

import { z } from "zod";

/**
 * Shipping address schema
 */
export const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

/**
 * Billing address schema
 */
export const billingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

/**
 * Order item schema
 */
export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  /** REQ-0068 — optional in Zod; server requires when product has allocations */
  warehouseId: z.string().min(1).optional(),
});

/**
 * Helper function to transform empty address objects to undefined
 */
const transformEmptyAddress = (address: unknown): unknown => {
  if (!address || typeof address !== "object") return address;
  
  const addr = address as Record<string, unknown>;
  const hasRequiredFields = 
    addr.street && typeof addr.street === "string" && addr.street.trim() !== "" &&
    addr.city && typeof addr.city === "string" && addr.city.trim() !== "" &&
    addr.zipCode && typeof addr.zipCode === "string" && addr.zipCode.trim() !== "" &&
    addr.country && typeof addr.country === "string" && addr.country.trim() !== "";
  
  return hasRequiredFields ? address : undefined;
};

/**
 * Create order schema
 */
export const createOrderSchema = z.object({
  clientId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  shippingAddress: z.preprocess(transformEmptyAddress, shippingAddressSchema.optional()),
  billingAddress: z.preprocess(transformEmptyAddress, billingAddressSchema.optional()),
  tax: z.number().nonnegative("Tax must be non-negative").optional(),
  shipping: z.number().nonnegative("Shipping must be non-negative").optional(),
  discount: z.number().nonnegative("Discount must be non-negative").optional(),
  notes: z.string().optional(),
});

/**
 * Update order schema
 */
export const updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded", "partial"]).optional(),
  shippingAddress: shippingAddressSchema.optional(),
  billingAddress: billingAddressSchema.optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z
    .string()
    .url("Invalid tracking URL")
    .optional()
    .or(z.literal("")),
  estimatedDelivery: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  shippedAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  deliveredAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  cancelledAt: z
    .string()
    .datetime()
    .optional()
    .or(z.string().date())
    .or(z.literal("")),
  notes: z.string().optional(),
});

/**
 * Create order form data type
 */
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

/**
 * Update order form data type
 */
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
