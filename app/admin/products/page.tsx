import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getProductsForUser } from "@/lib/server/home-data";
import AdminProductsContent from "@/components/admin/AdminProductsContent";

/** REQ-0021 — session shell + Suspense-streamed admin products */
export default async function AdminProductsPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminProductsContent />}>
      <AdminProductsPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminProductsPageWithData({ userId }: { userId: string }) {
  const initialProducts = await getProductsForUser(userId);
  return <AdminProductsContent initialProducts={initialProducts} />;
}
