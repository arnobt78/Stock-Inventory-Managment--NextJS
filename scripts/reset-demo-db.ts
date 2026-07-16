/**
 * Reset Demo Database
 *
 * Wipes all MongoDB data, clears Redis server cache (when configured), and
 * recreates demo accounts from lib/auth/demo-seed-data.ts:
 *   test@admin.com    / 12345678 / admin
 *   test@client.com   / 12345678 / client
 *   test@supplier.com / 12345678 / supplier (+ linked "Test Supplier" entity)
 *
 * Default (REQ-0092): accounts only — empty catalog.
 * Explore seed (REQ-0137): pass --with-catalog for 1–2 rows per entity.
 *
 * Usage:
 *   npm run script:reset-demo-db
 *   npm run script:reset-demo-db -- --with-catalog
 *   npm run script:reset-demo-db -- --skip-redis
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD } from "@/lib/auth/demo-seed-users";
import { deleteAllDbData } from "./lib/delete-all-db-data";
import { seedDemoAccountsOnly } from "./lib/seed-demo-accounts";
import { seedDemoCatalog } from "./lib/seed-demo-catalog";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function clearRedisIfConfigured(skipRedis: boolean): Promise<void> {
  if (skipRedis) {
    console.log("   ⏭ Redis wipe skipped (--skip-redis)\n");
    return;
  }

  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!hasRedis) {
    console.log("   ⏭ Redis not configured — skip cache wipe\n");
    return;
  }

  try {
    const { invalidateAllServerCaches } = await import("@/lib/cache/cache-utils");
    await invalidateAllServerCaches();
    console.log("   ✅ Redis server cache cleared\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`   ⚠ Redis wipe failed (non-fatal): ${message}\n`);
  }
}

async function main() {
  const skipRedis = process.argv.includes("--skip-redis");
  const withCatalog = process.argv.includes("--with-catalog");

  console.log("\n🔄 Reset demo database\n");
  console.log("   ⚠  This deletes ALL data in DATABASE_URL.\n");
  if (withCatalog) {
    console.log("   Mode: accounts + explore catalog (REQ-0137)\n");
  } else {
    console.log("   Mode: accounts only (add --with-catalog for explore data)\n");
  }

  console.log("1️⃣  Deleting all MongoDB documents...\n");
  const counts = await deleteAllDbData(prisma);
  for (const [model, count] of Object.entries(counts)) {
    console.log(`   ${model}: ${count}`);
  }
  console.log("");

  console.log("2️⃣  Clearing Redis cache...\n");
  await clearRedisIfConfigured(skipRedis);

  console.log("3️⃣  Creating demo accounts (users + Test Supplier entity)...\n");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const ids = await seedDemoAccountsOnly(prisma, hashedPassword);

  if (withCatalog) {
    console.log("\n4️⃣  Seeding explore catalog (1–2 rows per entity)...\n");
    const catalog = await seedDemoCatalog(prisma, ids);
    console.log(`   ✅ categories ${catalog.categoryIds.length}`);
    console.log(`   ✅ warehouses ${catalog.warehouseIds.length}`);
    console.log(`   ✅ products ${catalog.productIds.length}`);
    console.log(`   ✅ orders ${catalog.orderIds.length}`);
    console.log(`   ✅ invoices ${catalog.invoiceIds.length}`);
    console.log(`   ✅ tickets ${catalog.ticketIds.length}`);
    console.log(`   ✅ reviews ${catalog.reviewIds.length}`);
    console.log(`   ✅ notifications ${catalog.notificationIds.length}`);
    console.log(`   ✅ transfers ${catalog.transferIds.length}`);
    console.log(`   ✅ imports ${catalog.importIds.length}`);
    console.log(`   ✅ systemConfig ${catalog.systemConfigIds.length}`);
    console.log(`   ✅ audits ${catalog.auditIds.length}`);
  }

  console.log("\n✅ Done. Log in via the role dropdown:");
  console.log(`   Admin:    test@admin.com    / ${DEMO_PASSWORD}`);
  console.log(`   Client:   test@client.com   / ${DEMO_PASSWORD}`);
  console.log(`   Supplier: test@supplier.com / ${DEMO_PASSWORD}`);
  if (withCatalog) {
    console.log("\n   Explore catalog seeded — browse each page for UI QA.\n");
  } else {
    console.log(
      "\n   Catalog empty — run with --with-catalog or: npm run script:seed-demo-catalog\n",
    );
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
