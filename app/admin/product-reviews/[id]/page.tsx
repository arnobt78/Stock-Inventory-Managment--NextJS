import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getProductReviewDetailForPage } from "@/lib/server/product-review-detail-data";
import AdminProductReviewDetailContent from "@/components/admin/AdminProductReviewDetailContent";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminProductReviewDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const initialReview = await getProductReviewDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialReview) notFound();

  return (
    <AdminProductReviewDetailContent initialReview={initialReview} />
  );
}
