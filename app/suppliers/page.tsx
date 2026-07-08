import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import SuppliersPage from "@/components/Pages/SuppliersPage";
import { getSuppliersForUser } from "@/lib/server/home-data";

/** REQ-0021 — session shell + Suspense-streamed suppliers */
export default async function SuppliersRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<SuppliersPage />}>
      <SuppliersPageWithData userId={user.id} />
    </Suspense>
  );
}

async function SuppliersPageWithData({ userId }: { userId: string }) {
  const initialSuppliers = await getSuppliersForUser(userId);
  return <SuppliersPage initialSuppliers={initialSuppliers} />;
}
