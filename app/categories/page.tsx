import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import CategoriesPage from "@/components/Pages/CategoriesPage";
import { getCategoriesForUser } from "@/lib/server/home-data";

/** REQ-0021 — session shell + Suspense-streamed categories */
export default async function CategoriesRoute() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<CategoriesPage />}>
      <CategoriesPageWithData userId={user.id} />
    </Suspense>
  );
}

async function CategoriesPageWithData({ userId }: { userId: string }) {
  const initialCategories = await getCategoriesForUser(userId);
  return <CategoriesPage initialCategories={initialCategories} />;
}
