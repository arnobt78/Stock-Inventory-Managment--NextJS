import { Shield, Store, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Demo test-account keys for login role Select (REQ-0030). */
export type TestAccountRoleKey = "guest-user" | "guest-supplier" | "guest-client";

/** Credentials for quick demo login — password shared across roles. */
export const testAccounts: Record<
  TestAccountRoleKey,
  { email: string; password: string }
> = {
  "guest-user": {
    email: "test@admin.com",
    password: "12345678",
  },
  "guest-supplier": {
    email: "test@supplier.com",
    password: "12345678",
  },
  "guest-client": {
    email: "test@client.com",
    password: "12345678",
  },
};

export type RoleMetaHue = "sky" | "emerald" | "amber";

/** Icon, label, and Tailwind hue for each demo role row. */
export const roleMeta: Record<
  TestAccountRoleKey,
  { icon: LucideIcon; label: string; hue: RoleMetaHue }
> = {
  "guest-user": {
    icon: Shield,
    label: "Guest User / Admin (test@admin.com)",
    hue: "sky",
  },
  "guest-supplier": {
    icon: Store,
    label: "Supplier (test@supplier.com)",
    hue: "amber",
  },
  "guest-client": {
    icon: ShoppingBag,
    label: "Client (test@client.com)",
    hue: "emerald",
  },
};

export const testAccountRoleKeys = Object.keys(roleMeta) as TestAccountRoleKey[];

/** Icon text color classes per role hue (trigger + menu items). */
export const roleIconClassByHue: Record<RoleMetaHue, string> = {
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
};
