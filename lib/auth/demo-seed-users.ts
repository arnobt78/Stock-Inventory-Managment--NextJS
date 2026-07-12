/**
 * Canonical demo account definitions for login dropdown + DB seed scripts.
 * Keep in sync: test-accounts.ts (UI), scripts/reset-demo-db.ts (fresh DB).
 */

import { getRoboHashAvatarUrl } from "@/lib/ui/user-avatar-sources";

/** Demo role keys — match LoginRoleSelect + test-accounts.ts. */
export type DemoRoleKey = "guest-user" | "guest-supplier" | "guest-client";

/** Shared password for all demo accounts (login role Select pre-fill). */
export const DEMO_PASSWORD = "12345678";

export type DemoSeedUser = {
  roleKey: DemoRoleKey;
  email: string;
  name: string;
  username: string;
  role: "admin" | "client" | "supplier";
  /** Unique placeholder — avoids sparse googleId index collisions in MongoDB. */
  googleId: string;
  /** Stable robohash profile image for navbar/avatars at seed time. */
  image: string;
};

/** Three demo users wiped + recreated by `npm run script:reset-demo-db`. */
export const DEMO_SEED_USERS: readonly DemoSeedUser[] = [
  {
    roleKey: "guest-user",
    email: "test@admin.com",
    name: "Test Admin",
    username: "testadmin",
    role: "admin",
    googleId: "demo-admin",
    image: getRoboHashAvatarUrl("demo-admin"),
  },
  {
    roleKey: "guest-client",
    email: "test@client.com",
    name: "Test Client",
    username: "testclient",
    role: "client",
    googleId: "demo-client",
    image: getRoboHashAvatarUrl("demo-client"),
  },
  {
    roleKey: "guest-supplier",
    email: "test@supplier.com",
    name: "Test Supplier",
    username: "testsupplier",
    role: "supplier",
    googleId: "demo-supplier",
    image: getRoboHashAvatarUrl("demo-supplier"),
  },
] as const;
