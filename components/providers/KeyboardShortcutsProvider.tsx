"use client";

import React, { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "?", description: "Show keyboard shortcuts" },
  { keys: "Escape", description: "Close dialog or sheet" },
  { keys: "Tab", description: "Navigate between focusable elements" },
];

function isInputLike(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  const role = target.getAttribute?.("role");
  const editable = target.getAttribute?.("contenteditable");
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    editable === "true" ||
    role === "textbox" ||
    role === "searchbox"
  );
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

/**
 * Provides global keyboard shortcut handling and a shortcuts help dialog.
 * Press ? (Shift+/) to open the dialog when not focused on an input.
 */
export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "?" || isInputLike(e.target as EventTarget | null)) return;
    e.preventDefault();
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          aria-describedby="keyboard-shortcuts-description"
        >
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription id="keyboard-shortcuts-description">
              Use these shortcuts anywhere in the app when not typing in a
              field.
            </DialogDescription>
          </DialogHeader>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {SHORTCUTS.map(({ keys, description }) => (
              <li
                key={keys}
                className="flex items-center justify-between gap-2 rounded-md border border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-2"
              >
                <kbd className="font-mono text-xs font-medium text-foreground rounded border border-white/20 dark:border-white/20 bg-white/10 dark:bg-white/10 px-2 py-1">
                  {keys}
                </kbd>
                <span>{description}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
