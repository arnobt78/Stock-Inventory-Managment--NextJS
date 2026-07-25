import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getInvoiceDetailForPage } from "@/lib/server/invoice-detail-data";
import { getOrderReviewContextForPage } from "@/lib/server/order-review-context-data";
import { reconcileStripeReturnBeforeDetail } from "@/lib/payments/reconcile-stripe-return";
import InvoiceDetailPage from "@/components/Pages/InvoiceDetailPage";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; session_id?: string }>;
};

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;

  const stripeReturn = await reconcileStripeReturnBeforeDetail(sp);
  if (stripeReturn.shouldRedirect) {
    redirect(`/admin/invoices/${id}`);
  }

  const initialInvoice = await getInvoiceDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialInvoice) notFound();

  // REQ-0163 — SSR review context for Order Items Write review (hydrate-safe)
  const productIds =
    initialInvoice.linkedOrderItems
      ?.map((item) => item.productId)
      .filter((pid): pid is string => Boolean(pid)) ?? [];
  const initialReviewContext = await getOrderReviewContextForPage(
    user.id,
    initialInvoice.orderId,
    productIds,
  );

  return (
    <InvoiceDetailPage
      backHref="/admin/invoices"
      embedInAdmin
      initialInvoice={initialInvoice}
      initialReviewContext={initialReviewContext}
    />
  );
}
