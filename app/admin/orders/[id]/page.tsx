import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getOrderDetailForPage } from "@/lib/server/order-detail-data";
import { getOrderReviewContextForPage } from "@/lib/server/order-review-context-data";
import { reconcileStripeReturnBeforeDetail } from "@/lib/payments/reconcile-stripe-return";
import AdminOrderDetailContent from "@/components/admin/AdminOrderDetailContent";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; session_id?: string }>;
};

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;

  // REQ-0209 — confirm before SSR detail (no Pending→Confirmed client flash)
  const stripeReturn = await reconcileStripeReturnBeforeDetail(sp);
  if (stripeReturn.shouldRedirect) {
    redirect(`/admin/orders/${id}`);
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
    <AdminOrderDetailContent
      backHref="/admin/orders"
      initialOrder={initialOrder}
      initialReviewContext={initialReviewContext}
    />
  );
}
