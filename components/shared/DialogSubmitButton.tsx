"use client";

/**
 * Dialog primary submit — spinner + dynamic pending label (warehouse + catalog dialogs).
 */
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_PRIMARY_BUTTON,
} from "@/components/shared";
import type { GlassFocusHue } from "@/lib/ui/focus-ring-styles";
import { cn } from "@/lib/utils";

export type DialogSubmitButtonProps = {
  isPending: boolean;
  pendingLabel: string;
  label: string;
  hue: GlassFocusHue;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

export function DialogSubmitButton({
  isPending,
  pendingLabel,
  label,
  hue,
  disabled,
  type = "submit",
  onClick,
  className,
}: DialogSubmitButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isPending}
      className={cn(
        GLASS_BUTTON_ICON_HOVER,
        GLASS_BUTTON_SHELL_RESET,
        GLASS_BUTTON_DISABLED,
        "w-full sm:w-auto gap-2 px-8 !text-white",
        GLASS_PRIMARY_BUTTON[hue],
        className,
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
