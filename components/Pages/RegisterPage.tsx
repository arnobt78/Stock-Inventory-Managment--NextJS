"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_FORM_FIELD_EMERALD,
  AUTH_GOOGLE_BUTTON,
} from "@/components/auth/auth-glass-styles";
import {
  GLASS_BUTTON_ICON_HOVER,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosInstance";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthInfoPanel } from "@/components/auth/AuthInfoPanel";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthAnimatedBlock } from "@/components/auth/AuthAnimatedBlock";
import {
  AUTH_FORM_ROW_STAGGER_MS,
  AUTH_FORM_STAGGER_BASE,
} from "@/components/auth/auth-animation";
import { Sparkles } from "lucide-react";

/**
 * Register page — split layout with promo cards + form.
 * REQ-0030 — shared AuthPageShell, stagger animations, max-w-7xl.
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      const oauthUrl = `/api/auth/oauth/google?callback=/`;
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

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
      });

      if (response.status === 201) {
        toast({
          title: "Account Created Successfully! 🎉",
          description: `Welcome, ${name}! Your account has been created. Redirecting to login page...`,
        });

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error: unknown) {
      const axiosErr = error as {
        response?: { data?: { error?: string }; status?: number };
      };
      const serverMessage = axiosErr?.response?.data?.error;
      toast({
        title: "Registration Failed",
        description:
          serverMessage || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formRowDelay = (row: number) =>
    AUTH_FORM_STAGGER_BASE + row * AUTH_FORM_ROW_STAGGER_MS;

  const leftPanel = <AuthInfoPanel variant="register" />;

  const rightPanel = (
    <AuthAnimatedBlock
      delayMs={AUTH_FORM_STAGGER_BASE}
      className="w-full max-w-md"
    >
      <AuthFormCard variant="register" className="w-full space-y-4">
        <AuthAnimatedBlock delayMs={formRowDelay(0)} className="space-y-2">
          <h2 className="text-sm sm:text-base font-medium text-gray-700 dark:text-white text-center">
            Create Account
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 text-center">
            Sign up to get started with your inventory dashboard
          </p>
        </AuthAnimatedBlock>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthAnimatedBlock delayMs={formRowDelay(1)} className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 dark:text-white/80"
            >
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className={cn("w-full", AUTH_FORM_FIELD_EMERALD)}
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
              className={cn("w-full", AUTH_FORM_FIELD_EMERALD)}
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
              className={cn("w-full", AUTH_FORM_FIELD_EMERALD)}
            />
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(4)} className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700 dark:text-white/80"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className={cn("w-full", AUTH_FORM_FIELD_EMERALD)}
            />
          </AuthAnimatedBlock>

          <AuthAnimatedBlock delayMs={formRowDelay(5)}>
            <Button
              type="submit"
              className={cn(GLASS_BUTTON_ICON_HOVER, "w-full", GLASS_PRIMARY_BUTTON.emerald)}
              disabled={isLoading}
            >
              {isLoading ? (
                "Creating Account..."
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sign Up
                </>
              )}
            </Button>
          </AuthAnimatedBlock>
        </form>

        <AuthAnimatedBlock delayMs={formRowDelay(6)} className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-emerald-400/20 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-2 text-gray-600 dark:text-white/60">
              Or continue with
            </span>
          </div>
        </AuthAnimatedBlock>

        <AuthAnimatedBlock delayMs={formRowDelay(7)}>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className={AUTH_GOOGLE_BUTTON.register}
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
          delayMs={formRowDelay(8)}
          className="text-center text-sm"
        >
          <p className="text-gray-600 dark:text-white/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-600 dark:text-sky-400 hover:text-emerald-700 dark:hover:text-sky-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </AuthAnimatedBlock>
      </AuthFormCard>
    </AuthAnimatedBlock>
  );

  return (
    <AuthPageShell
      illustrationSrc="/personal-finance.svg"
      illustrationAlt="Personal Finance Illustration"
      left={leftPanel}
      right={rightPanel}
    />
  );
}
