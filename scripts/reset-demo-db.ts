/**
 * Reset Demo Database
 *
 * Wipes all MongoDB data, clears Redis server cache (when configured), and
 * recreates demo accounts only from lib/auth/demo-seed-data.ts:
 *   test@admin.com    / 12345678 / admin
 *   test@client.com   / 12345678 / client
 *   test@supplier.com / 12345678 / supplier (+ linked "Test Supplier" entity)
 *
 * No catalog, products, orders, or invoices — add those manually per real workflow.
 *
 * Usage (project root, same DATABASE_URL as the app):
 *   npm run script:reset-demo-db
 *   npx tsx scripts/reset-demo-db.ts
 *
 * Optional: pass --skip-redis to skip Upstash cache wipe when Redis env is set.
 * Optional catalog: npx tsx scripts/lib/seed-demo-catalog.ts (manual / future opt-in).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD } from "@/lib/auth/demo-seed-users";
import { deleteAllDbData } from "./lib/delete-all-db-data";
import { seedDemoAccountsOnly } from "./lib/seed-demo-accounts";

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

  console.log("\n🔄 Reset demo database\n");
  console.log("   ⚠  This deletes ALL data in DATABASE_URL.\n");

  console.log("1️⃣  Deleting all MongoDB documents...\n");
  const counts = await deleteAllDbData(prisma);
  for (const [model, count] of Object.entries(counts)) {
    console.log(`   ${model}: ${count}`);
  }
  console.log("");

  console.log("2️⃣  Clearing Redis cache...\n");
  await clearRedisIfConfigured(skipRedis);

  console.log("3️⃣  Creating demo accounts (users + Test Supplier entity only)...\n");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  await seedDemoAccountsOnly(prisma, hashedPassword);

  console.log("\n✅ Done. Log in via the role dropdown:");
  console.log(`   Admin:    test@admin.com    / ${DEMO_PASSWORD}`);
  console.log(`   Client:   test@client.com   / ${DEMO_PASSWORD}`);
  console.log(`   Supplier: test@supplier.com / ${DEMO_PASSWORD}`);
  console.log("\n   Catalog is empty — create categories/products/orders in the UI.\n");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
