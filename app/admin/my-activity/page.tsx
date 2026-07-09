import { getSession } from "@/lib/auth-server";
import {
  getProductsForUser,
  getCategoriesForUser,
  getSuppliersForUser,
} from "@/lib/server/home-data";
import { getOrdersForUser } from "@/lib/server/orders-data";
import { getWarehousesForUser } from "@/lib/server/warehouses-data";
import { getInvoicesForUser } from "@/lib/server/invoices-data";
import { getUsersForAdmin } from "@/lib/server/users-data";
import AdminMyActivityContent from "@/components/admin/AdminMyActivityContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function MyActivityPage() {
  const user = await getSession();
  if (!user) return null;

  const [
    initialOrders,
    initialProducts,
    initialSuppliers,
    initialWarehouses,
    initialInvoices,
    initialCategories,
    initialUsers,
  ] = await Promise.all([
    getOrdersForUser(user.id),
    getProductsForUser(user.id),
    getSuppliersForUser(user.id),
    getWarehousesForUser(user.id),
    getInvoicesForUser(user.id),
    getCategoriesForUser(user.id),
    getUsersForAdmin(),
  ]);

  return (
    <AdminMyActivityContent
      initialOrders={initialOrders}
      initialProducts={initialProducts}
      initialSuppliers={initialSuppliers}
      initialWarehouses={initialWarehouses}
      initialInvoices={initialInvoices}
      initialCategories={initialCategories}
      initialUsers={initialUsers}
    />
  );
}
