/**
 * Payment API validation schemas
 * REQ-0152 — optional amount for full/partial Stripe checkout (dollars).
 */

import { z } from "zod";

export const createCheckoutBodySchema = z.object({
  type: z.enum(["order", "invoice"], {
    errorMap: () => ({ message: "Type must be order or invoice" }),
  }),
  id: z.string().min(1, "Order or invoice ID is required"),
  /** Charge amount in dollars; omit or equal remaining = pay full balance. */
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutBody = z.infer<typeof createCheckoutBodySchema>;

/**
 * Client-side charge amount vs remaining due (PaymentDialog).
 * Returns error message or null when valid.
 */
export function validateCheckoutChargeAmount(
  amount: number,
  remainingDue: number,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter an amount greater than $0.00";
  }
  if (!Number.isFinite(remainingDue) || remainingDue <= 0) {
    return "Nothing left to pay on this balance";
  }
  // Cent-safe compare
  const amountCents = Math.round(amount * 100);
  const dueCents = Math.round(remainingDue * 100);
  if (amountCents > dueCents) {
    return `Amount cannot exceed remaining due ($${remainingDue.toFixed(2)})`;
  }
  return null;
}
