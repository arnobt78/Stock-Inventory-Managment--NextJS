import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getOrderDetailForPage } from "@/lib/server/order-detail-data";
import { getOrderReviewContextForPage } from "@/lib/server/order-review-context-data";
import { reconcileStripeReturnBeforeDetail } from "@/lib/payments/reconcile-stripe-return";
import OrderDetailPage from "@/components/Pages/OrderDetailPage";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; session_id?: string }>;
};

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function OrderDetailRoute({ params, searchParams }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;

  // REQ-0209 — confirm Stripe session before SSR so status is Confirmed on first paint
  const stripeReturn = await reconcileStripeReturnBeforeDetail(sp);
  if (stripeReturn.shouldRedirect) {
    redirect(`/orders/${id}`);
  }

  const initialOrder = await getOrderDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialOrder) notFound();

  const productIds =
    initialOrder.items?.map((item) => item.productId).filter(Boolean) ?? [];
  const initialReviewContext = await getOrderReviewContextForPage(
    user.id,
    id,
    productIds as string[],
  );

  return (
    <OrderDetailPage
      initialOrder={initialOrder}
      initialReviewContext={initialReviewContext}
    />
  );
}
