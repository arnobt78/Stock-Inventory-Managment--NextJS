import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ApiStatusPage from "@/components/Pages/ApiStatusPage";

export const dynamic = "force-dynamic";

/**
 * API Status route — SSR session gate; role passed for scoped endpoint probes.
 */
export default async function ApiStatusRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return <ApiStatusPage userRole={user.role ?? "user"} />;
}
