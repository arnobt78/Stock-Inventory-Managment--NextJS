import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import LoginPage from "@/components/Pages/LoginPage";

export const dynamic = "force-dynamic";

/**
 * Login route — server component.
 * If user is already logged in (session cookie), redirect to home.
 * Otherwise render the client LoginPage.
 */
export default async function LoginRoute() {
  const user = await getSession();
  if (user) {
    redirect("/");
  }
  return <LoginPage />;
}
