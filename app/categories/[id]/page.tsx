import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getCategoryDetailForPage } from "@/lib/server/category-detail-data";
import CategoryDetailPage from "@/components/Pages/CategoryDetailPage";
import type { Category } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function CategoryDetailRoute({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const initialCategory = await getCategoryDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialCategory) notFound();

  return (
    <CategoryDetailPage
      initialCategory={initialCategory as unknown as Category}
    />
  );
}
