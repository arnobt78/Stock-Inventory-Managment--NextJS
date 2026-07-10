"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { APP_SHELL_WIDTH_CLASS } from "@/lib/ui/shell-layout-styles";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { setPostLogoutGoodbye } from "@/lib/auth/post-logout-goodbye";
import { clearAuthToastMarkers } from "@/components/shared/AuthSessionToasts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SafeAvatarImage } from "@/components/ui/safe-avatar-image";
import { resolveUserAvatarSources } from "@/lib/ui/user-avatar-sources";

/**
 * Reusable sidebar layout: fixed left sidebar (always visible, no scroll), scrollable right main content.
 * Use for Admin, Business Insights, and similar dashboard-style pages.
 */

const SIDEBAR_NAV_ITEMS: {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/products", label: "Products", icon: Package },
  { path: "/orders", label: "Orders", icon: ShoppingCart },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/categories", label: "Categories", icon: Tag },
  { path: "/suppliers", label: "Suppliers", icon: Users },
  { path: "/warehouses", label: "Warehouses", icon: Warehouse },
  { path: "/business-insights", label: "Business Insights", icon: TrendingUp },
  { path: "/admin", label: "Admin", icon: Settings },
  { path: "/api-status", label: "API Status", icon: Activity },
  { path: "/api-docs", label: "API Docs", icon: FileText },
  {
    path: "/settings/email-preferences",
    label: "Email Preferences",
    icon: Mail,
  },
];

export interface SidebarLayoutProps {
  children: ReactNode;
  /** Optional title shown at top of sidebar (e.g. app name) */
  sidebarTitle?: string;
}

export default function SidebarLayout({
  children,
  sidebarTitle = "Stock Inventory",
}: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isCheckingAuth } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
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
      return;
    } catch {
      // logout redirect is best-effort
    } finally {
      setIsLoggingOut(false);
    }
  };

  const avatar = resolveUserAvatarSources(user);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        Skip to main content
      </a>
      {/* Left sidebar: fixed width, full height, no scroll (content fits or is clipped) */}
      <aside
        className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col gap-1 p-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            {sidebarTitle}
          </Link>
          <Link
            href="/"
            className="rounded-lg px-2 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <Separator className="bg-gray-200/50 dark:bg-white/10" />
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden p-2">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator className="bg-gray-200/50 dark:bg-white/10" />
        <div className="flex flex-shrink-0 flex-col gap-1 p-2">
          {!isCheckingAuth && user && (
            <>
              <div className="flex items-center gap-2 rounded-lg px-2 py-2">
                {avatar ? (
                  <SafeAvatarImage
                    src={avatar.src}
                    fallbackSrc={avatar.fallbackSrc}
                    alt={user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sm font-medium text-sky-700 dark:text-sky-300">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
                <span
                  className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-400"
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out…" : "Logout"}
              </Button>
            </>
          )}
        </div>
      </aside>
      {/* Right main content: scrollable */}
      <main
        id="main-content"
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
        tabIndex={-1}
      >
        <div className={`${APP_SHELL_WIDTH_CLASS} p-2 sm:p-4 sm:py-6`}>
          {children}
        </div>
      </main>
    </div>
  );
}
