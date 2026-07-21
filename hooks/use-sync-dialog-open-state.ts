"use client";

/**
 * REQ-0198 — Sync dialog form fields during render when `open` flips true
 * (or content key changes while open). Same idea as TicketReassignDialog
 * wasOpen — no useEffect/queueMicrotask second paint (open bounce).
 */

import { useState } from "react";

/**
 * @param open - Controlled dialog open flag
 * @param onOpen - Reset/sync fields from props (called during render when needed)
 * @param contentKey - Optional entity id / mode so edit target changes re-sync while open
 */
export function useSyncDialogOpenState(
  open: boolean,
  onOpen: () => void,
  contentKey?: string | null,
): void {
  const key = open ? `open:${contentKey ?? ""}` : "closed";
  const [wasKey, setWasKey] = useState(key);
  if (key !== wasKey) {
    setWasKey(key);
    if (open) {
      onOpen();
    }
  }
}
