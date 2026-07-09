import { getSession } from "@/lib/auth-server";
import { getProductReviewsForAdmin } from "@/lib/server/product-reviews-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import AdminProductReviewsContent from "@/components/admin/AdminProductReviewsContent";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminProductReviewsPage() {
  const user = await getSession();
  if (!user) return null;

  const [initialReviews, listStats] = await Promise.all([
    getProductReviewsForAdmin(user.id),
    prefetchListPageStats(user),
  ]);
  return (
    <AdminProductReviewsContent
      initialReviews={initialReviews}
      initialStats={listStats.initialStats}
    />
  );
}
