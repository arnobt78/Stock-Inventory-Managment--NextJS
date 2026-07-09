"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  clearPostLoginWelcome,
  getPostLoginWelcome,
  markPostLoginWelcomeShown,
  wasPostLoginWelcomeShown,
} from "@/lib/auth/post-login-welcome";

/**
 * Shows welcome toast once after email/password login lands on role dashboard.
 * Shown-marker prevents React Strict Mode double-mount from skipping the toast.
 */
export function usePostLoginWelcomeToast(): void {
  const { toast } = useToast();

  useEffect(() => {
    if (wasPostLoginWelcomeShown()) return;
    const payload = getPostLoginWelcome();
    if (!payload) return;
    markPostLoginWelcomeShown();
    clearPostLoginWelcome();
    toast({
      title: `Welcome back, ${payload.userName}! 👋`,
      description: "You have successfully logged in. Enjoy your stay!",
    });
  }, [toast]);
}
