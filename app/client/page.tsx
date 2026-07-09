import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getClientDashboard } from "@/lib/server/client-dashboard";
import { getClientCatalogOverview } from "@/lib/server/client-catalog-data";
import ClientPortalPage from "@/components/Pages/ClientPortalPage";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function ClientPortalRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [initialDashboard, initialCatalog] = await Promise.all([
    getClientDashboard(user.id, user.name ?? user.email ?? "Client"),
    getClientCatalogOverview(user.id),
  ]);
  return (
    <ClientPortalPage
      initialDashboard={initialDashboard}
      initialCatalog={initialCatalog}
    />
  );
}
