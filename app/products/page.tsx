import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ProductsPage from "@/components/Pages/ProductsPage";
import {
  getProductsForUser,
  getProductsBySupplierId,
  type ProductForHome,
} from "@/lib/server/home-data";
import {
  getClientBrowseMetaForPage,
  getClientBrowseProductsForPage,
  resolveDefaultBrowseOwnerId,
} from "@/lib/server/client-browse-data";
import { prefetchListPageStats } from "@/lib/server/list-page-stats";
import { getSupplierByUserId } from "@/prisma/supplier";

/** REQ-0025 — blocking SSR prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function ProductsRoute({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const params = await searchParams;
  const initialOwnerId = params?.ownerId ?? "";
  const userRole = user.role ?? undefined;

  let initialProducts: ProductForHome[];
  if (userRole === "client") {
    const browseMeta = await getClientBrowseMetaForPage();
    const ownerId =
      initialOwnerId || (await resolveDefaultBrowseOwnerId(browseMeta));
    const initialBrowseProducts = ownerId
      ? await getClientBrowseProductsForPage(ownerId)
      : undefined;

    return (
      <ProductsPage
        initialProducts={[]}
        userRole={userRole}
        initialOwnerId={ownerId}
        initialBrowseMeta={browseMeta}
        initialBrowseProducts={initialBrowseProducts ?? undefined}
      />
    );
  } else {
    const [supplier, ownerProducts, listStats] = await Promise.all([
      userRole === "supplier"
        ? getSupplierByUserId(user.id)
        : Promise.resolve(null),
      userRole !== "supplier"
        ? getProductsForUser(user.id)
        : Promise.resolve(null as ProductForHome[] | null),
      prefetchListPageStats(user),
    ]);
    initialProducts =
      userRole === "supplier"
        ? supplier
          ? await getProductsBySupplierId(supplier.id)
          : []
        : (ownerProducts ?? []);

    return (
      <ProductsPage
        initialProducts={initialProducts}
        userRole={userRole}
        initialOwnerId={initialOwnerId}
        initialStats={listStats.initialStats}
        initialSupplierPortal={listStats.initialSupplierPortal}
      />
    );
  }
}
