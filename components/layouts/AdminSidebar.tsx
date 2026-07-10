"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  History,
  MessageSquare,
  Star,
  Store,
  Truck,
  Users,
  Mail,
  LogOut,
  User,
  FileText,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts";
import { setPostLogoutGoodbye } from "@/lib/auth/post-logout-goodbye";
import { clearAuthToastMarkers } from "@/components/shared/AuthSessionToasts";
import { Button } from "@/components/ui/button";
import { useAdminCounts } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import { DataSlotPulse } from "@/components/shared/DataSlotPulse";

/**
 * Admin sidebar: section headlines + links.
 * Structure per PROJECT_PLAN § 9.16.1: My Store, Product & System Management, Personal Dashboard, System Settings.
 * Dynamic counts beside Client Orders, Client Invoices, Support Tickets, Product Reviews.
 */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Key in admin counts for badge (optional) */
  countKey?:
    | "clientOrders"
    | "clientInvoices"
    | "supportTickets"
    | "productReviews"
    | "products"
    | "warehouses"
    | "suppliers"
    | "clients"
    | "users";
};

const MY_STORE_ITEMS: NavItem[] = [
  {
    href: "/admin/dashboard-overall-insights",
    label: "Store Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
    countKey: "clientOrders",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    icon: FileText,
    countKey: "clientInvoices",
  },
  {
    href: "/admin/support-tickets",
    label: "Support Tickets",
    icon: MessageSquare,
    countKey: "supportTickets",
  },
  {
    href: "/admin/product-reviews",
    label: "Product Reviews",
    icon: Star,
    countKey: "productReviews",
  },
];

const MANAGEMENT_ITEMS: NavItem[] = [
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
    countKey: "products",
  },
  {
    href: "/admin/warehouses",
    label: "Warehouses",
    icon: Warehouse,
    countKey: "warehouses",
  },
  {
    href: "/admin/supplier-portal",
    label: "Supplier Portal",
    icon: Truck,
    countKey: "suppliers",
  },
  {
    href: "/admin/client-portal",
    label: "Client Portal",
    icon: Store,
    countKey: "clients",
  },
  {
    href: "/admin/user-management",
    label: "User Management",
    icon: Users,
    countKey: "users",
  },
  {
    href: "/admin/activity-history",
    label: "Activity History",
    icon: History,
  },
];

const MY_ACTIVITY_ITEMS: NavItem[] = [
  {
    href: "/admin/my-activity",
    label: "My Activity",
    icon: UserCircle,
  },
];

import type { AdminCounts } from "@/types";

export default function AdminSidebar({
  collapsed = false,
  initialCounts,
}: {
  collapsed?: boolean;
  /** SSR-passed sidebar badge counts (REQ-0025) */
  initialCounts?: AdminCounts;
} = {}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const countsQuery = useAdminCounts(initialCounts);
  const counts = countsQuery.data ?? initialCounts;
  const countsLoading = isDataSlotLoading(countsQuery, initialCounts);

  const handleLogout = async () => {
    const userName = user?.name || user?.email?.split("@")[0] || "User";
    clearAuthToastMarkers();
    setPostLogoutGoodbye({ userName });
    localStorage.removeItem("isAuth");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("getSession");
    localStorage.removeItem("prevUserId");
    localStorage.removeItem("stock-inventory-query-cache");
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    window.location.href = "/login";
  };

  const linkClass = (href: string, isSub = false) =>
    cn(
      "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal transition-colors",
      isSub && !collapsed ? "pl-8" : "",
      collapsed ? "justify-center px-0 w-9 h-9 mx-auto" : "",
      pathname === href || (href !== "/admin" && pathname.startsWith(href))
        ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
        : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
    );

  const getCount = (key: NavItem["countKey"]): number | undefined => {
    if (!counts || !key) return undefined;
    return counts[key];
  };

  const renderNavItems = (items: NavItem[], isSub = true) =>
    items.map((item) => {
      const Icon = item.icon;
      const count = getCount(item.countKey);
      const showBadge = item.countKey != null;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={linkClass(item.href, isSub)}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          )}
          {!collapsed && showBadge && (
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-1 py-0.5 text-xs font-medium min-w-[1.25rem] text-center",
                "bg-muted text-muted-foreground",
              )}
              aria-label={
                countsLoading
                  ? "Loading count"
                  : count !== undefined
                    ? `${count} items`
                    : undefined
              }
            >
              {countsLoading ? (
                <DataSlotPulse variant="badge" className="mx-auto" />
              ) : count !== undefined && count > 0 ? (
                count > 99 ? (
                  "99+"
                ) : (
                  count
                )
              ) : null}
            </span>
          )}
        </Link>
      );
    });

  if (collapsed) {
    return (
      <nav
        className="flex min-h-0 flex-col items-center px-2 gap-1"
        aria-label="Admin navigation"
      >
        {renderNavItems(MY_STORE_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(MANAGEMENT_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        {renderNavItems(MY_ACTIVITY_ITEMS)}
        <div className="w-6 border-t border-gray-200/50 dark:border-white/10 my-1" />
        <Link
          href="/admin/settings/email-preferences"
          className={linkClass("/admin/settings/email-preferences", true)}
          title="Email Preferences"
        >
          <Mail className="h-4 w-4 flex-shrink-0" />
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex min-h-0 flex-col p-2 gap-1">
      {/* My Store */}
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        My Store
      </p>
      {renderNavItems(MY_STORE_ITEMS)}

      {/* Product & System Management */}
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        Product & System Management
      </p>
      {renderNavItems(MANAGEMENT_ITEMS)}

      {/* My Activity */}
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        Personal activity
      </p>
      {renderNavItems(MY_ACTIVITY_ITEMS)}

      {/* System Settings */}
      <p className="px-2 pt-2  text-xs font-normal uppercase tracking-wider text-muted-foreground">
        System Settings
      </p>
      <Link
        href="/admin/settings/email-preferences"
        className={linkClass("/admin/settings/email-preferences", true)}
      >
        <Mail className="h-4 w-4 flex-shrink-0" />
        Email Preferences
      </Link>

      {/* Spacer to push user + logout to bottom */}
      {/* <div className="flex-1 min-h-4" /> */}

      {/* User login info */}
      {/* {user && (
        <div className="rounded-lg px-2 py-2 border border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 truncate">
              <p className="font-normal text-foreground truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )} */}

      {/* Logout */}
      {/* <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        Logout
      </Button> */}
    </nav>
  );
}
