/**
 * Verify Demo Accounts
 *
 * Lists all users in the DB with email and role. Use after:
 *   npm run script:reset-demo-db
 * or legacy: register admin + create-demo-accounts.ts
 *
 * Usage:
 *   npx tsx scripts/verify-demo-accounts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, role: true, createdAt: true },
  });

  console.log("\n📋 Users in DB:\n");
  if (users.length === 0) {
    console.log("   (none) — Register to create your admin account, then run create-demo-accounts.ts.\n");
    return;
  }

  for (const u of users) {
    const role = u.role ?? "(null)";
    console.log(`   ${u.email}`);
    console.log(`      name: ${u.name}, role: ${role}`);
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const clientCount = users.filter((u) => u.role === "client").length;
  const supplierCount = users.filter((u) => u.role === "supplier").length;

  console.log("\n---");
  console.log(`   Total: ${users.length} user(s)`);
  console.log(`   admin: ${adminCount}, client: ${clientCount}, supplier: ${supplierCount}`);

  if (users.length === 1 && adminCount === 1) {
    console.log("\n   ✓ One admin account — next: run  npx tsx scripts/create-demo-accounts.ts\n");
  } else if (users.length >= 3 && adminCount >= 1 && clientCount >= 1 && supplierCount >= 1) {
    console.log("\n   ✓ Three roles present — you can log in with admin, test@client.com, and test@supplier.com.\n");
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
