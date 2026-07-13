import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ApiDocsPage from "@/components/Pages/ApiDocsPage";

/** REQ-0094 — explicit force-dynamic for shell-first parity. */
export const dynamic = "force-dynamic";

/**
 * API Docs route — server component.
 * If user is not logged in, redirect to login. Otherwise render ApiDocsPage.
 */
export default async function ApiDocsRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return <ApiDocsPage />;
}
