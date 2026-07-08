"use client";

/**
 * Main app navbar: logo, nav links (role-based: admin vs client vs supplier), theme toggle, notifications, profile menu.
 * Role is inferred from user.role or pathname so correct links show before auth finishes (e.g. on refresh).
 */
import React, { useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Settings,
  ChevronDown,
  Bell,
  MessageSquare,
  FileCode,
  Activity,
} from "lucide-react";
import { AiFillProduct } from "react-icons/ai";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useTheme } from "next-themes";
import ScrollControl from "../shared/ScrollControl";
import Footer from "./Footer";
import { NotificationBell } from "../shared";

/**
 * RoboHash fallback avatar URL when user has no custom/Google image.
 * Same user (by name or id) always gets the same robot.
 */
const getRoboHashAvatarUrl = (nameOrId: string): string => {
  return `https://robohash.org/${encodeURIComponent(nameOrId)}.png?size=80x80`;
};

/** Plain dropdown panel: solid background for readability in light and dark mode */
const DROPDOWN_CONTENT_CLASS =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white shadow-lg dark:shadow-black/30 rounded-md";

/** Plain dropdown item: readable text and subtle hover (no heavy gradients) */
const DROPDOWN_ITEM_CLASS =
  "w-full justify-start text-gray-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 ease-in-out px-3 py-3 h-auto min-h-[44px] cursor-pointer focus:bg-gray-100 dark:focus:bg-white/10";

/**
 * Theme toggle component (inline ModeToggle)
 */
function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="h-8 w-8 sm:h-10 sm:w-10 focus-visible:outline-none focus:outline-none focus-visible:ring-0 focus:ring-0"
        >
          <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`w-48 ${DROPDOWN_CONTENT_CLASS}`}
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={DROPDOWN_ITEM_CLASS}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={DROPDOWN_ITEM_CLASS}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={DROPDOWN_ITEM_CLASS}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NavbarProps {
  children?: ReactNode;
}

/**
 * Main Navigation Bar Component with Layout Wrapper
 * Handles navigation, user menu, theme toggle, mobile responsive menu
 * Also provides the layout structure with background and scrolling
 */
export default function Navbar({ children }: NavbarProps) {
  const { user, isCheckingAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);

    try {
      // Get user name before logout (will be cleared after)
      const userName = user?.name || user?.email?.split("@")[0] || "User";

      // Show success toast immediately so the user sees feedback
      toast({
        title: `Goodbye, ${userName}! 👋`,
        description: "You have been logged out successfully. See you soon!",
      });

      // Clear localStorage keys synchronously (no React re-renders).
      localStorage.removeItem("isAuth");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("getSession");
      localStorage.removeItem("prevUserId");
      localStorage.removeItem("stock-inventory-query-cache");

      // Await the server-side logout so the httpOnly session_id cookie is
      // cleared via Set-Cookie BEFORE the browser navigates to /login.
      // (Cookies.remove can't clear httpOnly cookies; only a server
      // response can.)  This is fast — no DB calls, just clears a cookie.
      // We do NOT call logout() from auth context because that would
      // setIsLoggedIn(false) → React re-renders the current page with
      // empty data → "Failed to load" flash.
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      window.location.href = "/login";
      return;
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Handle navigation to a path
   */
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  type NavItem =
    | { label: string; path: string; hasDropdown: false }
    | {
        label: string;
        path: string;
        hasDropdown: true;
        dropdownItems: Array<{ label: string; path: string }>;
      };

  const adminNavItems: NavItem[] = [
    { label: "Dashboard", path: "/", hasDropdown: false },
    { label: "Products", path: "/products", hasDropdown: false },
    { label: "Orders", path: "/orders", hasDropdown: false },
    { label: "Invoices", path: "/invoices", hasDropdown: false },
    { label: "Categories", path: "/categories", hasDropdown: false },
    { label: "Suppliers", path: "/suppliers", hasDropdown: false },
    { label: "Warehouses", path: "/warehouses", hasDropdown: false },
    {
      label: "Business Insights",
      path: "/business-insights",
      hasDropdown: false,
    },
    { label: "Admin Panel", path: "/admin", hasDropdown: false },
  ];

  const clientNavItems: NavItem[] = [
    { label: "Client Portal", path: "/client", hasDropdown: false },
    { label: "Browse Products", path: "/products", hasDropdown: false },
    { label: "My Orders", path: "/orders", hasDropdown: false },
    { label: "My Invoices", path: "/invoices", hasDropdown: false },
  ];

  const supplierNavItems: NavItem[] = [
    { label: "Supplier Portal", path: "/supplier", hasDropdown: false },
    { label: "My Products", path: "/products", hasDropdown: false },
    { label: "View Orders", path: "/orders", hasDropdown: false },
  ];

  // Role from auth when available; else infer from pathname so client/supplier see correct nav on refresh (no admin flash).
  const role =
    user?.role ??
    (pathname?.startsWith("/client")
      ? "client"
      : pathname?.startsWith("/supplier")
        ? "supplier"
        : "user");
  const navItems: NavItem[] =
    role === "client"
      ? clientNavItems
      : role === "supplier"
        ? supplierNavItems
        : adminNavItems;

  /** Home link for logo/brand: admin → /, client → /client, supplier → /supplier */
  const homePath =
    role === "client" ? "/client" : role === "supplier" ? "/supplier" : "/";

  // Avatar: use custom/Google image if present, else RoboHash (same user → same robot)
  const preferredImage =
    user?.image && typeof user.image === "string" && user.image.trim() !== ""
      ? user.image
      : null;
  const avatarUrl =
    preferredImage ||
    (user
      ? getRoboHashAvatarUrl(user?.name || String(user?.id ?? "user"))
      : "");

  // If children prop is provided, wrap with full layout, otherwise just return navbar
  const navbarContent = (
    <header className="sticky top-0 z-50 w-full h-[72px] min-h-[72px] border-b border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-2xl shadow-[0_10px_30px_rgba(2,132,199,0.15)] dark:shadow-[0_10px_30px_rgba(15,23,42,0.25)] will-change-transform transform-gpu">
      {/* Skip to main content - visible on focus for keyboard/screen reader users (WCAG 2.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        Skip to main content
      </a>
      {/* min-w-0 on flex children instead of overflow-x-hidden — hidden overflow-y would clip notification portal ancestors */}
      <div className="mx-auto flex w-full h-full max-w-9xl min-w-0 items-center justify-between gap-2 px-2 sm:px-4 lg:px-6">
        {/* Left Section - Logo and Brand */}
        <div className="flex items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            aria-label="Go to home"
            className="group flex aspect-square size-10 items-center justify-center rounded-xl border border-rose-400/40 dark:border-rose-400/30 bg-gradient-to-br from-rose-500/30 via-rose-500/15 to-rose-500/8 dark:from-rose-500/20 dark:via-rose-500/15 dark:to-rose-500/10 shadow-[0_5px_20px_rgba(225,29,72,0.3)] dark:shadow-[0_5px_20px_rgba(225,29,72,0.25)] backdrop-blur-sm cursor-pointer transition-all duration-200 hover:border-rose-400/60 dark:hover:border-rose-400/40 hover:from-rose-500/40 hover:via-rose-500/20 hover:to-rose-500/10 dark:hover:from-rose-500/30 dark:hover:via-rose-500/20 dark:hover:to-rose-500/15 hover:shadow-[0_10px_35px_rgba(225,29,72,0.5)] dark:hover:shadow-[0_10px_35px_rgba(225,29,72,0.4)]"
            onClick={() => handleNavigation(homePath)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNavigation(homePath);
              }
            }}
          >
            <AiFillProduct className="text-lg sm:text-xl text-rose-600 dark:text-rose-400 transition-transform group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-rose-600 to-gray-900 dark:from-rose-400 dark:to-gray-100 bg-clip-text text-transparent lg:text-xl transition-all duration-300 ease-in-out hover:from-rose-700 hover:to-gray-950 dark:hover:from-rose-300 dark:hover:to-gray-50 cursor-pointer">
            Stockly
          </h1>
        </div>

        {/* Desktop Navigation (XL screens) */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            // API dropdown
            if (item.hasDropdown && "dropdownItems" in item) {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm font-medium text-gray-700 dark:text-muted-foreground will-change-[background,box-shadow,color] transition-[background-image,box-shadow,color] duration-300 ease-in-out hover:text-sky-600 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm hover:shadow-[0_5px_15px_rgba(2,132,199,0.25)] dark:hover:shadow-[0_5px_15px_rgba(255,255,255,0.15)] rounded-md px-3 py-2 border-0 focus:border-0 focus-visible:border-0 focus-visible:ring-0 focus:ring-0 data-[state=open]:border-0"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={2}
                    className="w-48 border border-white/10 dark:border-white/10 bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-gray-700 dark:text-white"
                  >
                    {item.dropdownItems.map((sub) => (
                      <DropdownMenuItem
                        key={sub.path}
                        onSelect={() => handleNavigation(sub.path)}
                        className="text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 cursor-pointer"
                      >
                        {sub.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            // Regular navigation items (including Dashboard)
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(item.path)}
                className="text-sm font-medium text-gray-700 dark:text-muted-foreground will-change-[background,box-shadow,color] transition-[background-image,box-shadow,color] duration-300 ease-in-out hover:text-sky-600 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm hover:shadow-[0_5px_15px_rgba(2,132,199,0.25)] dark:hover:shadow-[0_5px_15px_rgba(255,255,255,0.15)] rounded-md px-3 py-2"
              >
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Right Section - Actions */}
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          {/* Notification Bell - Always render to prevent flickering during auth check */}
          {/* Show skeleton during auth check, then show bell when user is available */}
          {isCheckingAuth ? (
            // Skeleton placeholder during auth check to maintain layout - matches NotificationBell styling
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-rose-400/30 dark:border-rose-400/30 bg-gradient-to-r from-rose-500/25 via-rose-500/15 to-rose-500/10 dark:from-rose-500/25 dark:via-rose-500/15 dark:to-rose-500/10 shadow-[0_10px_30px_rgba(225,29,72,0.2)] backdrop-blur-sm animate-pulse flex items-center justify-center">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-rose-400/50 dark:text-rose-300/50" />
            </div>
          ) : user ? (
            <NotificationBell />
          ) : null}

          {/* Mode Toggle */}
          <ModeToggle />

          {/* Avatar Dropdown (Desktop - LG and above) */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Open account menu"
                  className="relative h-10 w-10 min-h-10 min-w-10 rounded-full border-2 border-sky-400/50 dark:border-white/20 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-sm hover:border-sky-400/70 dark:hover:border-white/30 hover:from-sky-500/35 hover:via-sky-500/15 hover:to-sky-500/8 dark:hover:from-white/15 dark:hover:via-white/15 dark:hover:to-white/8 transition-all duration-200 shadow-[0_5px_20px_rgba(2,132,199,0.3)] hover:shadow-[0_10px_30px_rgba(2,132,199,0.5)] ring-2 ring-sky-400/30 dark:ring-white/20 hover:ring-sky-400/50 dark:hover:ring-white/30 p-0 overflow-hidden focus-visible:outline-none focus:outline-none focus-visible:ring-0 focus:ring-0"
                >
                  {isCheckingAuth ? (
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ) : avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user?.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-700 dark:text-foreground">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-56 ${DROPDOWN_CONTENT_CLASS}`}
              >
                <DropdownMenuLabel className="font-normal px-3 py-2">
                  <div className="flex flex-col ">
                    {user?.name && (
                      <p className="text-sm leading-none text-gray-700 dark:text-white">
                        {user.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/support-tickets");
                    setIsMobileMenuOpen(false);
                  }}
                  className={DROPDOWN_ITEM_CLASS}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Support Tickets</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/settings/email-preferences");
                    setIsMobileMenuOpen(false);
                  }}
                  className={DROPDOWN_ITEM_CLASS}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Email Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/api-docs");
                    setIsMobileMenuOpen(false);
                  }}
                  className={DROPDOWN_ITEM_CLASS}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  <span>API Documentation</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/api-status");
                    setIsMobileMenuOpen(false);
                  }}
                  className={DROPDOWN_ITEM_CLASS}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  <span>API Status</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={DROPDOWN_ITEM_CLASS}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500 dark:text-red-400" />
                  <span className="text-red-500 dark:text-red-400">
                    {isLoggingOut ? "Logging Out..." : "Logout"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile: Burger Menu Only (LG and below) */}
          <div className="flex items-center lg:hidden">
            {/* Burger Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-700 dark:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (LG and below) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-menu-panel"
          role="navigation"
          aria-label="Mobile navigation"
          className="xl:hidden border-t border-white/10 dark:border-white/10 bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-xl max-h-[calc(100vh-3.5rem)] overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-9xl px-2 sm:px-4 lg:px-6 sm:py-6 space-y-2">
            {/* User Email with Avatar */}
            <div className="flex items-center gap-2 px-2 py-2">
              {isCheckingAuth ? (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : (
                avatarUrl && (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-400/50 dark:border-white/20 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/10 dark:via-white/10 dark:to-white/5 backdrop-blur-sm overflow-hidden ring-2 ring-sky-400/30 dark:ring-white/20 shadow-[0_5px_20px_rgba(2,132,199,0.3)]">
                    <Image
                      src={avatarUrl}
                      alt={user?.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                )
              )}
              <div className="flex flex-col">
                {!isCheckingAuth && user?.name && (
                  <p className="text-sm text-gray-700 dark:text-muted-foreground">
                    {user.name}
                  </p>
                )}
                <p className="text-xs text-gray-600 dark:text-muted-foreground">
                  {isCheckingAuth ? "Loading..." : user?.email}
                </p>
              </div>
            </div>

            <Separator className="bg-gray-300/50 dark:bg-white/10" />

            {/* Navigation Items */}
            <nav className="">
              {navItems.map((item) => {
                // API dropdown (mobile: label + sub-links)
                if (item.hasDropdown && "dropdownItems" in item) {
                  return (
                    <div key={item.label} className="">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </p>
                      <div className="pl-4 ">
                        {item.dropdownItems.map((sub) => (
                          <Button
                            key={sub.path}
                            variant="ghost"
                            className="w-full justify-start text-gray-600 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-2.5 h-auto min-h-[40px] text-sm"
                            onClick={() => {
                              handleNavigation(sub.path);
                            }}
                          >
                            {sub.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                }
                // Regular navigation items (including Dashboard)
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-3.5 h-auto min-h-[44px]"
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <Separator className="bg-gray-300/50 dark:bg-white/10" />

            {/* Support Tickets */}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-3.5 h-auto min-h-[44px]"
              onClick={() => {
                router.push("/support-tickets");
                setIsMobileMenuOpen(false);
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Support Tickets
            </Button>

            {/* Email Preferences */}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-3.5 h-auto min-h-[44px]"
              onClick={() => {
                router.push("/settings/email-preferences");
                setIsMobileMenuOpen(false);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Email Preferences
            </Button>

            {/* API Documentation */}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-white/80 hover:backdrop-grey-100 dark:hover:backdrop-white/10 transition-all duration-200 ease-in-out px-3 py-3 h-auto min-h-[44px]"
              onClick={() => {
                router.push("/api-docs");
                setIsMobileMenuOpen(false);
              }}
            >
              <FileCode className="mr-2 h-4 w-4" />
              API Documentation
            </Button>

            {/* API Status */}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-sky-500/10 hover:via-sky-500/5 hover:to-sky-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-3.5 h-auto min-h-[44px]"
              onClick={() => {
                router.push("/api-status");
                setIsMobileMenuOpen(false);
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              API Status
            </Button>

            <Separator className="bg-gray-300/50 dark:bg-white/10" />

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-gradient-to-br hover:from-rose-500/10 hover:via-rose-500/5 hover:to-rose-500/5 dark:hover:from-white/10 dark:hover:via-white/5 dark:hover:to-white/5 hover:backdrop-blur-sm transition-all duration-300 ease-in-out px-3 py-3.5 h-auto min-h-[44px]"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging Out..." : "Logout"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );

  // If children provided, wrap with full layout structure
  if (children) {
    return (
      <div className="flex h-screen overflow-hidden relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
        <ScrollControl />
        {/* Background overlay layer */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>

        <div className="poppins relative z-10 flex h-screen w-full overflow-hidden flex-col">
          {navbarContent}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
            tabIndex={-1}
          >
            <div className="flex-1 flex flex-col">
              <div
                className={
                  pathname?.startsWith("/admin") ||
                  pathname?.startsWith("/business-insights")
                    ? "mx-auto w-full max-w-9xl flex-1 sm:pr-4"
                    : "mx-auto w-full max-w-9xl p-1 sm:p-0 sm:px-4 lg:px-6 sm:py-6 flex-1"
                }
              >
                {children}
              </div>
            </div>
            {!pathname?.startsWith("/admin") && <Footer />}
          </main>
        </div>
      </div>
    );
  }

  // Otherwise just return the navbar (for backward compatibility)
  return navbarContent;
}
