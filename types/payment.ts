/**
 * Payment-related type definitions
 */

import type { PaymentStatus } from "./order";

/**
 * Checkout session type
 */
export type CheckoutType = "order" | "invoice";

/**
 * Create checkout session input
 */
export interface CreateCheckoutInput {
  type: CheckoutType;
  id: string; // Order ID or Invoice ID
  /** REQ-0152 — dollars to charge; omit = full remaining due */
  amount?: number;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Payment record
 */
export interface PaymentRecord {
  id: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  type: CheckoutType;
  referenceId: string; // Order ID or Invoice ID
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  refundedAt?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Stripe webhook event types we handle
 */
export type StripeWebhookEventType =
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "charge.refunded";

/**
 * Webhook payload for our internal use
 */
export interface WebhookPayload {
  eventType: StripeWebhookEventType;
  sessionId?: string;
  paymentIntentId?: string;
  metadata?: Record<string, string>;
  amount?: number;
  currency?: string;
}
