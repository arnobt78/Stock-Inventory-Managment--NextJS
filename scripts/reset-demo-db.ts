/**
 * Reset Demo Database
 *
 * Wipes all MongoDB data, clears Redis server cache (when configured), and
 * recreates the three login-dropdown demo accounts from lib/auth/demo-seed-users.ts:
 *   test@admin.com    / 12345678 / admin
 *   test@client.com   / 12345678 / client
 *   test@supplier.com / 12345678 / supplier (+ linked "Demo Supplier" entity)
 *
 * Usage (project root, same DATABASE_URL as the app):
 *   npm run script:reset-demo-db
 *   npx tsx scripts/reset-demo-db.ts
 *
 * Optional: pass --skip-redis to skip Upstash cache wipe when Redis env is set.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";
import { deleteAllDbData } from "./lib/delete-all-db-data";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const DEMO_SUPPLIER_NAME = "Demo Supplier";

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

async function seedDemoUsers(hashedPassword: string): Promise<void> {
  const now = new Date();
  const createdByRole: Partial<Record<string, string>> = {};

  for (const spec of DEMO_SEED_USERS) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        name: spec.name,
        username: spec.username,
        password: hashedPassword,
        role: spec.role,
        googleId: spec.googleId,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true, email: true, role: true },
    });
    createdByRole[spec.role] = user.id;
    console.log(`   ✅ ${user.email} (${spec.name}, role: ${user.role})`);
  }

  const supplierUserId = createdByRole.supplier;
  if (supplierUserId) {
    await prisma.supplier.create({
      data: {
        name: DEMO_SUPPLIER_NAME,
        userId: supplierUserId,
        status: true,
        createdBy: supplierUserId,
        updatedBy: supplierUserId,
        updatedAt: now,
      },
    });
    console.log(`   ✅ Supplier "${DEMO_SUPPLIER_NAME}" linked to test@supplier.com`);
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

  console.log("3️⃣  Creating demo accounts...\n");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  await seedDemoUsers(hashedPassword);

  console.log("\n✅ Done. Log in via the role dropdown:");
  console.log(`   Admin:    test@admin.com    / ${DEMO_PASSWORD}`);
  console.log(`   Client:   test@client.com   / ${DEMO_PASSWORD}`);
  console.log(`   Supplier: test@supplier.com / ${DEMO_PASSWORD}\n`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Error:", message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
