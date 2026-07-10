import {
  BarChart3,
  CreditCard,
  Eye,
  Layers,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Hue tokens for list icon pills — matches auth glass palette (REQ-0031). */
export type AuthListHue = "sky" | "emerald" | "amber" | "violet" | "blue";

export type AuthPanelListItem = {
  id: string;
  icon: LucideIcon;
  hue: AuthListHue;
  title: string;
  description: string;
};

export type AuthPanelCopy = {
  sectionTitle: string;
  sectionLead: string;
  items: AuthPanelListItem[];
};

/** Login left panel — demo roles + platform highlights (REQ-0032: 6 items; REQ-0033: professional copy). */
export const LOGIN_AUTH_PANEL_COPY: AuthPanelCopy = {
  sectionTitle: "Explore Role-Based Portals",
  sectionLead:
    "Select a role from the sign-in dropdown to open each workspace with a pre-configured demo account. Credentials are applied automatically when you choose a role.",
  items: [
    {
      id: "administrator",
      icon: Shield,
      hue: "sky",
      title: "Administrator",
      description:
        "Full platform control across products, orders, invoices, warehouses, and the admin console.",
    },
    {
      id: "client",
      icon: ShoppingBag,
      hue: "emerald",
      title: "Client",
      description:
        "Browse catalogs, place orders, track fulfillment, and pay invoices through the client portal.",
    },
    {
      id: "supplier",
      icon: Store,
      hue: "amber",
      title: "Supplier",
      description:
        "Manage your product catalog, fulfill orders, and monitor revenue and low-stock alerts.",
    },
    {
      id: "roles-access",
      icon: Users,
      hue: "violet",
      title: "Roles & Access",
      description:
        "Client and supplier roles are assigned by administrators. Use User Management to review or update access.",
    },
    {
      id: "orders-fulfillment",
      icon: Package,
      hue: "blue",
      title: "Orders & Fulfillment",
      description:
        "Track orders end to end with invoices, shipping labels, and status updates across your operation.",
    },
    {
      id: "inventory-intelligence",
      icon: Sparkles,
      hue: "sky",
      title: "Inventory Intelligence",
      description:
        "Monitor warehouses, stock levels, low-stock alerts, and AI-powered insights on the admin dashboard.",
    },
  ],
};

/** Register left panel — platform value list (REQ-0032: 6 items). */
export const REGISTER_AUTH_PANEL_COPY: AuthPanelCopy = {
  sectionTitle: "Built for Modern Warehouse Teams",
  sectionLead:
    "Create an admin account to start managing products, orders, and inventory from a single dashboard.",
  items: [
    {
      id: "real-time",
      icon: Eye,
      hue: "sky",
      title: "Real-Time Visibility",
      description:
        "Track stock levels, allocations, and order status as they change across your operation.",
    },
    {
      id: "analytics",
      icon: BarChart3,
      hue: "amber",
      title: "Actionable Analytics",
      description:
        "Turn inventory and sales data into insights that support replenishment and planning decisions.",
    },
    {
      id: "roles",
      icon: Users,
      hue: "violet",
      title: "Role-Based Access",
      description:
        "Separate admin, client, and supplier experiences so each team sees only what they need.",
    },
    {
      id: "security",
      icon: Shield,
      hue: "blue",
      title: "Secure by Design",
      description:
        "Session-based authentication and scoped permissions help keep your business data protected.",
    },
    {
      id: "unified-operations",
      icon: Layers,
      hue: "emerald",
      title: "Unified Operations",
      description:
        "Manage products, categories, suppliers, and warehouses in one connected workspace.",
    },
    {
      id: "integrations",
      icon: CreditCard,
      hue: "amber",
      title: "Integrations Ready",
      description:
        "Stripe payments, email notifications, and optional Redis caching for faster list and detail views.",
    },
  ],
};

export type AuthPanelVariant = "login" | "register";

export function getAuthPanelCopy(variant: AuthPanelVariant): AuthPanelCopy {
  return variant === "login"
    ? LOGIN_AUTH_PANEL_COPY
    : REGISTER_AUTH_PANEL_COPY;
}
