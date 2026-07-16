/**
 * Verify Demo Accounts
 *
 * Lists demo users, profile completeness, and Test Supplier entity.
 * After accounts-only reset (REQ-0092), catalog counts should be 0.
 *
 * Usage:
 *   npx tsx scripts/verify-demo-accounts.ts
 */

import { PrismaClient } from "@prisma/client";
import { DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";

const prisma = new PrismaClient();

const DEMO_SUPPLIER_EMAIL = "test@supplier.com";
const DEMO_EMAILS = DEMO_SEED_USERS.map((u) => u.email);

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] } },
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      name: true,
      role: true,
      username: true,
      image: true,
      emailPreferences: true,
    },
  });

  console.log("\n📋 Demo users in DB:\n");
  if (users.length === 0) {
    console.log("   (none) — run  npm run script:reset-demo-db\n");
    return;
  }

  for (const u of users) {
    const role = u.role ?? "(null)";
    const profileOk =
      Boolean(u.username) && Boolean(u.image) && u.emailPreferences != null;
    console.log(`   ${u.email}`);
    console.log(`      name: ${u.name}, role: ${role}`);
    console.log(
      `      profile: username=${u.username ? "yes" : "no"}, image=${u.image ? "yes" : "no"}, emailPreferences=${u.emailPreferences != null ? "yes" : "no"} ${profileOk ? "✓" : "⚠"}`,
    );
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const clientCount = users.filter((u) => u.role === "client").length;
  const supplierCount = users.filter((u) => u.role === "supplier").length;

  const supplierUser = await prisma.user.findUnique({
    where: { email: DEMO_SUPPLIER_EMAIL },
    select: { id: true },
  });

  const demoSupplier = supplierUser
    ? await prisma.supplier.findFirst({
        where: { userId: supplierUser.id },
        select: { id: true, name: true, description: true, notes: true },
      })
    : null;

  const [
    productCount,
    orderCount,
    categoryCount,
    warehouseCount,
    invoiceCount,
    allocationCount,
    transferCount,
    ticketCount,
    reviewCount,
    notificationCount,
    importCount,
    systemConfigCount,
    auditCount,
    supplierCountEntities,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.category.count(),
    prisma.warehouse.count(),
    prisma.invoice.count(),
    prisma.stockAllocation.count(),
    prisma.stockTransfer.count(),
    prisma.supportTicket.count(),
    prisma.productReview.count(),
    prisma.notification.count(),
    prisma.importHistory.count(),
    prisma.systemConfig.count(),
    prisma.auditLog.count(),
    prisma.supplier.count(),
  ]);

  console.log("\n---");
  console.log(`   Demo users: ${users.length}/3`);
  console.log(`   admin: ${adminCount}, client: ${clientCount}, supplier: ${supplierCount}`);

  if (demoSupplier) {
    console.log(`\n   Test Supplier entity: "${demoSupplier.name}"`);
    console.log(
      `      description: ${demoSupplier.description ? "yes" : "missing"}`,
    );
    console.log(`      notes: ${demoSupplier.notes ? "yes" : "missing"}`);
  } else {
    console.log(
      `\n   ⚠ Test Supplier entity not found (no supplier for ${DEMO_SUPPLIER_EMAIL})`,
    );
  }

  console.log(
    "\n   Catalog counts (0 after accounts-only; populated after --with-catalog / seed-demo-catalog):",
  );
  console.log(`      suppliers: ${supplierCountEntities}`);
  console.log(`      categories: ${categoryCount}`);
  console.log(`      warehouses: ${warehouseCount}`);
  console.log(`      products: ${productCount}`);
  console.log(`      allocations: ${allocationCount}`);
  console.log(`      transfers: ${transferCount}`);
  console.log(`      orders: ${orderCount}`);
  console.log(`      invoices: ${invoiceCount}`);
  console.log(`      tickets: ${ticketCount}`);
  console.log(`      reviews: ${reviewCount}`);
  console.log(`      notifications: ${notificationCount}`);
  console.log(`      imports: ${importCount}`);
  console.log(`      systemConfig: ${systemConfigCount}`);
  console.log(`      audits: ${auditCount}`);

  if (users.length >= 3 && adminCount >= 1 && clientCount >= 1 && supplierCount >= 1) {
    console.log("\n   ✓ Three roles present — login via role dropdown.\n");
  } else {
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
