/**
 * Shared SSR prefetch for list-page stat cards (REQ-0025).
 * Admin/user → dashboard; supplier → supplier portal; client → client portal.
 */
import { getDashboardForAdmin } from "@/lib/server/dashboard-data";
import { getSupplierDashboard } from "@/lib/server/supplier-dashboard";
import { getClientDashboard } from "@/lib/server/client-dashboard";
import type {
  DashboardStats,
  SupplierPortalDashboard,
  ClientPortalDashboard,
} from "@/types";

export type ListPageStatsPrefetch = {
  initialStats?: DashboardStats;
  initialSupplierPortal?: SupplierPortalDashboard | null;
  initialClientPortal?: ClientPortalDashboard;
};

type SessionLike = {
  id: string;
  role?: string | null;
  name?: string | null;
  email?: string;
};

/** Dashboard / portal stats for list pages with stat cards (/orders, /invoices, etc.). */
export async function prefetchListPageStats(
  session: SessionLike,
): Promise<ListPageStatsPrefetch> {
  const role = session.role ?? "user";

  if (role === "client") {
    const initialClientPortal = await getClientDashboard(
      session.id,
      session.name ?? session.email ?? "Client",
    );
    return { initialClientPortal };
  }

  if (role === "supplier") {
    const initialSupplierPortal = await getSupplierDashboard(session.id);
    return { initialSupplierPortal };
  }

  const initialStats = await getDashboardForAdmin(session.id);
  return { initialStats };
}
