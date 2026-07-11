/**
 * Create Demo Accounts (legacy — admin + client + supplier)
 *
 * Prefer the all-in-one fresh reset:
 *   npm run script:reset-demo-db
 *
 * This script only creates missing demo users (skips existing emails).
 * Does not wipe data. Creates admin if missing; links supplier portal entity.
 *
 * Usage:
 *   npx tsx scripts/create-demo-accounts.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_SEED_USERS } from "@/lib/auth/demo-seed-users";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const DEMO_SUPPLIER_NAME = "Demo Supplier";

async function main() {
  console.log("\n📦 Create demo accounts (admin + client + supplier)\n");
  console.log("   Tip: for a full wipe + seed use  npm run script:reset-demo-db\n");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const now = new Date();

  for (const spec of DEMO_SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: spec.email },
      select: { id: true, name: true, role: true },
    });

    if (existing) {
      console.log(
        `   ⏭ ${spec.email} already exists (${existing.name}, role: ${existing.role ?? "—"}). Skipping.`,
      );
      continue;
    }

    await prisma.user.create({
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
    });
    console.log(`   ✅ Created ${spec.email} (${spec.name}, role: ${spec.role})`);
  }

  const supplierUser = await prisma.user.findUnique({
    where: { email: "test@supplier.com" },
    select: { id: true },
  });

  if (supplierUser) {
    const linked = await prisma.supplier.findFirst({
      where: { userId: supplierUser.id },
      select: { id: true, name: true },
    });

    if (linked) {
      console.log(`   ⏭ Supplier "${linked.name}" already linked to test@supplier.com`);
    } else {
      const firstSupplier = await prisma.supplier.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      });

      if (firstSupplier) {
        await prisma.supplier.update({
          where: { id: firstSupplier.id },
          data: {
            userId: supplierUser.id,
            createdBy: supplierUser.id,
            updatedBy: supplierUser.id,
            updatedAt: now,
          },
        });
        console.log(`   ✅ Linked supplier "${firstSupplier.name}" to test@supplier.com`);
      } else {
        await prisma.supplier.create({
          data: {
            name: DEMO_SUPPLIER_NAME,
            userId: supplierUser.id,
            status: true,
            createdBy: supplierUser.id,
            updatedBy: supplierUser.id,
            updatedAt: now,
          },
        });
        console.log(`   ✅ Created "${DEMO_SUPPLIER_NAME}" and linked to test@supplier.com`);
      }
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
