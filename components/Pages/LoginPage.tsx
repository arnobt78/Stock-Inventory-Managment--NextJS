"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { setPostLoginWelcome } from "@/lib/auth/post-login-welcome";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Shield, Loader2, Store, ShoppingBag, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Test account credentials for quick login (demo / production).
 * Main account: test@admin.com (full privileges). Run scripts/update-demo-user.ts --to admin once to migrate existing test@user.com to test@admin.com. Client/supplier for later.
 */
const testAccounts = {
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

/** Role icon + label for test-account dropdown trigger */
const roleMeta: Record<string, { icon: LucideIcon; label: string }> = {
  "guest-user": {
    icon: Shield,
    label: "Guest User / Admin (test@admin.com)",
  },
  "guest-supplier": {
    icon: Store,
    label: "Supplier (test@supplier.com)",
  },
  "guest-client": {
    icon: ShoppingBag,
    label: "Client (test@client.com)",
  },
};

/**
 * Login page client component (uses useSearchParams for OAuth/redirect).
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const { login, isLoggedIn, user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navigatingFromSubmitRef = useRef(false);

  // Redirect if already logged in (e.g. landed on /login with cookie).
  useEffect(() => {
    if (isLoggedIn && !navigatingFromSubmitRef.current) {
      const dest =
        user?.role === "client"
          ? "/client"
          : user?.role === "supplier"
            ? "/supplier"
            : "/";
      window.location.href = dest;
    }
  }, [isLoggedIn, user]);

  // Handle OAuth errors from callback
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "An error occurred during Google sign-in.";

      switch (error) {
        case "oauth_not_configured":
          errorMessage =
            "Google OAuth is not configured. Please contact support.";
          break;
        case "oauth_failed":
          errorMessage =
            "Google sign-in was cancelled or failed. Please try again.";
          break;
        case "invalid_state":
          errorMessage = "Invalid OAuth state. Please try again.";
          break;
        case "no_code":
          errorMessage = "OAuth authorization code missing. Please try again.";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange OAuth token. Please try again.";
          break;
        case "fetch_user_failed":
          errorMessage =
            "Failed to fetch user information from Google. Please try again.";
          break;
        case "no_email":
          errorMessage = "Google account email is required. Please try again.";
          break;
        case "oauth_processing_failed":
        case "oauth_error":
          errorMessage =
            "An error occurred during OAuth processing. Please try again.";
          break;
        default:
          errorMessage = `OAuth error: ${error}. Please try again.`;
      }

      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Clean up URL
      router.replace("/login");
    }
  }, [searchParams, router, toast]);

  /**
   * Handle test account selection from dropdown
   * Auto-fills email and password fields
   */
  const handleRoleSelect = (value: string) => {
    if (value === "clear") {
      setSelectedRole("");
      setEmail("");
      setPassword("");
    } else {
      setSelectedRole(value);
      const account = testAccounts[value as keyof typeof testAccounts];
      if (account) {
        setEmail(account.email);
        setPassword(account.password);
      }
    }
  };

  /**
   * Handle Google OAuth sign-in
   * Redirects to Google OAuth flow
   */
  const handleGoogleSignIn = async () => {
    try {
      // Get callback URL from search params or use default
      const redirectUrl = searchParams.get("redirect") || "/";

      // Redirect to OAuth route with callback parameter
      const oauthUrl = `/api/auth/oauth/google?callback=${encodeURIComponent(
        redirectUrl,
      )}`;

      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      toast({
        title: "OAuth Error",
        description: "Failed to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle form submission for email/password login
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);

      const userName = userData.name || userData.email.split("@")[0] || "User";

      navigatingFromSubmitRef.current = true;
      setIsNavigatingToHome(true);

      setPostLoginWelcome({
        userName,
        role: userData.role ?? "user",
      });

      // Full-page navigation to the correct dashboard for the user's role.
      // window.location.href bypasses the Next.js RSC cache which can contain
      // stale 307 redirects from before login, causing infinite redirect loops.
      const dest =
        userData.role === "client"
          ? "/client"
          : userData.role === "supplier"
            ? "/supplier"
            : "/";
      window.location.href = dest;
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { error?: string }; status?: number };
      };
      const serverMessage = axiosErr?.response?.data?.error;
      toast({
        title: "Login Failed",
        description:
          serverMessage || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Only clear loading when we're not redirecting (error path); on success button keeps Loader2 until unmount
      if (!navigatingFromSubmitRef.current) setIsLoading(false);
    }
  };

  const formDisabled = isLoading || isNavigatingToHome;
  const RoleIcon = selectedRole
    ? (roleMeta[selectedRole]?.icon ?? Users)
    : Users;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)]">
      {/* Background overlay layer - lighter for light mode, darker for dark mode */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),transparent_60%)]"></div>

      <div className="relative z-10 w-full">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Side - SVG Background & Professional Advertising Cards */}
          <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-4 sm:p-6 lg:p-12">
            <div className="absolute inset-0 opacity-25 dark:opacity-20">
              <Image
                src="/stock_inventory.svg"
                alt="Stock Inventory Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative z-10 max-w-2xl w-full space-y-4">
              {/* Main Welcome Card - Demo guide */}
              <div className="rounded-[28px] border border-sky-400/30 dark:border-white/10 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-lg p-4 sm:p-6">
                <h1 className="text-xl lg:text-lg sm:text-xl font-medium text-gray-700 dark:text-white mb-3 tracking-tight text-center">
                  Demo Accounts Guide
                </h1>
                <p className="text-md lg:text-lg text-gray-700 dark:text-white/80 font-medium leading-relaxed text-center">
                  Use the dropdown on the right to sign in as Admin, Client, or
                  Supplier. All demo accounts use password: 12345678.
                </p>
              </div>

              {/* Demo role cards */}
              <div className="grid grid-cols-2 gap-2">
                {/* Admin */}
                <div className="rounded-[20px] border border-sky-400/30 dark:border-white/10 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(2,132,199,0.3)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(2,132,199,0.4)] hover:border-sky-300/50 dark:hover:border-sky-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-sky-400/30 dark:border-sky-400/20 bg-sky-500/20 dark:bg-sky-500/10 backdrop-blur-md p-2">
                      <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-white">
                      Admin
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Full access: products, orders, invoices, warehouses, admin
                    panel. New user registration creates an admin account.
                  </p>
                </div>

                {/* Client */}
                <div className="rounded-[20px] border border-emerald-400/30 dark:border-white/10 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(16,185,129,0.3)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(16,185,129,0.4)] hover:border-emerald-300/50 dark:hover:border-emerald-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-emerald-400/30 dark:border-emerald-400/20 bg-emerald-500/20 dark:bg-emerald-500/10 backdrop-blur-md p-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-white">
                      Client
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Client portal: catalog, your orders, invoices, place order,
                    pay with Stripe. Role set via script for showcase only.
                  </p>
                </div>

                {/* Supplier */}
                <div className="rounded-[20px] border border-amber-400/30 dark:border-white/10 bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(245,158,11,0.25)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(245,158,11,0.35)] hover:border-amber-300/60 dark:hover:border-amber-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-amber-400/30 dark:border-amber-400/20 bg-amber-500/20 dark:bg-amber-500/10 backdrop-blur-md p-2">
                      <Store className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-white">
                      Supplier
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Supplier portal: your products, orders, revenue, low stock.
                    Role and supplier link set via script for showcase only.
                  </p>
                </div>

                {/* New accounts & roles */}
                <div className="rounded-[20px] border border-violet-400/30 dark:border-white/10 bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-violet-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(139,92,246,0.35)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(139,92,246,0.45)] hover:border-violet-300/50 dark:hover:border-violet-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-violet-400/30 dark:border-violet-400/20 bg-violet-500/20 dark:bg-violet-500/10 backdrop-blur-md p-2">
                      <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-white">
                      Accounts & Roles
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    You cannot create client or supplier accounts at sign-up;
                    those roles are applied in the DB via script for demo. As
                    admin, use User Management to view or change user roles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-0 sm:p-4 lg:p-12">
            <div className="w-full max-w-md rounded-[28px] border border-sky-400/30 dark:border-white/10 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-md shadow-[0_30px_80px_rgba(2,132,199,0.35)] dark:shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-[0_40px_100px_rgba(2,132,199,0.5)] dark:hover:shadow-[0_40px_100px_rgba(2,132,199,0.4)] hover:border-sky-300/50 dark:hover:border-sky-300/30">
              <div className="space-y-2 mb-6">
                <h2 className="text-lg sm:text-xl font-medium text-gray-700 dark:text-white text-center">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 text-center">
                  Sign in to your account to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {/* Test account Select — always controlled (value="" when empty) to avoid uncontrolled→controlled warning */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/80">
                    Test Accounts To Login With
                  </label>
                  {/* Login is a static route — mount Select immediately so chevron never flickers (REQ-0028) */}
                  <Select
                    value={selectedRole}
                    onValueChange={handleRoleSelect}
                    disabled={formDisabled}
                    open={roleSelectOpen}
                    onOpenChange={setRoleSelectOpen}
                  >
                    <SelectTrigger
                      data-login-role-select
                      className="w-full gap-2 border-sky-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-sky-400 focus:ring-sky-500/50 [&>svg:last-child]:ml-auto [&>svg:last-child]:shrink-0 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 data-[state=open]:[&>svg:last-child]:rotate-180"
                    >
                      <RoleIcon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedRole
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-gray-500 dark:text-white/50",
                        )}
                      />
                      <span className="flex-1 truncate text-left">
                        {selectedRole
                          ? roleMeta[selectedRole]?.label
                          : "Select Role Based Test Account"}
                      </span>
                    </SelectTrigger>
                    <SelectContent
                      className="border-sky-400/20 dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-md z-[100]"
                      position="popper"
                      sideOffset={5}
                      align="start"
                    >
                      <SelectItem
                        value="guest-user"
                        className="cursor-pointer text-gray-700 dark:text-white focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                      >
                        Guest User / Admin (test@admin.com)
                      </SelectItem>
                      <SelectItem
                        value="guest-supplier"
                        className="cursor-pointer text-gray-700 dark:text-white focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                      >
                        Supplier (test@supplier.com)
                      </SelectItem>
                      <SelectItem
                        value="guest-client"
                        className="cursor-pointer text-gray-700 dark:text-white focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-700 dark:focus:text-white"
                      >
                        Client (test@client.com)
                      </SelectItem>
                      {selectedRole && (
                        <SelectItem
                          value="clear"
                          className="cursor-pointer text-gray-500 dark:text-white/60 opacity-60 focus:bg-sky-100 dark:focus:bg-white/10 focus:text-gray-500 dark:focus:text-white/60"
                        >
                          Clear Selection
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={formDisabled}
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={formDisabled}
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-sky-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]"
                  />
                </div>

                {/* Sign In Button — Loader2 inside button until homepage displays (no overlay) */}
                <Button
                  type="submit"
                  className="w-full rounded-xl border border-sky-400/30 dark:border-sky-400/40 bg-gradient-to-r from-sky-500/70 via-sky-500/50 to-sky-500/30 dark:from-sky-500/80 dark:via-sky-500/60 dark:to-sky-500/40 text-white shadow-[0_15px_35px_rgba(2,132,199,0.45)] backdrop-blur-md transition duration-200 hover:border-sky-300/60 dark:hover:border-sky-300/60 hover:from-sky-500/90 hover:via-sky-500/70 hover:to-sky-500/50 dark:hover:from-sky-500/90 dark:hover:via-sky-500/70 dark:hover:to-sky-500/50 hover:shadow-[0_20px_45px_rgba(2,132,199,0.6)]"
                  disabled={formDisabled}
                >
                  {isNavigatingToHome ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Dashboard…
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In…
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-sky-400/20 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-gray-600 dark:text-white/60">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={formDisabled}
                className="w-full border-sky-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white mb-6"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Register Link */}
              <div className="text-center text-sm">
                <p className="text-gray-600 dark:text-white/70">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
