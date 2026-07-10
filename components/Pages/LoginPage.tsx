"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { setPostLoginWelcome } from "@/lib/auth/post-login-welcome";
import { testAccounts } from "@/lib/auth/test-accounts";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthInfoPanel } from "@/components/auth/AuthInfoPanel";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";
import { LoginRoleSelect } from "@/components/auth/LoginRoleSelect";
import {
  AUTH_FORM_ROW_STAGGER_MS,
  AUTH_FORM_STAGGER_BASE,
} from "@/components/auth/auth-animation";
import { Loader2, Zap } from "lucide-react";

/**
 * Login page client component (uses useSearchParams for OAuth/redirect).
 * REQ-0030 — shared AuthPageShell, role Select icons, stagger animations.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const { login, isLoggedIn, user } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navigatingFromSubmitRef = useRef(false);

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

      router.replace("/login");
    }
  }, [searchParams, router, toast]);

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

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = searchParams.get("redirect") || "/";
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
      if (!navigatingFromSubmitRef.current) setIsLoading(false);
    }
  };

  const formDisabled = isLoading || isNavigatingToHome;

  const formRowDelay = (row: number) =>
    AUTH_FORM_STAGGER_BASE + row * AUTH_FORM_ROW_STAGGER_MS;

  const leftPanel = <AuthInfoPanel variant="login" />;

  const rightPanel = (
    <AuthAnimatedBlock
      delayMs={AUTH_FORM_STAGGER_BASE}
      className="w-full max-w-md"
    >
      <AuthFormCard variant="login" className="w-full">
        <AuthAnimatedBlock delayMs={formRowDelay(0)} className="space-y-2 mb-6">
          <h2 className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white text-center">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 text-center">
            Sign in to your account to continue
          </p>
        </AuthAnimatedBlock>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <AuthAnimatedBlock delayMs={formRowDelay(1)} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-white/80">
              Test Accounts To Login With
            </label>
            <LoginRoleSelect
              selectedRole={selectedRole}
              onRoleSelect={handleRoleSelect}
              disabled={formDisabled}
            />
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(2)} className="space-y-2">
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
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(3)} className="space-y-2">
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
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(4)}>
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
          </AuthAnimatedBlock>
        </form>

        <AuthAnimatedBlock delayMs={formRowDelay(5)} className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-sky-400/20 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-gray-600 dark:text-white/60">
              Or continue with
            </span>
          </div>
        </AuthAnimatedBlock>

        <AuthAnimatedBlock delayMs={formRowDelay(6)}>
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
        </AuthAnimatedBlock>

        <AuthAnimatedBlock
          delayMs={formRowDelay(7)}
          className="text-center text-sm"
        >
          <p className="text-gray-600 dark:text-white/70">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </AuthAnimatedBlock>
      </AuthFormCard>
    </AuthAnimatedBlock>
  );

  return (
    <AuthPageShell
      illustrationSrc="/stock_inventory.svg"
      illustrationAlt="Stock Inventory Illustration"
      left={leftPanel}
      right={rightPanel}
    />
  );
}
