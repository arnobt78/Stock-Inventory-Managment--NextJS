/**
 * REQ-0137 — seed full explore catalog onto existing demo accounts.
 *
 * Prerequisites: demo users + Test Supplier already exist
 *   (npm run script:reset-demo-db).
 *
 * Usage:
 *   npm run script:seed-demo-catalog
 *   npx tsx scripts/seed-demo-catalog.ts
 *
 * Idempotency: refuses if any Product already exists (re-run reset first).
 */

import { PrismaClient } from "@prisma/client";
import { DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";
import { seedDemoCatalog } from "./lib/seed-demo-catalog";

const prisma = new PrismaClient();

async function resolveDemoIds() {
  const byRole: Partial<Record<string, string>> = {};
  for (const spec of DEMO_SEED_USERS) {
    const user = await prisma.user.findUnique({
      where: { email: spec.email },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new Error(
        `Missing demo user ${spec.email} — run npm run script:reset-demo-db first`,
      );
    }
    byRole[spec.role] = user.id;
  }

  const adminId = byRole.admin;
  const clientId = byRole.client;
  const supplierUserId = byRole.supplier;
  if (!adminId || !clientId || !supplierUserId) {
    throw new Error("Demo seed: missing admin/client/supplier user");
  }

  const demoSupplier = await prisma.supplier.findFirst({
    where: { userId: supplierUserId },
    select: { id: true },
  });
  if (!demoSupplier) {
    throw new Error(
      "Missing Test Supplier entity — run npm run script:reset-demo-db first",
    );
  }

  return {
    adminId,
    clientId,
    supplierUserId,
    demoSupplierId: demoSupplier.id,
  };
}

async function main() {
  console.log("\n🌱 Seed demo explore catalog (REQ-0137)\n");

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.error(
      `   ❌ Refusing: ${existingProducts} product(s) already exist.`,
    );
    console.error(
      "   Run  npm run script:reset-demo-db -- --with-catalog  for a clean full seed,\n" +
        "   or  npm run script:reset-demo-db  then  npm run script:seed-demo-catalog\n",
    );
    process.exit(1);
  }

  const ids = await resolveDemoIds();
  const result = await seedDemoCatalog(prisma, ids);

  console.log("   ✅ Categories:", result.categoryIds.length);
  console.log("   ✅ Warehouses:", result.warehouseIds.length);
  console.log("   ✅ Products:", result.productIds.length);
  console.log("   ✅ Local supplier: Local Parts Co");
  console.log("   ✅ Orders:", result.orderIds.length);
  console.log("   ✅ Invoices:", result.invoiceIds.length);
  console.log("   ✅ Stock transfers:", result.transferIds.length);
  console.log("   ✅ Support tickets:", result.ticketIds.length);
  console.log("   ✅ Product reviews:", result.reviewIds.length);
  console.log("   ✅ Notifications:", result.notificationIds.length);
  console.log("   ✅ Import history:", result.importIds.length);
  console.log("   ✅ System config:", result.systemConfigIds.length);
  console.log("   ✅ Audit logs:", result.auditIds.length);
  console.log("   ✅ Stubs:", JSON.stringify(result.stubCounts));
  console.log("\n✅ Explore seed ready. Log in and browse each page.\n");
  console.log("   Fixtures:");
  console.log("   · Beats SK56 — catalog 50, Main 30 (20 reserved), pending ORD-DEMO-002");
  console.log("   · Sony TV BT23 — catalog 100, Main 50 + Secondary 20, paid ORD-DEMO-001");
  console.log("   · INV-DEMO-002 sent/unpaid · tickets/reviews/notifications seeded\n");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
