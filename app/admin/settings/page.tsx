/**
 * Admin Settings Page
 * System configuration management
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import Navbar from "@/components/layouts/Navbar";
import { PageContentWrapper } from "@/components/shared";
import { useAuth } from "@/contexts";
import SystemConfigSettings from "@/components/admin/SystemConfigSettings";

export default function AdminSettingsPage() {
  const { user, isCheckingAuth } = useAuth();
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration and auth check
  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    queueMicrotask(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (!isMounted || isCheckingAuth) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Only admin can access this page
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [user, isCheckingAuth, isMounted, router]);

  // Show nothing during SSR
  if (!isMounted) {
    return null;
  }

  // Loading state
  if (isCheckingAuth || !user) {
    return (
      <Navbar>
        <PageContentWrapper>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        </PageContentWrapper>
      </Navbar>
    );
  }

  // Access denied (shouldn't happen but just in case)
  if (user.role !== "admin") {
    return null;
  }

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                System Settings
              </h1>
              <p className="text-muted-foreground">
                Configure application-wide settings
              </p>
            </div>
          </div>

          {/* Settings */}
          <SystemConfigSettings />
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
