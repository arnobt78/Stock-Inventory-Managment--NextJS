"use client";

/**
 * Defers Radix Select mount until the App Router route is stable.
 * Use on nav-heavy pages and any Select that portals to document.body, so portals
 * tear down cleanly before the next route unmounts (avoids removeChild NotFoundError).
 *
 * REQ-0198 — In dialogs (`enabled={open}`), Select mounts immediately on the same
 * route (no placeholder flash). One-frame defer only after pathname changes.
 * Placeholder should match SelectTrigger height/content when used.
 */

import type { ReactNode } from "react";
import { useDeferredRadixSelect } from "@/hooks/use-deferred-radix-select";

export type DeferredSelectGateRenderProps = {
  showSelect: boolean;
  selectRemountKey: string;
};

export type DeferredSelectGateProps = {
  /** When false, unmount Select (e.g. parent loading skeleton / dialog closed) */
  enabled?: boolean;
  /** Shown until Select may mount; should match Select trigger dimensions */
  placeholder?: ReactNode;
  children: (ctx: DeferredSelectGateRenderProps) => ReactNode;
};

export function DeferredSelectGate({
  enabled = true,
  placeholder = null,
  children,
}: DeferredSelectGateProps) {
  const { showSelect, selectRemountKey } = useDeferredRadixSelect({ enabled });

  if (!showSelect) {
    return placeholder;
  }

  return <>{children({ showSelect, selectRemountKey })}</>;
}
