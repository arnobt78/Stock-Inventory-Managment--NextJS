import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import AdminMyActivityContent from "@/components/admin/AdminMyActivityContent";

/**
 * My Activity — self-only dashboard (orders, products, metrics as store owner).
 * REQ-0021 — session shell + Suspense-streamed activity.
 */
export const dynamic = "force-dynamic";

export default async function MyActivityPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminMyActivityContent />}>
      <AdminMyActivityContent />
    </Suspense>
  );
}
