/**
 * TanStack Query Provider
 * Wraps the app with QueryClientProvider for server state management
 * Includes persistence for better UX (cache survives page refreshes)
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "./config";
import { getPersister } from "./persister";

/**
 * Props for QueryProvider component
 */
interface QueryProviderProps {
  children: ReactNode;
}

/** Query roots persisted to localStorage — volatile server data excluded (REQ-0133). */
const PERSISTED_QUERY_ROOTS = new Set(["auth", "user"]);

/**
 * QueryProvider component
 * Provides QueryClient to the entire application with persistence
 * Uses useState to ensure single instance per component tree
 * Persists auth/user only — lists/detail/dashboard never rehydrate stale CRUD data
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  const persister = getPersister();

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: "v2.0.2",
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              if (query.state.status !== "success") return false;
              const root = String(query.queryKey[0] ?? "");
              return PERSISTED_QUERY_ROOTS.has(root);
            },
          },
        }}
      >
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
