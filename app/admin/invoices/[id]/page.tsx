import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getInvoiceDetailForPage } from "@/lib/server/invoice-detail-data";
import InvoiceDetailPage from "@/components/Pages/InvoiceDetailPage";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const initialInvoice = await getInvoiceDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialInvoice) notFound();

  return (
    <InvoiceDetailPage
      backHref="/admin/invoices"
      embedInAdmin
      initialInvoice={initialInvoice}
    />
  );
}
