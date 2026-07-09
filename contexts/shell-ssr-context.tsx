"use client";

/**
 * SSR shell data from root layout — notifications for navbar bell (REQ-0025).
 * Passed as hook initialData so first paint shows badge/list without client fetch flash.
 */
import React, { createContext, useContext } from "react";
import type { Notification } from "@/types";

export type ShellSsrData = {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
};

const ShellSsrContext = createContext<ShellSsrData>({});

export function ShellSsrProvider({
  value,
  children,
}: {
  value: ShellSsrData;
  children: React.ReactNode;
}) {
  return (
    <ShellSsrContext.Provider value={value}>{children}</ShellSsrContext.Provider>
  );
}

export function useShellSsr(): ShellSsrData {
  return useContext(ShellSsrContext);
}
