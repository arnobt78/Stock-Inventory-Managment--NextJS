import * as React from "react";

import { cn } from "@/lib/utils";
import {
  FOCUS_NO_LAYOUT_SHIFT_CLASS,
  FOCUS_VISIBLE_NEUTRAL_RING_CLASS,
} from "@/lib/ui/focus-ring-styles";

/**
 * Textarea component
 * Reusable textarea input with consistent styling matching Input component
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-2 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/50",
        FOCUS_NO_LAYOUT_SHIFT_CLASS,
        FOCUS_VISIBLE_NEUTRAL_RING_CLASS,
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
