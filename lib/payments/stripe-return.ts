/** Session flag set when landing from Stripe checkout success/cancel redirect. */
export const STRIPE_CHECKOUT_RETURN_KEY = "stripe-checkout-return";

/** Mark detail page as post-Stripe return so back nav skips checkout.stripe.com in history. */
export function markStripeCheckoutReturn(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STRIPE_CHECKOUT_RETURN_KEY, "1");
}

/** Returns true once per return; clears the flag. */
export function consumeStripeCheckoutReturn(): boolean {
  if (typeof window === "undefined") return false;
  const had = sessionStorage.getItem(STRIPE_CHECKOUT_RETURN_KEY) === "1";
  if (had) sessionStorage.removeItem(STRIPE_CHECKOUT_RETURN_KEY);
  return had;
}
