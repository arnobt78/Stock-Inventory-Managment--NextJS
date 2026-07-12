import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getCategoryDetailForPage } from "@/lib/server/category-detail-data";
import { getCachedForecastingSummary } from "@/lib/server/forecasting-data";
import CategoryDetailPage from "@/components/Pages/CategoryDetailPage";
import type { Category } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). REQ-0083 — admin cache-read forecast. */
export const dynamic = "force-dynamic";

export default async function CategoryDetailRoute({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const [initialCategory, initialForecasting] = await Promise.all([
    getCategoryDetailForPage({ id: user.id, role: user.role }, id),
    user.role === "admin"
      ? getCachedForecastingSummary(user.id)
      : Promise.resolve(null),
  ]);
  if (!initialCategory) notFound();

  return (
    <CategoryDetailPage
      initialCategory={initialCategory as unknown as Category}
      initialForecasting={initialForecasting}
    />
  );
}
