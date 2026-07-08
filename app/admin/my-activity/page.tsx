import { getSession } from "@/lib/auth-server";
import AdminMyActivityContent from "@/components/admin/AdminMyActivityContent";

/**
 * My Activity — self-only dashboard (orders, products, metrics as store owner).
 * Layout from app/admin/layout.tsx.
 */
export const dynamic = "force-dynamic";

export default async function MyActivityPage() {
  const user = await getSession();
  if (!user) return null;
  return <AdminMyActivityContent />;
}
