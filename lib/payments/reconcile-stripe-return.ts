/**
 * REQ-0209 — Run Stripe confirm-session during SSR before detail prefetch.
 * Avoids Pending→Confirmed flash: first HTML already has Confirmed + Partial/Paid.
 * Idempotent with webhook / browser confirm (PaymentIntent match).
 */

import { confirmCheckoutSessionById } from "@/lib/payments/confirm-checkout-session";
import { logger } from "@/lib/logger";

export type StripeReturnSearchParams = {
  payment?: string | string[];
  session_id?: string | string[];
};

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * If return URL has payment=success&session_id, sync DB then caller should redirect
 * to the clean detail path (no query) so UI never paints stale Pending.
 * Returns true when caller should redirect.
 */
export async function reconcileStripeReturnBeforeDetail(
  searchParams: StripeReturnSearchParams,
): Promise<{ shouldRedirect: boolean; sessionId?: string }> {
  const payment = firstString(searchParams.payment);
  const sessionId = firstString(searchParams.session_id);

  if (payment !== "success" || !sessionId) {
    return { shouldRedirect: false };
  }

  try {
    const result = await confirmCheckoutSessionById(sessionId);
    if (!result.ok) {
      logger.warn("SSR Stripe return reconcile failed", {
        error: result.error,
        sessionId,
      });
    }
  } catch (err) {
    logger.warn("SSR Stripe return reconcile threw", { error: err, sessionId });
  }

  // Always redirect off success query so client does not re-confirm / flash
  return { shouldRedirect: true, sessionId };
}
