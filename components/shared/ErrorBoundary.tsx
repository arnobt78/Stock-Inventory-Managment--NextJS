"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import { isSentryConfigured } from "@/lib/monitoring/sentry";
import { isRadixPortalRemoveChildError } from "@/lib/monitoring/sentry-config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 * Automatically sends errors to Sentry in production when configured.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Radix Select portal removeChild during App Router nav — recover silently (REQ-0017)
    if (isRadixPortalRemoveChildError(error)) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Radix Select portal teardown race — skip Sentry and crash UI (Safari + Chrome)
    if (
      isRadixPortalRemoveChildError(
        error,
        errorInfo.componentStack ?? undefined,
      )
    ) {
      if (process.env.NODE_ENV === "development") {
        logger.warn(
          "ErrorBoundary: ignored Radix portal removeChild during navigation",
        );
      }
      return;
    }

    // ChunkLoadError fires when a Vercel deploy invalidates a cached JS chunk that the
    // user's stale tab still references. Silently reload once to pick up the new build.
    // A sessionStorage guard prevents an infinite reload loop if the chunk is genuinely missing.
    if (
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to load chunk")
    ) {
      const key = "chunk_reload_attempted";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
      // Already tried once — fall through to normal error handling below
      sessionStorage.removeItem(key);
    }

    logger.error("ErrorBoundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    if (isSentryConfigured()) {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: errorInfo.componentStack },
          custom: { errorBoundary: true },
        },
      });
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-medium text-red-600">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
              >
                Go to home
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for ErrorBoundary
 * For use in functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
