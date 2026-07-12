/**
 * Create Demo Accounts (legacy — admin + client + supplier)
 *
 * Prefer the all-in-one fresh reset:
 *   npm run script:reset-demo-db
 *
 * Creates missing demo users with full profile; links Test Supplier entity;
 * backfills legacy supplier name and profile fields on existing rows.
 * Does not seed catalog (REQ-0092).
 *
 * Usage:
 *   npx tsx scripts/create-demo-accounts.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";
import { DEMO_SUPPLIER_ENTITY, LEGACY_DEMO_SUPPLIER_NAME } from "@/lib/auth/demo-seed-data";
import {
  ensureTestSupplierEntity,
  upsertDemoUserProfile,
} from "./lib/seed-demo-accounts";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const DEMO_SUPPLIER_EMAIL = "test@supplier.com";

async function main() {
  console.log("\n📦 Create demo accounts (admin + client + supplier)\n");
  console.log("   Tip: for a full wipe + seed use  npm run script:reset-demo-db\n");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const now = new Date();

  for (const spec of DEMO_SEED_USERS) {
    const { id, created } = await upsertDemoUserProfile(
      prisma,
      spec,
      hashedPassword,
      now,
    );

    if (created) {
      console.log(`   ✅ Created ${spec.email} (${spec.name}, role: ${spec.role})`);
    } else {
      console.log(`   ⏭ ${spec.email} exists (id: ${id}) — profile backfill if needed`);
    }
  }

  const supplierUser = await prisma.user.findUnique({
    where: { email: DEMO_SUPPLIER_EMAIL },
    select: { id: true },
  });

  if (supplierUser) {
    const supplier = await ensureTestSupplierEntity(
      prisma,
      supplierUser.id,
      now,
    );

    if (supplier.created) {
      console.log(
        `   ✅ Created "${DEMO_SUPPLIER_ENTITY.name}" and linked to ${DEMO_SUPPLIER_EMAIL}`,
      );
    } else if (supplier.renamed) {
      console.log(
        `   ✅ Renamed "${LEGACY_DEMO_SUPPLIER_NAME}" → "${DEMO_SUPPLIER_ENTITY.name}"`,
      );
    } else {
      console.log(
        `   ⏭ Test Supplier linked to ${DEMO_SUPPLIER_EMAIL}`,
      );
    }
  }

  console.log(`\n   Password for all demo accounts: ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
