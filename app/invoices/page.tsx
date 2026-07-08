import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import InvoicesPage from "@/components/Pages/InvoicesPage";
import {
  getInvoicesForUser,
  getInvoicesForClientId,
} from "@/lib/server/invoices-data";

/** REQ-0021 — session shell + Suspense-streamed invoices */
export default async function InvoicesRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<InvoicesPage />}>
      <InvoicesPageWithData userId={user.id} userRole={user.role ?? undefined} />
    </Suspense>
  );
}

async function InvoicesPageWithData({
  userId,
  userRole,
}: {
  userId: string;
  userRole?: string;
}) {
  const initialInvoices =
    userRole === "client"
      ? await getInvoicesForClientId(userId)
      : await getInvoicesForUser(userId);

  return <InvoicesPage initialInvoices={initialInvoices} />;
}
