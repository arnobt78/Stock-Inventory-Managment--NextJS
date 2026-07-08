import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ProductsPage from "@/components/Pages/ProductsPage";
import {
  getProductsForUser,
  getProductsBySupplierId,
  type ProductForHome,
} from "@/lib/server/home-data";
import { getSupplierByUserId } from "@/prisma/supplier";

/** REQ-0021 — session shell + Suspense-streamed products */
export default async function ProductsRoute({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string }>;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialOwnerId = params?.ownerId ?? "";

  return (
    <Suspense
      fallback={
        <ProductsPage
          userRole={user.role ?? undefined}
          initialOwnerId={initialOwnerId}
        />
      }
    >
      <ProductsPageWithData
        userId={user.id}
        userRole={user.role ?? undefined}
        initialOwnerId={initialOwnerId}
      />
    </Suspense>
  );
}

async function ProductsPageWithData({
  userId,
  userRole,
  initialOwnerId,
}: {
  userId: string;
  userRole?: string;
  initialOwnerId: string;
}) {
  let initialProducts: ProductForHome[];

  if (userRole === "client") {
    initialProducts = [];
  } else {
    const [supplier, ownerProducts] = await Promise.all([
      userRole === "supplier" ? getSupplierByUserId(userId) : Promise.resolve(null),
      userRole !== "supplier"
        ? getProductsForUser(userId)
        : Promise.resolve(null as ProductForHome[] | null),
    ]);
    initialProducts =
      userRole === "supplier"
        ? supplier
          ? await getProductsBySupplierId(supplier.id)
          : []
        : (ownerProducts ?? []);
  }

  return (
    <ProductsPage
      initialProducts={initialProducts}
      userRole={userRole}
      initialOwnerId={initialOwnerId}
    />
  );
}
