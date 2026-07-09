import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getEmailPreferencesForUser } from "@/lib/server/email-preferences-data";
import EmailPreferencesPage from "@/components/Pages/EmailPreferencesPage";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function EmailPreferencesRoute() {
  const user = await getSession();
  if (!user) redirect("/login");

  const initialPreferences = await getEmailPreferencesForUser(user.id);
  return <EmailPreferencesPage initialPreferences={initialPreferences} />;
}
