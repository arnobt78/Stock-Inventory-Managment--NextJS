import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { getProductReviewsForAdmin } from "@/lib/server/product-reviews-data";
import AdminProductReviewsContent from "@/components/admin/AdminProductReviewsContent";

/** REQ-0021 — session shell + Suspense-streamed product reviews */
export default async function AdminProductReviewsPage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <Suspense fallback={<AdminProductReviewsContent />}>
      <AdminProductReviewsPageWithData userId={user.id} />
    </Suspense>
  );
}

async function AdminProductReviewsPageWithData({ userId }: { userId: string }) {
  const initialReviews = await getProductReviewsForAdmin(userId);
  return <AdminProductReviewsContent initialReviews={initialReviews} />;
}
