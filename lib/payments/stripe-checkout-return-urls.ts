/**
 * REQ-0209 — Build Stripe Checkout success/cancel URLs from the page that started pay.
 * Admin pay → `/admin/orders|invoices/[id]`; store/client → `/orders|invoices/[id]`.
 */

import type { CheckoutType } from "@/types";

export type BuildStripeCheckoutReturnUrlsArgs = {
  origin: string;
  pathname: string;
  type: CheckoutType;
  id: string;
};

/**
 * Pure helper — admin pathname prefix `/admin` when checkout started under admin shell.
 * `{CHECKOUT_SESSION_ID}` is Stripe's template placeholder (literal in the URL).
 */
export function buildStripeCheckoutReturnUrls(
  args: BuildStripeCheckoutReturnUrlsArgs,
): { successUrl: string; cancelUrl: string } {
  const origin = args.origin.replace(/\/$/, "");
  const prefix = args.pathname.startsWith("/admin") ? "/admin" : "";
  const path = `${prefix}/${args.type}s/${args.id}`;
  return {
    successUrl: `${origin}${path}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}${path}?payment=cancelled`,
  };
}
