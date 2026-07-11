import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getProductDetailForPage } from "@/lib/server/product-detail-data";
import {
  getReviewsForProductPage,
  getReviewEligibilityForProduct,
} from "@/lib/server/product-reviews-detail-data";
import ProductDetailPage from "@/components/Pages/ProductDetailPage";
import { getStockByProductForPage } from "@/lib/server/product-stock-data";
import type { Product } from "@/types";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function ProductDetailRoute({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const [initialProduct, initialReviews, initialEligibility, initialStockByProduct] =
    await Promise.all([
      getProductDetailForPage({ id: user.id, role: user.role }, id),
      getReviewsForProductPage(id, "all"),
      getReviewEligibilityForProduct(user.id, id),
      getStockByProductForPage({ id: user.id, role: user.role }, id),
    ]);
  if (!initialProduct) notFound();

  return (
    <ProductDetailPage
      initialProduct={initialProduct as unknown as Product}
      initialReviews={initialReviews}
      initialEligibility={initialEligibility}
      initialStockByProduct={initialStockByProduct ?? undefined}
    />
  );
}
