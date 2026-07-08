"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosInstance";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { BarChart3, Shield, Zap, CheckCircle2 } from "lucide-react";

/**
 * Register Page Component
 * Features:
 * - Split layout with SVG background on left, form on right
 * - Google OAuth integration (placeholder)
 * - Responsive design (mobile-first)
 * - Dynamic toast notifications
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Handle Google OAuth sign-up
   * Redirects to Google OAuth flow
   */
  const handleGoogleSignUp = async () => {
    try {
      // Redirect to OAuth route (same flow as login)
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

  /**
   * Handle form submission for email/password registration
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate password confirmation
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
        // Show success toast
        toast({
          title: "Account Created Successfully! 🎉",
          description: `Welcome, ${name}! Your account has been created. Redirecting to login page...`,
        });

        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login page after a short delay
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
                src="/personal-finance.svg"
                alt="Personal Finance Illustration"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative z-10 max-w-lg w-full space-y-4">
              {/* Main Welcome Card */}
              <div className="rounded-[28px] border border-emerald-400/30 dark:border-white/10 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-lg p-4 sm:p-6">
                <h1 className="text-lg sm:text-xl lg:text-lg sm:text-xl font-semibold text-gray-700 dark:text-white mb-3 tracking-tight text-center">
                  Transform Your Warehouse
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 dark:text-white/80 font-medium leading-relaxed text-center">
                  Build a smarter warehouse with intelligent stock tracking,
                  automated replenishment, and seamless inventory operations.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Feature Card 1 - Speed */}
                <div className="rounded-[20px] border border-sky-400/30 dark:border-white/10 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_20px_60px_rgba(2,132,199,0.3)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(2,132,199,0.4)] hover:border-sky-300/50 dark:hover:border-sky-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-sky-400/30 dark:border-sky-400/20 bg-sky-500/20 dark:bg-sky-500/10 backdrop-blur-sm p-2">
                      <Zap className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <h3 className="text-md font-semibold text-gray-700 dark:text-white">
                      Lightning Fast
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Instant access to your inventory data with real-time
                    updates.
                  </p>
                </div>

                {/* Feature Card 2 - Analytics */}
                <div className="rounded-[20px] border border-amber-400/30 dark:border-white/10 bg-gradient-to-br from-amber-500/30 via-amber-500/15 to-amber-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_20px_60px_rgba(245,158,11,0.25)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(245,158,11,0.35)] hover:border-amber-300/60 dark:hover:border-amber-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-amber-400/30 dark:border-amber-400/20 bg-amber-500/20 dark:bg-amber-500/10 backdrop-blur-sm p-2">
                      <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-md font-semibold text-gray-700 dark:text-white">
                      Smart Analytics
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Make data-driven decisions with comprehensive insights and
                    reports.
                  </p>
                </div>

                {/* Feature Card 3 - Verified */}
                <div className="rounded-[20px] border border-violet-400/30 dark:border-white/10 bg-gradient-to-br from-violet-500/25 via-violet-500/10 to-violet-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_20px_60px_rgba(139,92,246,0.35)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(139,92,246,0.45)] hover:border-violet-300/50 dark:hover:border-violet-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-violet-400/30 dark:border-violet-400/20 bg-violet-500/20 dark:bg-violet-500/10 backdrop-blur-sm p-2">
                      <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-md font-semibold text-gray-700 dark:text-white">
                      Trusted Platform
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Join a proven system trusted by businesses worldwide.
                  </p>
                </div>

                {/* Feature Card 4 - Security */}
                <div className="rounded-[20px] border border-blue-400/30 dark:border-white/10 bg-gradient-to-br from-blue-500/25 via-blue-500/10 to-blue-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_20px_60px_rgba(59,130,246,0.35)] dark:shadow-lg p-4 transition-all hover:shadow-[0_25px_70px_rgba(59,130,246,0.45)] hover:border-blue-300/50 dark:hover:border-blue-300/40">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-xl border border-blue-400/30 dark:border-blue-400/20 bg-blue-500/20 dark:bg-blue-500/10 backdrop-blur-sm p-2">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-md font-semibold text-gray-700 dark:text-white">
                      Enterprise Security
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
                    Your data is protected with industry-leading security
                    standards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-0 sm:p-4 sm:p-6 lg:p-12">
            <div className="w-full max-w-md space-y-4 rounded-[28px] border border-emerald-400/30 dark:border-white/10 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 dark:from-white/5 dark:via-white/5 dark:to-white/5 backdrop-blur-sm shadow-[0_30px_80px_rgba(16,185,129,0.35)] dark:shadow-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-[0_40px_100px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_40px_100px_rgba(16,185,129,0.4)] hover:border-emerald-300/50 dark:hover:border-emerald-300/30">
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl sm:text-lg sm:text-xl font-semibold text-gray-700 dark:text-white text-center">
                  Create Account
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 text-center">
                  Sign up to get started with your inventory dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
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
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-emerald-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
                  />
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
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-emerald-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
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
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-emerald-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
                  />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
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
                    className="w-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-emerald-400/30 dark:border-white/20 text-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
                  />
                </div>

                {/* Sign Up Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/70 via-emerald-500/50 to-emerald-500/30 text-white shadow-[0_15px_35px_rgba(16,185,129,0.45)] backdrop-blur-sm transition duration-200 hover:border-emerald-300/40 hover:from-emerald-500/80 hover:via-emerald-500/60 hover:to-emerald-500/40"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-emerald-400/20 dark:border-white/10" />
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
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full border-emerald-400/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-gray-700 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
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

              {/* Login Link */}
              <div className="text-center text-sm">
                <p className="text-gray-600 dark:text-white/70">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-emerald-600 dark:text-sky-400 hover:text-emerald-700 dark:hover:text-sky-300 transition-colors font-medium"
                  >
                    Sign in
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
