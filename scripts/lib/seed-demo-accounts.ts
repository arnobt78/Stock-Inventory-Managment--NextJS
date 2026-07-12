/**
 * REQ-0092 — shared accounts-only demo seed (users + global Test Supplier entity).
 * Used by reset-demo-db (after wipe) and create-demo-accounts (incremental).
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import {
  DEMO_SEED_USERS,
  type DemoSeedUser,
} from "@/lib/auth/demo-seed-users";
import {
  DEMO_SUPPLIER_ENTITY,
  DEMO_USER_EMAIL_PREFERENCES,
  LEGACY_DEMO_SUPPLIER_NAME,
} from "@/lib/auth/demo-seed-data";

export type DemoAccountsSeedResult = {
  adminId: string;
  clientId: string;
  supplierUserId: string;
  demoSupplierId: string;
};

/** Build full User create payload for one demo account. */
export function demoUserCreateData(
  spec: DemoSeedUser,
  hashedPassword: string,
  now: Date,
): Prisma.UserCreateInput {
  return {
    email: spec.email,
    name: spec.name,
    username: spec.username,
    password: hashedPassword,
    role: spec.role,
    googleId: spec.googleId,
    image: spec.image,
    emailPreferences:
      DEMO_USER_EMAIL_PREFERENCES as unknown as Prisma.InputJsonValue,
    createdAt: now,
    updatedAt: now,
  };
}

/** Create or backfill profile fields on an existing demo user row. */
export async function upsertDemoUserProfile(
  prisma: PrismaClient,
  spec: DemoSeedUser,
  hashedPassword: string,
  now: Date,
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.user.findUnique({
    where: { email: spec.email },
    select: {
      id: true,
      username: true,
      image: true,
      emailPreferences: true,
    },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: demoUserCreateData(spec, hashedPassword, now),
      select: { id: true },
    });
    return { id: user.id, created: true };
  }

  const needsProfileBackfill =
    !existing.username ||
    !existing.image ||
    existing.emailPreferences == null;

  if (needsProfileBackfill) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username: existing.username ?? spec.username,
        image: existing.image ?? spec.image,
        emailPreferences:
          existing.emailPreferences ??
          (DEMO_USER_EMAIL_PREFERENCES as unknown as Prisma.InputJsonValue),
        updatedAt: now,
      },
    });
  }

  return { id: existing.id, created: false };
}

/** Ensure global Test Supplier entity exists and is fully described. */
export async function ensureTestSupplierEntity(
  prisma: PrismaClient,
  supplierUserId: string,
  now: Date,
): Promise<{ id: string; created: boolean; renamed: boolean }> {
  const linked = await prisma.supplier.findFirst({
    where: { userId: supplierUserId },
    select: { id: true, name: true, description: true, notes: true },
  });

  if (linked) {
    const needsRename = linked.name === LEGACY_DEMO_SUPPLIER_NAME;
    const needsMeta = !linked.description || !linked.notes;

    if (needsRename || needsMeta) {
      await prisma.supplier.update({
        where: { id: linked.id },
        data: {
          ...(needsRename ? { name: DEMO_SUPPLIER_ENTITY.name } : {}),
          description: DEMO_SUPPLIER_ENTITY.description,
          notes: DEMO_SUPPLIER_ENTITY.notes,
          updatedAt: now,
        },
      });
    }

    return { id: linked.id, created: false, renamed: needsRename };
  }

  const created = await prisma.supplier.create({
    data: {
      name: DEMO_SUPPLIER_ENTITY.name,
      description: DEMO_SUPPLIER_ENTITY.description,
      notes: DEMO_SUPPLIER_ENTITY.notes,
      userId: supplierUserId,
      status: DEMO_SUPPLIER_ENTITY.status,
      createdBy: supplierUserId,
      updatedBy: supplierUserId,
      createdAt: now,
      updatedAt: now,
    },
    select: { id: true },
  });

  return { id: created.id, created: true, renamed: false };
}

/**
 * Fresh accounts-only seed after DB wipe: 3 users + Test Supplier entity.
 * Does not create catalog, orders, or invoices (REQ-0092).
 */
export async function seedDemoAccountsOnly(
  prisma: PrismaClient,
  hashedPassword: string,
): Promise<DemoAccountsSeedResult> {
  const now = new Date();
  const createdByRole: Partial<Record<string, string>> = {};

  for (const spec of DEMO_SEED_USERS) {
    const user = await prisma.user.create({
      data: demoUserCreateData(spec, hashedPassword, now),
      select: { id: true, email: true, role: true, name: true },
    });
    createdByRole[spec.role] = user.id;
    console.log(`   ✅ ${user.email} (${user.name}, role: ${user.role})`);
  }

  const adminId = createdByRole.admin;
  const supplierUserId = createdByRole.supplier;
  const clientId = createdByRole.client;

  if (!adminId || !supplierUserId || !clientId) {
    throw new Error("Demo seed: missing admin, supplier, or client user id");
  }

  const supplier = await ensureTestSupplierEntity(prisma, supplierUserId, now);

  console.log(
    `   ✅ Supplier "${DEMO_SUPPLIER_ENTITY.name}" linked to test@supplier.com (description + notes)`,
  );

  return {
    adminId,
    clientId,
    supplierUserId,
    demoSupplierId: supplier.id,
  };
}
